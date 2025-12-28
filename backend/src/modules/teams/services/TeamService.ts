import { v4 as uuidv4 } from 'uuid';
import { dynamodb } from '../../../shared/clients/dynamodb';
import { gemini } from '../../../shared/clients/gemini';
import { createLogger } from '../../../shared/logger';
import { ClerkUserService } from '../../users/services/ClerkUserService';
import {
  Team,
  TeamMember,
  TeamRecord,
  TeamMemberRecord,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMemberRequest,
  ListTeamsQuery,
  ListTeamsResponse,
  TeamAssignmentRequest,
  TeamAssignmentResponse,
  TeamScore,
} from '../types';

const logger = createLogger('TeamService');
const clerkUserService = new ClerkUserService();

export class TeamService {
  /**
   * Create a new team
   */
  async createTeam(request: CreateTeamRequest): Promise<Team> {
    const teamId = uuidv4();
    const now = new Date().toISOString();

    const teamRecord: TeamRecord = {
      PK: `TEAM#${teamId}`,
      SK: 'DETAILS',
      GSI1PK: `SPECIALIZATION#${request.specialization}`,
      GSI1SK: `TEAM#${teamId}`,
      GSI2PK: 'ALL_TEAMS', // For efficient listing of all teams
      GSI2SK: `TEAM#${teamId}`,
      id: teamId,
      teamName: request.teamName,
      specialization: request.specialization,
      description: request.description,
      skills: request.skills,
      maxCapacity: request.maxCapacity || 10,
      isActive: true,
      leadTechnician: request.leadTechnician,
      currentWorkload: 0,
      createdAt: now,
      updatedAt: now,
    };

    await dynamodb.put(teamRecord as any);

    logger.info(`Team created: ${teamId} - ${request.teamName}`);

    return this.mapRecordToTeam(teamRecord, []);
  }

  /**
   * Get team by ID with members
   */
  async getTeam(teamId: string): Promise<Team | null> {
    // Get team details
    const teamRecord = await dynamodb.get<TeamRecord>({
      PK: `TEAM#${teamId}`,
      SK: 'DETAILS',
    });

    if (!teamRecord) {
      return null;
    }

    // Get team members
    const membersResult = await dynamodb.query('PK = :pk AND begins_with(SK, :sk)', {
      ':pk': `TEAM#${teamId}`,
      ':sk': 'MEMBER#',
    });

    const members = membersResult.items.map((record: any) =>
      this.mapRecordToTeamMember(record as TeamMemberRecord)
    );

    return this.mapRecordToTeam(teamRecord, members);
  }

