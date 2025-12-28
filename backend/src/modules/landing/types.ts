/**
 * Landing Module Types
 * Module M06: Enhanced Landing + Dynamic Content
 */

export interface LandingStats {
  totalEquipment: number;
  activeRequests: number;
  completedMaintenance: number;
  systemUptime: number; // percentage
  averageResponseTime: number; // hours
  costSavings: number; // dollars
  userSatisfaction: number; // percentage
  teamsManaged: number;
  lastUpdated: string;
}

export interface SystemMetrics {
  performanceMetrics: {
    apiResponseTime: number; // ms
    systemAvailability: number; // percentage
    dataProcessingSpeed: number; // requests/second
    errorRate: number; // percentage
  };
  usageMetrics: {
    dailyActiveUsers: number;
    requestsProcessed: number;
    equipmentTracked: number;
    maintenanceScheduled: number;
  };
  efficiencyMetrics: {
    averageResolutionTime: number; // hours
    preventiveMaintenanceRate: number; // percentage
    costReductionAchieved: number; // percentage
    uptimeImprovement: number; // percentage
  };
}

export interface CustomerTestimonial {
  id: string;
  customerName: string;
  companyName: string;
  role: string;
  content: string;
  rating: number;
  industry: string;
  equipmentCount: number;
  costSavings?: number;
  uptimeImprovement?: number;
  avatar?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface LiveDemoData {
  sampleEquipment: Array<{
    id: string;
    name: string;
    category: string;
    status: string;
    healthScore: number;
    lastMaintenance: string;
  }>;
  sampleRequests: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    assignedTeam: string;
    createdAt: string;
  }>;
  sampleTeams: Array<{
    id: string;
    name: string;
    specialization: string;
    memberCount: number;
    activeRequests: number;
  }>;
  realTimeMetrics: {
    activeUsers: number;
    requestsToday: number;
    systemLoad: number;
    responseTime: number;
  };
}
