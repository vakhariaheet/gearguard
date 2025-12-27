import { v4 as uuidv4 } from 'uuid';
import { dynamodb } from '../../../shared/clients/dynamodb';
import { gemini } from '../../../shared/clients/gemini';
import { createLogger } from '../../../shared/logger';
import {
  Equipment,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  ListEquipmentQuery,
  ListEquipmentResponse,
  HealthAssessmentRequest,
  HealthAssessmentResponse,
  EquipmentDynamoItem,
  EquipmentOwnershipItem,
} from '../types';

const logger = createLogger('EquipmentService');

export class EquipmentService {
  /**
   * Create new equipment
   */
  async createEquipment(data: CreateEquipmentRequest): Promise<Equipment> {
    const equipmentId = uuidv4();
    const now = new Date().toISOString();

    // Check if serial number already exists
    const existingEquipment = await this.getEquipmentBySerialNumber(data.serialNumber);
    if (existingEquipment) {
      throw new Error('Equipment with this serial number already exists');
    }

    const equipment: Equipment = {
      id: equipmentId,
      equipmentName: data.equipmentName,
      serialNumber: data.serialNumber,
      category: data.category,
      department: data.department,
      assignedEmployee: data.assignedEmployee,
      assignedTeam: data.assignedTeam,
      purchaseDate: data.purchaseDate,
      warrantyExpiry: data.warrantyExpiry,
      location: data.location,
      status: data.status || 'Active',
      specifications: data.specifications,
      usageHours: data.usageHours,
      lastMaintenanceDate: data.lastMaintenanceDate,
      createdAt: now,
      updatedAt: now,
    };

    // Create main equipment record
    const equipmentItem: EquipmentDynamoItem = {
      PK: `EQUIPMENT#${equipmentId}`,
      SK: 'DETAILS',
      GSI1PK: `DEPT#${data.department}`,
      GSI1SK: `EQUIPMENT#${equipmentId}`,
      ...equipment,
    };

    await dynamodb.put(equipmentItem as unknown as Record<string, unknown>);

    // Create ownership record if assigned to employee
    if (data.assignedEmployee) {
      const ownershipItem: EquipmentOwnershipItem = {
        PK: `EQUIPMENT#${equipmentId}`,
        SK: `OWNER#${data.assignedEmployee}`,
        GSI1PK: `EMPLOYEE#${data.assignedEmployee}`,
        GSI1SK: `EQUIPMENT#${equipmentId}`,
        equipmentId,
        employeeId: data.assignedEmployee,
        assignedAt: now,
      };

      await dynamodb.put(ownershipItem as unknown as Record<string, unknown>);
    }

    logger.info('Equipment created successfully', { equipmentId, serialNumber: data.serialNumber });
    return equipment;
  }

  /**
   * Get equipment by ID
   */
  async getEquipment(equipmentId: string): Promise<Equipment | null> {
    const result = await dynamodb.get<EquipmentDynamoItem>({
      PK: `EQUIPMENT#${equipmentId}`,
      SK: 'DETAILS',
    });

    if (!result) {
      return null;
    }

    // Remove DynamoDB keys from response
    const { PK, SK, GSI1PK, GSI1SK, ...equipment } = result;
    return equipment as Equipment;
  }

  /**
   * Get equipment by serial number
   */
  async getEquipmentBySerialNumber(serialNumber: string): Promise<Equipment | null> {
    const result = await dynamodb.scan<EquipmentDynamoItem>({
      filterExpression: 'serialNumber = :serialNumber',
      expressionAttributeValues: {
        ':serialNumber': serialNumber,
      },
    });

    if (result.items.length === 0) {
      return null;
    }

    const item = result.items[0];
    if (!item) {
      return null;
    }

    const { PK, SK, GSI1PK, GSI1SK, ...equipment } = item;
    return equipment as Equipment;
  }

