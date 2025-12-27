// =============================================================================
// EQUIPMENT TYPES - Frontend Types for Equipment Management
// =============================================================================

// -----------------------------------------------------------------------------
// Equipment Entity
// -----------------------------------------------------------------------------
export interface Equipment {
  id: string;
  equipmentName: string;
  serialNumber: string;
  category: 'Machine' | 'Vehicle' | 'Computer' | 'Tool' | 'Other';
  department: string;
  assignedEmployee?: string;
  assignedTeam: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  location: string;
  status: 'Active' | 'Under Maintenance' | 'Scrapped';
  specifications?: Record<string, any>;
  usageHours?: number;
  lastMaintenanceDate?: string;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Request Types
// -----------------------------------------------------------------------------
export interface CreateEquipmentRequest {
  equipmentName: string;
  serialNumber: string;
  category: 'Machine' | 'Vehicle' | 'Computer' | 'Tool' | 'Other';
  department: string;
  assignedEmployee?: string;
  assignedTeam: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  location: string;
  status?: 'Active' | 'Under Maintenance' | 'Scrapped';
  specifications?: Record<string, any>;
  usageHours?: number;
  lastMaintenanceDate?: string;
}

export interface UpdateEquipmentRequest {
  equipmentName?: string;
  serialNumber?: string;
  category?: 'Machine' | 'Vehicle' | 'Computer' | 'Tool' | 'Other';
  department?: string;
  assignedEmployee?: string;
  assignedTeam?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  location?: string;
  status?: 'Active' | 'Under Maintenance' | 'Scrapped';
  specifications?: Record<string, any>;
  usageHours?: number;
  lastMaintenanceDate?: string;
}

// -----------------------------------------------------------------------------
// Query & Response Types
// -----------------------------------------------------------------------------
export interface ListEquipmentQuery {
  limit?: number;
  offset?: number;
  department?: string;
  category?: string;
  status?: string;
  assignedTeam?: string;
  search?: string;
}

export interface ListEquipmentResponse {
  equipment: Equipment[];
  totalCount: number;
}

// -----------------------------------------------------------------------------
// Health Assessment Types
// -----------------------------------------------------------------------------
export interface HealthAssessmentRequest {
  equipmentId: string;
  usageHours?: number;
  performanceMetrics?: {
    efficiency: number;
    errorRate: number;
    downtime: number;
  };
  environmentalFactors?: {
    temperature: number;
    humidity: number;
    vibration: number;
  };
}

export interface HealthAssessmentResponse {
  equipmentId: string;
  healthScore: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendations: string[];
  predictedMaintenanceDate?: string;
  confidence: number;
  factors: {
    age: number;
    usage: number;
    maintenance: number;
    performance: number;
  };
  timestamp: string;
}

// -----------------------------------------------------------------------------
// M05 Enhancement: Predictive Maintenance Types
// -----------------------------------------------------------------------------

export interface EquipmentHealth {
  equipmentId: string;
  healthScore: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  lastAssessment: string;
  performanceMetrics: {
    efficiency: number; // 0-100
    uptime: number; // 0-100
    errorRate: number; // errors per hour
    energyConsumption?: number; // kWh
    vibrationLevel?: number; // 0-100
    temperature?: number; // Celsius
  };
  trendAnalysis: {
    efficiencyTrend: 'Improving' | 'Stable' | 'Declining';
    uptimeTrend: 'Improving' | 'Stable' | 'Declining';
    overallTrend: 'Improving' | 'Stable' | 'Declining';
  };
  alerts: HealthAlert[];
}

export interface HealthAlert {
  id: string;
  type: 'Warning' | 'Critical' | 'Info';
  message: string;
  severity: number; // 1-10
  createdAt: string;
  acknowledged: boolean;
}

export interface PredictiveMaintenanceRequest {
  equipmentId: string;
  analysisType: 'Quick' | 'Comprehensive' | 'Scheduled';
  includeEnvironmental?: boolean;
  forecastDays?: number; // Default 90 days
}

export interface PredictiveMaintenanceResponse {
  equipmentId: string;
  analysisDate: string;
  forecastPeriod: number; // days
  predictions: {
    failureProbability: number; // 0-1
    predictedFailureDate?: string;
    optimalMaintenanceDate: string;
    confidenceLevel: number; // 0-1
    criticalComponents: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[]; // 1-4 weeks
    longTerm: string[]; // 1-6 months
  };
  costAnalysis: {
    preventiveCost: number;
    emergencyRepairCost: number;
    potentialSavings: number;
  };
  riskFactors: Array<{
    factor: string;
    impact: number; // 0-100
    description: string;
  }>;
}

export interface SmartScheduleRequest {
  equipmentId: string;
  maintenanceType: 'Routine' | 'Preventive' | 'Predictive';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedDuration?: number; // hours
  requiredSkills?: string[];
  preferredTeam?: string;
}

export interface SmartScheduleResponse {
  recommendedDate: string;
  alternativeDates: string[];
  assignedTeam: string;
  estimatedDuration: number;
  reasoning: string[];
  conflictWarnings: string[];
  optimizationScore: number; // 0-100
}

// -----------------------------------------------------------------------------
// Form Types
// -----------------------------------------------------------------------------
export interface EquipmentFormData {
  equipmentName: string;
  serialNumber: string;
  category: string;
  department: string;
  assignedEmployee: string;
  assignedTeam: string;
  purchaseDate: string;
  warrantyExpiry: string;
  location: string;
  status: string;
  specifications: string; // JSON string
  usageHours: string;
  lastMaintenanceDate: string;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
export const EQUIPMENT_CATEGORIES = ['Machine', 'Vehicle', 'Computer', 'Tool', 'Other'] as const;

export const EQUIPMENT_STATUSES = ['Active', 'Under Maintenance', 'Scrapped'] as const;

export const DEPARTMENTS = [
  'Production',
  'IT',
  'Maintenance',
  'Operations',
  'Quality Control',
  'Logistics',
  'Administration',
] as const;

export const MAINTENANCE_TEAMS = [
  'Team A',
  'Team B',
  'Team C',
  'Electrical Team',
  'Mechanical Team',
  'IT Support',
] as const;
