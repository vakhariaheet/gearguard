// =============================================================================
// EQUIPMENT TYPES - Equipment Management Module (F01)
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

/** POST /api/equipment */
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

/** PUT /api/equipment/:id */
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

/** GET /api/equipment query params */
export interface ListEquipmentQuery {
  limit?: number;
  offset?: number;
  department?: string;
  category?: string;
  status?: string;
  assignedTeam?: string;
  search?: string; // Search by name or serial number
}

/** GET /api/equipment response */
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
// DynamoDB Schema Types
// -----------------------------------------------------------------------------

export interface EquipmentDynamoItem {
  PK: string; // EQUIPMENT#${id}
  SK: string; // DETAILS
  GSI1PK: string; // DEPT#${department}
  GSI1SK: string; // EQUIPMENT#${id}

  // Equipment fields
  id: string;
  equipmentName: string;
  serialNumber: string;
  category: string;
  department: string;
  assignedEmployee?: string;
  assignedTeam: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  location: string;
  status: string;
  specifications?: Record<string, any>;
  usageHours?: number;
  lastMaintenanceDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentOwnershipItem {
  PK: string; // EQUIPMENT#${id}
  SK: string; // OWNER#${employeeId}
  GSI1PK: string; // EMPLOYEE#${employeeId}
  GSI1SK: string; // EQUIPMENT#${id}

  equipmentId: string;
  employeeId: string;
  assignedAt: string;
}