  /**
   * Update equipment
   */
  async updateEquipment(equipmentId: string, updates: UpdateEquipmentRequest): Promise<Equipment> {
    // Check if equipment exists
    const existing = await this.getEquipment(equipmentId);
    if (!existing) {
      throw new Error('Equipment not found');
    }

    // Check serial number uniqueness if being updated
    if (updates.serialNumber && updates.serialNumber !== existing.serialNumber) {
      const existingWithSerial = await this.getEquipmentBySerialNumber(updates.serialNumber);
      if (existingWithSerial) {
        throw new Error('Equipment with this serial number already exists');
      }
    }

    // Update main equipment record
    const updatedEquipment = await dynamodb.update<EquipmentDynamoItem>(
      {
        PK: `EQUIPMENT#${equipmentId}`,
        SK: 'DETAILS',
      },
      updates,
      {
        // Update GSI1PK if department changed
        ...(updates.department && {
          expressionAttributeNames: { '#gsi1pk': 'GSI1PK' },
          expressionAttributeValues: { ':gsi1pk': `DEPT#${updates.department}` },
        }),
      }
    );

    // Handle employee assignment changes
    if (updates.assignedEmployee !== undefined) {
      // Remove old ownership record if exists
      if (existing.assignedEmployee) {
        await dynamodb.delete({
          PK: `EQUIPMENT#${equipmentId}`,
          SK: `OWNER#${existing.assignedEmployee}`,
        });
      }

      // Create new ownership record if assigned
      if (updates.assignedEmployee) {
        const ownershipItem: EquipmentOwnershipItem = {
          PK: `EQUIPMENT#${equipmentId}`,
          SK: `OWNER#${updates.assignedEmployee}`,
          GSI1PK: `EMPLOYEE#${updates.assignedEmployee}`,
          GSI1SK: `EQUIPMENT#${equipmentId}`,
          equipmentId,
          employeeId: updates.assignedEmployee,
          assignedAt: new Date().toISOString(),
        };

        await dynamodb.put(ownershipItem as unknown as Record<string, unknown>);
      }
    }

    const { PK, SK, GSI1PK, GSI1SK, ...equipment } = updatedEquipment;
    logger.info('Equipment updated successfully', { equipmentId });
    return equipment as Equipment;
  }

  /**
   * Delete equipment
   */
  async deleteEquipment(equipmentId: string): Promise<void> {
    const existing = await this.getEquipment(equipmentId);
    if (!existing) {
      throw new Error('Equipment not found');
    }

    // Delete main equipment record
    await dynamodb.delete({
      PK: `EQUIPMENT#${equipmentId}`,
      SK: 'DETAILS',
    });

    // Delete ownership record if exists
    if (existing.assignedEmployee) {
      await dynamodb.delete({
        PK: `EQUIPMENT#${equipmentId}`,
        SK: `OWNER#${existing.assignedEmployee}`,
      });
    }

    logger.info('Equipment deleted successfully', { equipmentId });
  }

