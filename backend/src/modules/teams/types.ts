// =============================================================================
// TEAMS TYPES - Maintenance Teams Module
// =============================================================================

// -----------------------------------------------------------------------------
// Core Team Types
// -----------------------------------------------------------------------------

export interface Team {
  id: string;
  teamName: string;
  specialization: 'Mechanics' | 'Electricians' | 'IT Support' | 'HVAC' | 'General' | 'Facilities';
  description?: string;
  skills: string[];
  maxCapacity?: number;
  isActive: boolean;
  leadTechnician?: string;
  leadTechnicianName?: string; // Enriched field for display purposes
  currentWorkload: number; // number of active requests
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  userId: string;
  userName: string;
  email: string;
  role: 'Lead' | 'Senior' | 'Junior' | 'Trainee';
  joinedAt: string;
  skills?: string[];
  certifications?: string[];
  isActive: boolean;
  currentRequests: number;
}

// -----------------------------------------------------------------------------
// Request/Response Types
// -----------------------------------------------------------------------------

/** POST /api/teams */
export interface CreateTeamRequest {
  teamName: string;
  specialization: Team['specialization'];
  description?: string;
  skills: string[];
  maxCapacity?: number;
  leadTechnician?: string;
}

/** PUT /api/teams/:id */
export interface UpdateTeamRequest {
  teamName?: string;
  specialization?: Team['specialization'];
  description?: string;
  skills?: string[];
  maxCapacity?: number;
  leadTechnician?: string;
  isActive?: boolean;
}

/** POST /api/teams/:id/members */
export interface AddTeamMemberRequest {
  userId: string;
  role: TeamMember['role'];
  skills?: string[];
  certifications?: string[];
}

/** GET /api/teams query params */
export interface ListTeamsQuery {
  limit?: number;
  offset?: number;
  specialization?: string;
  isActive?: boolean;
  orderBy?: 'teamName' | 'specialization' | 'createdAt' | 'currentWorkload';
}

/** GET /api/teams response */
export interface ListTeamsResponse {
  teams: Team[];
  totalCount: number;
}

// -----------------------------------------------------------------------------
// Smart Team Assignment Types
// -----------------------------------------------------------------------------

export interface TeamAssignmentRequest {
  equipmentId: string;
  equipmentCategory: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  requiredSkills?: string[];
  preferredTeam?: string;
  location?: string;
  description?: string;
}

export interface TeamAssignmentResponse {
  recommendedTeam: Team;
  alternativeTeams: Team[];
  confidence: number;
  reasoning: string[];
  estimatedResponseTime: number; // in hours
  workloadImpact: 'Low' | 'Medium' | 'High';
  skillMatch: number; // 0-100 percentage
}

// -----------------------------------------------------------------------------
// Database Schema Types
// -----------------------------------------------------------------------------

export interface TeamRecord {
  PK: string; // TEAM#[id]
  SK: string; // DETAILS
  GSI1PK: string; // SPECIALIZATION#[type]
  GSI1SK: string; // TEAM#[id]
  GSI2PK: string; // ALL_TEAMS (for listing all teams)
  GSI2SK: string; // TEAM#[id]
  id: string;
  teamName: string;
  specialization: Team['specialization'];
  description?: string;
  skills: string[];
  maxCapacity?: number;
  isActive: boolean;
  leadTechnician?: string;
  currentWorkload: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberRecord {
  PK: string; // TEAM#[id]
  SK: string; // MEMBER#[userId]
  GSI1PK: string; // USER#[userId]
  GSI1SK: string; // TEAM#[id]
  teamId: string;
  userId: string;
  userName: string;
  email: string;
  role: TeamMember['role'];
  joinedAt: string;
  skills?: string[];
  certifications?: string[];
  isActive: boolean;
  currentRequests: number;
}

// -----------------------------------------------------------------------------
// Helper Types
// -----------------------------------------------------------------------------

export interface TeamScore {
  total: number;
  specialization: number;
  skillMatch: number;
  availability: number;
  experience: number;
}

export interface TeamWithScore {
  team: Team;
  score: TeamScore;
}
