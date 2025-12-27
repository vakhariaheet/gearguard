/**
 * Team Types for Frontend
 * Matches the backend teams module types
 */

// Core Team Types
export interface Team {
  id: string;
  teamName: string;
  specialization: 'Mechanics' | 'Electricians' | 'IT Support' | 'HVAC' | 'General' | 'Facilities';
  description?: string;
  skills: string[];
  maxCapacity?: number;
  isActive: boolean;
  leadTechnician?: string;
  currentWorkload: number;
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

// API Request/Response Types
export interface CreateTeamRequest {
  teamName: string;
  specialization: Team['specialization'];
  description?: string;
  skills: string[];
  maxCapacity?: number;
  leadTechnician?: string;
}

export interface UpdateTeamRequest {
  teamName?: string;
  specialization?: Team['specialization'];
  description?: string;
  skills?: string[];
  maxCapacity?: number;
  leadTechnician?: string;
  isActive?: boolean;
}

export interface AddTeamMemberRequest {
  userId: string;
  role: TeamMember['role'];
  skills?: string[];
  certifications?: string[];
}

// User search types for team member addition
export interface UserSearchResult {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export interface UserSearchResponse {
  success: boolean;
  data: {
    users: UserSearchResult[];
    totalCount: number;
  };
}

export interface ListTeamsQuery {
  limit?: number;
  offset?: number;
  specialization?: string;
  isActive?: boolean;
  orderBy?: 'teamName' | 'specialization' | 'createdAt' | 'currentWorkload';
}

export interface ListTeamsResponse {
  success: boolean;
  data: {
    teams: Team[];
    totalCount: number;
  };
}

export interface TeamResponse {
  success: boolean;
  data: Team;
}

export interface TeamMemberResponse {
  success: boolean;
  data: TeamMember;
}

// Smart Team Assignment Types
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
  success: boolean;
  data: {
    recommendedTeam: Team;
    alternativeTeams: Team[];
    confidence: number;
    reasoning: string[];
    estimatedResponseTime: number;
    workloadImpact: 'Low' | 'Medium' | 'High';
    skillMatch: number;
  };
}

// API Error Type
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Utility Types
export type TeamSpecialization = Team['specialization'];
export type MemberRole = TeamMember['role'];
export type UrgencyLevel = TeamAssignmentRequest['urgency'];
export type WorkloadImpact = 'Low' | 'Medium' | 'High';