  /**
   * List equipment with filtering and pagination
   */
  async listEquipment(query: ListEquipmentQuery): Promise<ListEquipmentResponse> {
    const { limit = 20, offset = 0, department, category, status, assignedTeam, search } = query;

    let result;

    if (department) {
      // Query by department using GSI1
      result = await dynamodb.query<EquipmentDynamoItem>(
        'GSI1PK = :gsi1pk',
        { ':gsi1pk': `DEPT#${department}` },
        {
          indexName: 'GSI1',
          limit: limit + offset, // Get more to handle offset
        }
      );
    } else {
      // Scan all equipment
      result = await dynamodb.scan<EquipmentDynamoItem>({
        filterExpression: 'SK = :sk',
        expressionAttributeValues: { ':sk': 'DETAILS' },
        limit: limit + offset,
      });
    }

    let equipment = result.items.map((item) => {
      const { PK, SK, GSI1PK, GSI1SK, ...eq } = item;
      return eq as Equipment;
    });

    // Apply additional filters
    if (category) {
      equipment = equipment.filter((eq) => eq.category === category);
    }
    if (status) {
      equipment = equipment.filter((eq) => eq.status === status);
    }
    if (assignedTeam) {
      equipment = equipment.filter((eq) => eq.assignedTeam === assignedTeam);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      equipment = equipment.filter(
        (eq) =>
          (eq.equipmentName && eq.equipmentName.toLowerCase().includes(searchLower)) ||
          (eq.serialNumber && eq.serialNumber.toLowerCase().includes(searchLower)) ||
          (eq.location && eq.location.toLowerCase().includes(searchLower)) ||
          (eq.department && eq.department.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination
    const totalCount = equipment.length;
    const paginatedEquipment = equipment.slice(offset, offset + limit);

    return {
      equipment: paginatedEquipment,
      totalCount,
    };
  }

  /**
   * Assess equipment health using AI
   */
  async assessEquipmentHealth(params: HealthAssessmentRequest): Promise<HealthAssessmentResponse> {
    try {
      // Get equipment details
      const equipment = await this.getEquipment(params.equipmentId);
      if (!equipment) {
        throw new Error('Equipment not found');
      }

      // Calculate age factor (0-100, higher is worse)
      const ageInYears =
        (Date.now() - new Date(equipment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      const ageFactor = Math.min(ageInYears * 10, 100);

      // Calculate usage factor
      const usageFactor = params.usageHours ? Math.min(params.usageHours / 100, 100) : 50;

      // Calculate maintenance factor (days since last maintenance)
      let maintenanceFactor = 50;
      if (equipment.lastMaintenanceDate) {
        const daysSinceLastMaintenance =
          (Date.now() - new Date(equipment.lastMaintenanceDate).getTime()) / (1000 * 60 * 60 * 24);
        maintenanceFactor = Math.min((daysSinceLastMaintenance / 30) * 10, 100);
      }

      // Calculate performance factor
      const performanceFactor = params.performanceMetrics
        ? 100 -
          params.performanceMetrics.efficiency +
          params.performanceMetrics.errorRate +
          params.performanceMetrics.downtime
        : 30;

      // Use AI to generate comprehensive assessment
      const aiPrompt = `Analyze equipment health for maintenance prediction:

Equipment: ${equipment.equipmentName} (${equipment.category})
Age: ${ageInYears.toFixed(1)} years
Usage Hours: ${params.usageHours || 'Unknown'}
Last Maintenance: ${equipment.lastMaintenanceDate || 'Never'}
Current Status: ${equipment.status}

Factors:
- Age Factor: ${ageFactor.toFixed(1)}/100
- Usage Factor: ${usageFactor.toFixed(1)}/100  
- Maintenance Factor: ${maintenanceFactor.toFixed(1)}/100
- Performance Factor: ${performanceFactor.toFixed(1)}/100

Generate a health assessment with:
1. Overall health score (0-100, higher is better)
2. Risk level (Low/Medium/High/Critical)
3. 3-5 specific maintenance recommendations
4. Predicted next maintenance date (if applicable)

Consider equipment type, age, usage patterns, and maintenance history.`;

      const aiResponse = await gemini.generateJSON<{
        healthScore: number;
        riskLevel: string;
        recommendations: string[];
        predictedMaintenanceDate: string | null;
        reasoning: string;
      }>(aiPrompt);

      // Calculate overall health score (weighted average, inverted for health)
      const calculatedHealthScore = Math.max(
        0,
        100 -
          (ageFactor * 0.2 + usageFactor * 0.3 + maintenanceFactor * 0.3 + performanceFactor * 0.2)
      );

      // Use AI score if reasonable, otherwise use calculated
      const finalHealthScore =
        aiResponse.healthScore && aiResponse.healthScore >= 0 && aiResponse.healthScore <= 100
          ? aiResponse.healthScore
          : Math.round(calculatedHealthScore);

      // Determine risk level based on health score
      let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
      if (finalHealthScore >= 80) riskLevel = 'Low';
      else if (finalHealthScore >= 60) riskLevel = 'Medium';
      else if (finalHealthScore >= 40) riskLevel = 'High';
      else riskLevel = 'Critical';

      // Generate default recommendations if AI didn't provide good ones
      const defaultRecommendations = [
        `Schedule routine inspection for ${equipment.equipmentName}`,
        'Check warranty status and coverage options',
        'Review usage patterns and optimize operation schedule',
        'Update maintenance logs and documentation',
      ];

      return {
        equipmentId: params.equipmentId,
        healthScore: finalHealthScore,
        riskLevel: (aiResponse.riskLevel as 'Low' | 'Medium' | 'High' | 'Critical') || riskLevel,
        recommendations:
          aiResponse.recommendations?.length > 0
            ? aiResponse.recommendations
            : defaultRecommendations,
        predictedMaintenanceDate: aiResponse.predictedMaintenanceDate || undefined,
        confidence: 0.85,
        factors: {
          age: Math.round(ageFactor),
          usage: Math.round(usageFactor),
          maintenance: Math.round(maintenanceFactor),
          performance: Math.round(performanceFactor),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Equipment health assessment failed', error);
      throw new Error(`Health assessment failed: ${error.message}`);
    }
  }
}

export const equipmentService = new EquipmentService();