  /**
   * List teams with pagination and filtering
   */
  async listTeams(query: ListTeamsQuery = {}): Promise<ListTeamsResponse> {
    const { limit = 20, offset = 0, specialization, isActive, orderBy = 'createdAt' } = query;

    let result: any;

    if (specialization) {
      // Query by specialization using GSI1
      const queryExpression = 'GSI1PK = :gsi1pk';
      const expressionAttributeValues: Record<string, any> = {
        ':gsi1pk': `SPECIALIZATION#${specialization}`,
      };

      // Add active filter if specified
      let filterExpression: string | undefined;
      if (isActive !== undefined) {
        filterExpression = 'isActive = :isActive';
        expressionAttributeValues[':isActive'] = isActive;
      }

      result = await dynamodb.query(queryExpression, expressionAttributeValues, {
        indexName: 'GSI1',
        filterExpression,
        limit: limit + offset, // Get more to handle offset
      });
    } else {
      // For now, use scan approach since existing records don't have GSI2 fields
      // TODO: Migrate existing records to include GSI2PK/GSI2SK, then switch to GSI2 query
      const scanOptions: any = {
        filterExpression: 'begins_with(PK, :pkPrefix) AND SK = :sk',
        expressionAttributeValues: {
          ':pkPrefix': 'TEAM#',
          ':sk': 'DETAILS',
        },
        limit: limit + offset,
      };

      // Add active filter if specified
      if (isActive !== undefined) {
        scanOptions.filterExpression += ' AND isActive = :isActive';
        scanOptions.expressionAttributeValues[':isActive'] = isActive;
      }

      result = await dynamodb.scan(scanOptions);

      logger.info(
        `Scan result: ${JSON.stringify({
          count: result.count,
          itemsLength: result.items?.length,
          firstItem: result.items?.[0] ? JSON.stringify(result.items[0]) : 'none',
        })}`
      );
    }

    // Apply offset and limit manually
    const paginatedItems = result.items.slice(offset, offset + limit);

    logger.info(
      `Pagination: total=${result.items?.length}, offset=${offset}, limit=${limit}, paginated=${paginatedItems?.length}`
    );

    // Get members for each team and enrich lead technician details
    const teamsWithMembers = await Promise.all(
      paginatedItems.map(async (teamRecord: any) => {
        const membersResult = await dynamodb.query('PK = :pk AND begins_with(SK, :sk)', {
          ':pk': teamRecord.PK,
          ':sk': 'MEMBER#',
        });

        const members = membersResult.items.map((record: any) =>
          this.mapRecordToTeamMember(record as TeamMemberRecord)
        );

        // Enrich lead technician details if not already in members
        let enrichedTeamRecord = teamRecord;
        if (teamRecord.leadTechnician) {
          const leadMember = members.find((m) => m.userId === teamRecord.leadTechnician);
          if (!leadMember) {
            // Fetch lead technician details from Clerk
            try {
              const leadUser = await clerkUserService.getUserById(teamRecord.leadTechnician);
              enrichedTeamRecord = {
                ...teamRecord,
                leadTechnicianName:
                  `${leadUser.firstName || ''} ${leadUser.lastName || ''}`.trim() ||
                  leadUser.email ||
                  'Unknown',
              };
            } catch (error) {
              logger.warn(
                `Failed to fetch lead technician details for ${teamRecord.leadTechnician}:`,
                error
              );
              enrichedTeamRecord = {
                ...teamRecord,
                leadTechnicianName: 'Unknown',
              };
            }
          }
        }

        return this.mapRecordToTeam(enrichedTeamRecord as TeamRecord, members);
      })
    );

    logger.info(`Teams with members: ${teamsWithMembers.length}`);

    // Sort by specified field
    teamsWithMembers.sort((a, b) => {
      switch (orderBy) {
        case 'teamName':
          return a.teamName.localeCompare(b.teamName);
        case 'specialization':
          return a.specialization.localeCompare(b.specialization);
        case 'currentWorkload':
          return b.currentWorkload - a.currentWorkload;
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return {
      teams: teamsWithMembers,
      totalCount: result.count,
    };
  }

  /**
   * Update team
   */
  async updateTeam(teamId: string, request: UpdateTeamRequest): Promise<Team> {
    const now = new Date().toISOString();
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Build update expression dynamically
    if (request.teamName !== undefined) {
      updateExpression.push('#teamName = :teamName');
      expressionAttributeNames['#teamName'] = 'teamName';
      expressionAttributeValues[':teamName'] = request.teamName;
    }

    if (request.specialization !== undefined) {
      updateExpression.push('#specialization = :specialization');
      updateExpression.push('GSI1PK = :gsi1pk');
      expressionAttributeNames['#specialization'] = 'specialization';
      expressionAttributeValues[':specialization'] = request.specialization;
      expressionAttributeValues[':gsi1pk'] = `SPECIALIZATION#${request.specialization}`;
    }

    if (request.description !== undefined) {
      updateExpression.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = request.description;
    }

    if (request.skills !== undefined) {
      updateExpression.push('#skills = :skills');
      expressionAttributeNames['#skills'] = 'skills';
      expressionAttributeValues[':skills'] = request.skills;
    }

    if (request.maxCapacity !== undefined) {
      updateExpression.push('#maxCapacity = :maxCapacity');
      expressionAttributeNames['#maxCapacity'] = 'maxCapacity';
      expressionAttributeValues[':maxCapacity'] = request.maxCapacity;
    }

    if (request.leadTechnician !== undefined) {
      updateExpression.push('#leadTechnician = :leadTechnician');
      expressionAttributeNames['#leadTechnician'] = 'leadTechnician';
      expressionAttributeValues[':leadTechnician'] = request.leadTechnician;
    }

    if (request.isActive !== undefined) {
      updateExpression.push('#isActive = :isActive');
      expressionAttributeNames['#isActive'] = 'isActive';
      expressionAttributeValues[':isActive'] = request.isActive;
    }

    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = now;

    if (updateExpression.length === 1) {
      // Only updatedAt was added, no actual changes
      throw new Error('No fields to update');
    }

    await dynamodb.update(
      { PK: `TEAM#${teamId}`, SK: 'DETAILS' },
      {
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }
    );

    logger.info(`Team updated: ${teamId}`);

    // Return updated team
    const updatedTeam = await this.getTeam(teamId);
    if (!updatedTeam) {
      throw new Error('Team not found after update');
    }

    return updatedTeam;
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId: string): Promise<void> {
    // First, remove all team members
    const membersResult = await dynamodb.query('PK = :pk AND begins_with(SK, :sk)', {
      ':pk': `TEAM#${teamId}`,
      ':sk': 'MEMBER#',
    });

    // Delete all members
    for (const member of membersResult.items) {
      await dynamodb.delete({
        PK: (member as any).PK,
        SK: (member as any).SK,
      });
    }

    // Delete team details
    await dynamodb.delete({
      PK: `TEAM#${teamId}`,
      SK: 'DETAILS',
    });

    logger.info(`Team deleted: ${teamId}`);
  }

  /**
   * Add team member
   */
  async addTeamMember(teamId: string, request: AddTeamMemberRequest): Promise<TeamMember> {
    // Check if team exists
    const team = await this.getTeam(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Check if user is already a member
    const existingMember = await dynamodb.get<TeamMemberRecord>({
      PK: `TEAM#${teamId}`,
      SK: `MEMBER#${request.userId}`,
    });

    if (existingMember) {
      throw new Error('User is already a team member');
    }

    // Fetch real user data from Clerk
    let clerkUser;
    try {
      clerkUser = await clerkUserService.getUserById(request.userId);
    } catch (error) {
      logger.error(`Failed to fetch user from Clerk: ${request.userId}`, error);
      throw new Error('User not found in system');
    }

    const now = new Date().toISOString();

    // Create team member record with real user data
    const memberRecord: TeamMemberRecord = {
      PK: `TEAM#${teamId}`,
      SK: `MEMBER#${request.userId}`,
      GSI1PK: `USER#${request.userId}`,
      GSI1SK: `TEAM#${teamId}`,
      teamId,
      userId: request.userId,
      userName:
        `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.email,
      email: clerkUser.email,
      role: request.role,
      joinedAt: now,
      skills: request.skills,
      certifications: request.certifications,
      isActive: true,
      currentRequests: 0,
    };

    await dynamodb.put(memberRecord as any);

    logger.info(`Team member added: ${request.userId} (${clerkUser.email}) to team ${teamId}`);

    return this.mapRecordToTeamMember(memberRecord);
  }

  /**
   * Remove team member
   */
  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await dynamodb.delete({
      PK: `TEAM#${teamId}`,
      SK: `MEMBER#${userId}`,
    });

    logger.info(`Team member removed: ${userId} from team ${teamId}`);
  }

  /**
   * Smart team assignment using AI
   */
  async suggestTeamAssignment(params: TeamAssignmentRequest): Promise<TeamAssignmentResponse> {
    try {
      // Get all active teams
      const teamsResult = await this.listTeams({ isActive: true });

      if (teamsResult.teams.length === 0) {
        throw new Error('No active teams available');
      }

      // Calculate scores for each team
      const teamScores = await Promise.all(
        teamsResult.teams.map(async (team) => {
          const score = await this.calculateTeamScore(team, params);
          return { team, score };
        })
      );

      // Sort by score (highest first)
      teamScores.sort((a, b) => b.score.total - a.score.total);

      if (teamScores.length === 0) {
        throw new Error('No teams available for scoring');
      }

      const bestTeam = teamScores[0]!; // We know it exists because we checked length
      const alternativeTeams = teamScores.slice(1, 4).map((ts) => ts.team);

      // Use AI to generate reasoning
      const aiPrompt = `Analyze team assignment for maintenance request:

Equipment: ${params.equipmentCategory}
Urgency: ${params.urgency}
Required Skills: ${params.requiredSkills?.join(', ') || 'None specified'}

Recommended Team: ${bestTeam.team.teamName}
- Specialization: ${bestTeam.team.specialization}
- Skills: ${bestTeam.team.skills.join(', ')}
- Current Workload: ${bestTeam.team.currentWorkload}/${bestTeam.team.maxCapacity || 10}
- Members: ${bestTeam.team.members.length}

Provide 3-4 specific reasons why this team is the best choice for this maintenance request.
Focus on skill match, availability, specialization alignment, and response time.`;

      const aiResponse = await gemini.generateJSON<{
        reasoning: string[];
        estimatedResponseTime: number;
        workloadImpact: string;
      }>(aiPrompt);

      // Calculate estimated response time based on urgency and workload
      const baseResponseTime = this.getBaseResponseTime(params.urgency);
      const workloadMultiplier =
        1 + bestTeam.team.currentWorkload / (bestTeam.team.maxCapacity || 10);
      const estimatedResponseTime = Math.round(baseResponseTime * workloadMultiplier);

      // Determine workload impact
      const workloadPercentage = bestTeam.team.currentWorkload / (bestTeam.team.maxCapacity || 10);
      let workloadImpact: 'Low' | 'Medium' | 'High';
      if (workloadPercentage < 0.5) workloadImpact = 'Low';
      else if (workloadPercentage < 0.8) workloadImpact = 'Medium';
      else workloadImpact = 'High';

      return {
        recommendedTeam: bestTeam.team,
        alternativeTeams,
        confidence: bestTeam.score.total / 100,
        reasoning: aiResponse.reasoning || [
          `Specializes in ${bestTeam.team.specialization} matching equipment type`,
          `Team has required skills: ${bestTeam.team.skills.slice(0, 2).join(', ')}`,
          `Current workload allows for timely response`,
          `${bestTeam.team.members.length} qualified team members available`,
        ],
        estimatedResponseTime: aiResponse.estimatedResponseTime || estimatedResponseTime,
        workloadImpact: (aiResponse.workloadImpact as any) || workloadImpact,
        skillMatch: bestTeam.score.skillMatch,
      };
    } catch (error) {
      logger.error('Team assignment suggestion failed:', error);
      throw new Error(`Team suggestion failed: ${(error as any).message}`);
    }
  }

  /**
   * Calculate team score for assignment
   */
  private async calculateTeamScore(team: Team, params: TeamAssignmentRequest): Promise<TeamScore> {
    // Specialization match (0-30 points)
    const specializationScore = this.getSpecializationScore(
      team.specialization,
      params.equipmentCategory
    );

    // Skill match (0-30 points)
    const skillScore = this.getSkillMatchScore(team.skills, params.requiredSkills || []);

    // Availability (0-25 points)
    const availabilityScore = this.getAvailabilityScore(team);

    // Experience (0-15 points)
    const experienceScore = this.getExperienceScore(team);

    const total = specializationScore + skillScore + availabilityScore + experienceScore;

    return {
      total,
      specialization: specializationScore,
      skillMatch: Math.round((skillScore / 30) * 100),
      availability: availabilityScore,
      experience: experienceScore,
    };
  }

  private getSpecializationScore(teamSpec: string, equipmentCategory: string): number {
    const matches: Record<string, string[]> = {
      Mechanics: ['Machine', 'Vehicle', 'Equipment'],
      Electricians: ['Electrical', 'Computer', 'Electronics'],
      'IT Support': ['Computer', 'Network', 'Software'],
      HVAC: ['HVAC', 'Climate', 'Ventilation'],
      Facilities: ['Building', 'Infrastructure', 'General'],
      General: ['Tool', 'Furniture', 'Miscellaneous'],
    };

    const teamCategories = matches[teamSpec] || [];
    return teamCategories.includes(equipmentCategory) ? 30 : 10;
  }

  private getSkillMatchScore(teamSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 20; // Default score if no specific skills required

    const matchCount = requiredSkills.filter((skill) =>
      teamSkills.some(
        (teamSkill) =>
          teamSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(teamSkill.toLowerCase())
      )
    ).length;

    return Math.round((matchCount / requiredSkills.length) * 30);
  }

  private getAvailabilityScore(team: Team): number {
    const maxCapacity = team.maxCapacity || 10;
    const utilizationRate = team.currentWorkload / maxCapacity;

    if (utilizationRate < 0.5) return 25; // Low utilization
    if (utilizationRate < 0.7) return 20; // Medium utilization
    if (utilizationRate < 0.9) return 15; // High utilization
    return 5; // Very high utilization
  }

  private getExperienceScore(team: Team): number {
    const seniorMembers = team.members.filter(
      (m) => m.role === 'Lead' || m.role === 'Senior'
    ).length;

    if (team.members.length === 0) return 0;

    const experienceRatio = seniorMembers / team.members.length;
    return Math.round(experienceRatio * 15);
  }

  private getBaseResponseTime(urgency: string): number {
    switch (urgency) {
      case 'Critical':
        return 1;
      case 'High':
        return 4;
      case 'Medium':
        return 8;
      case 'Low':
        return 24;
      default:
        return 8;
    }
  }

  /**
   * Map database record to Team object
   */
  private mapRecordToTeam(record: TeamRecord, members: TeamMember[]): Team {
    return {
      id: record.id,
      teamName: record.teamName,
      specialization: record.specialization,
      description: record.description,
      skills: record.skills,
      maxCapacity: record.maxCapacity,
      isActive: record.isActive,
      leadTechnician: record.leadTechnician,
      leadTechnicianName: (record as any).leadTechnicianName, // Enriched field
      currentWorkload: record.currentWorkload,
      members,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Map database record to TeamMember object
   */
  private mapRecordToTeamMember(record: TeamMemberRecord): TeamMember {
    return {
      userId: record.userId,
      userName: record.userName,
      email: record.email,
      role: record.role,
      joinedAt: record.joinedAt,
      skills: record.skills,
      certifications: record.certifications,
      isActive: record.isActive,
      currentRequests: record.currentRequests,
    };
  }
}

// Export singleton instance
export const teamService = new TeamService();
