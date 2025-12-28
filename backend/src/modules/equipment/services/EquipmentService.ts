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
  // M05 Enhancement types
  EquipmentHealth,
  HealthAlert,
  PredictiveMaintenanceRequest,
  PredictiveMaintenanceResponse,
  SmartScheduleRequest,
  SmartScheduleResponse,
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
      // Query by department using GSI1 - filter for equipment records only
      result = await dynamodb.query<EquipmentDynamoItem>(
        'GSI1PK = :gsi1pk',
        { ':gsi1pk': `DEPT#${department}` },
        {
          indexName: 'GSI1',
          filterExpression: 'begins_with(PK, :pkPrefix)',
          expressionAttributeValues: { ':pkPrefix': 'EQUIPMENT#' },
          limit: limit + offset, // Get more to handle offset
        }
      );
    } else {
      // Scan all equipment - filter for equipment records only
      result = await dynamodb.scan<EquipmentDynamoItem>({
        filterExpression: 'SK = :sk AND begins_with(PK, :pkPrefix)',
        expressionAttributeValues: {
          ':sk': 'DETAILS',
          ':pkPrefix': 'EQUIPMENT#',
        },
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

  // =============================================================================
  // M05 ENHANCEMENT: PREDICTIVE MAINTENANCE METHODS
  // =============================================================================

  /**
   * Get current equipment health with enhanced metrics
   */
  async getEquipmentHealth(equipmentId: string): Promise<EquipmentHealth> {
    try {
      const equipment = await this.getEquipment(equipmentId);
      if (!equipment) {
        throw new Error('Equipment not found');
      }

      // Get performance data for trend analysis
      const performanceData = await this.getPerformanceData(equipmentId, 90);

      return await this.calculateCurrentHealth(equipment, performanceData);
    } catch (error: any) {
      logger.error('Get equipment health failed', error);
      throw new Error(`Failed to get equipment health: ${error.message}`);
    }
  }

  /**
   * Perform predictive maintenance analysis using AI
   */
  async predictMaintenance(
    params: PredictiveMaintenanceRequest
  ): Promise<PredictiveMaintenanceResponse> {
    try {
      // Get equipment details and history
      const equipment = await this.getEquipment(params.equipmentId);
      if (!equipment) {
        throw new Error('Equipment not found');
      }

      // Get maintenance history and performance data
      const maintenanceHistory = await this.getMaintenanceHistory(params.equipmentId);
      const performanceData = await this.getPerformanceData(
        params.equipmentId,
        params.forecastDays || 90
      );

      // Calculate current health metrics
      const currentHealth = await this.calculateCurrentHealth(equipment, performanceData);

      // Use AI for comprehensive predictive analysis
      const aiPrompt = `Perform predictive maintenance analysis for industrial equipment:

Equipment Details:
- Name: ${equipment.equipmentName}
- Category: ${equipment.category}
- Age: ${this.calculateEquipmentAge(equipment.purchaseDate)} years
- Current Health Score: ${currentHealth.healthScore}/100

Performance Metrics (Last 30 days):
- Efficiency: ${currentHealth.performanceMetrics.efficiency}%
- Uptime: ${currentHealth.performanceMetrics.uptime}%
- Error Rate: ${currentHealth.performanceMetrics.errorRate} errors/hour
- Trend: ${currentHealth.trendAnalysis.overallTrend}

Maintenance History:
- Total Maintenance Events: ${maintenanceHistory.length}
- Last Maintenance: ${maintenanceHistory[0]?.completedAt || 'Never'}
- Average Repair Time: ${this.calculateAverageRepairTime(maintenanceHistory)} hours
- Common Issues: ${this.extractCommonIssues(maintenanceHistory).join(', ')}

Analysis Requirements:
- Forecast Period: ${params.forecastDays || 90} days
- Analysis Type: ${params.analysisType}

Provide detailed predictive maintenance analysis including:
1. Failure probability (0-1) for the forecast period
2. Optimal maintenance date (ISO format)
3. Critical components likely to fail
4. Immediate, short-term, and long-term recommendations
5. Cost estimates for preventive vs emergency repair
6. Key risk factors with impact scores

Consider equipment age, usage patterns, maintenance history, and performance trends.`;

      const aiResponse = await gemini.generateJSON<{
        failureProbability: number;
        optimalMaintenanceDate: string;
        criticalComponents: string[];
        immediateActions: string[];
        shortTermActions: string[];
        longTermActions: string[];
        preventiveCost: number;
        emergencyRepairCost: number;
        riskFactors: Array<{
          factor: string;
          impact: number;
          description: string;
        }>;
      }>(aiPrompt);

      // Calculate confidence based on data quality
      const confidence = this.calculatePredictionConfidence(maintenanceHistory, performanceData);

      // Generate cost analysis
      const costAnalysis = this.generateCostAnalysis(
        equipment,
        aiResponse.preventiveCost || this.estimatePreventiveCost(equipment),
        aiResponse.emergencyRepairCost || this.estimateEmergencyRepairCost(equipment)
      );

      // Process risk factors
      const riskFactors =
        aiResponse.riskFactors || this.generateDefaultRiskFactors(equipment, currentHealth);

      return {
        equipmentId: params.equipmentId,
        analysisDate: new Date().toISOString(),
        forecastPeriod: params.forecastDays || 90,
        predictions: {
          failureProbability: Math.min(Math.max(aiResponse.failureProbability || 0.3, 0), 1),
          predictedFailureDate:
            aiResponse.failureProbability > 0.7
              ? this.calculatePredictedFailureDate(
                  params.forecastDays || 90,
                  aiResponse.failureProbability
                )
              : undefined,
          optimalMaintenanceDate:
            aiResponse.optimalMaintenanceDate ||
            this.calculateOptimalMaintenanceDate(params.forecastDays || 90),
          confidenceLevel: confidence,
          criticalComponents:
            aiResponse.criticalComponents || this.identifyCriticalComponents(equipment),
        },
        recommendations: {
          immediate: aiResponse.immediateActions || [
            'Inspect equipment for visible wear',
            'Check all safety systems',
            'Review recent performance logs',
          ],
          shortTerm: aiResponse.shortTermActions || [
            'Schedule detailed inspection',
            'Order replacement parts',
            'Plan maintenance window',
          ],
          longTerm: aiResponse.longTermActions || [
            'Consider equipment upgrade',
            'Implement condition monitoring',
            'Review maintenance procedures',
          ],
        },
        costAnalysis,
        riskFactors,
      };
    } catch (error: any) {
      logger.error('Predictive maintenance analysis failed', error);
      throw new Error(`Predictive analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate smart maintenance schedule
   */
  async generateSmartSchedule(params: SmartScheduleRequest): Promise<SmartScheduleResponse> {
    try {
      const equipment = await this.getEquipment(params.equipmentId);
      if (!equipment) {
        throw new Error('Equipment not found');
      }

      // Get team availability and workload
      const teamWorkload = await this.getTeamWorkload(params.preferredTeam);

      // Use AI for smart scheduling
      const aiPrompt = `Generate optimal maintenance schedule:

Equipment: ${equipment.equipmentName} (${equipment.category})
Maintenance Type: ${params.maintenanceType}
Urgency: ${params.urgency}
Estimated Duration: ${params.estimatedDuration || 4} hours
Required Skills: ${params.requiredSkills?.join(', ') || 'General maintenance'}
Preferred Team: ${params.preferredTeam || 'Any available'}

Current Team Workload: ${JSON.stringify(teamWorkload)}

Provide optimal scheduling with:
1. Recommended date (ISO format)
2. 3 alternative dates
3. Best team assignment
4. Reasoning for recommendations
5. Conflict warnings if any
6. Optimization score (0-100)

Consider team availability, equipment criticality, and operational impact.`;

      const aiResponse = await gemini.generateJSON<{
        recommendedDate: string;
        alternativeDates: string[];
        assignedTeam: string;
        reasoning: string[];
        conflictWarnings: string[];
        optimizationScore: number;
      }>(aiPrompt);

      return {
        recommendedDate:
          aiResponse.recommendedDate || this.calculateDefaultScheduleDate(params.urgency),
        alternativeDates: aiResponse.alternativeDates || this.generateAlternativeDates(),
        assignedTeam: aiResponse.assignedTeam || params.preferredTeam || equipment.assignedTeam,
        estimatedDuration:
          params.estimatedDuration || this.estimateMaintenanceDuration(params.maintenanceType),
        reasoning: aiResponse.reasoning || [
          'Based on equipment criticality and team availability',
          'Optimized for minimal operational disruption',
          'Considers maintenance history and patterns',
        ],
        conflictWarnings: aiResponse.conflictWarnings || [],
        optimizationScore: aiResponse.optimizationScore || 85,
      };
    } catch (error: any) {
      logger.error('Smart schedule generation failed', error);
      throw new Error(`Smart scheduling failed: ${error.message}`);
    }
  }

  /**
   * Update equipment status with enhanced tracking
   */
  async updateEquipmentStatus(
    equipmentId: string,
    status: Equipment['status'],
    notes?: string
  ): Promise<Equipment> {
    try {
      const equipment = await this.updateEquipment(equipmentId, {
        status,
        ...(status === 'Under Maintenance' && { lastMaintenanceDate: new Date().toISOString() }),
      });

      // Log status change for tracking
      await this.logStatusChange(equipmentId, status, notes);

      return equipment;
    } catch (error: any) {
      logger.error('Equipment status update failed', error);
      throw new Error(`Status update failed: ${error.message}`);
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS FOR M05 ENHANCEMENTS
  // =============================================================================

  private calculateEquipmentAge(purchaseDate: string): number {
    return (Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
  }

  private async calculateCurrentHealth(
    equipment: any,
    performanceData: any[]
  ): Promise<EquipmentHealth> {
    // Calculate health metrics based on recent performance
    const recentData = performanceData.slice(-30); // Last 30 days
    const avgEfficiency =
      recentData.reduce((sum, d) => sum + (d.efficiency || 85), 0) / recentData.length;
    const avgUptime = recentData.reduce((sum, d) => sum + (d.uptime || 95), 0) / recentData.length;
    const avgErrorRate =
      recentData.reduce((sum, d) => sum + (d.errorRate || 2), 0) / recentData.length;

    // Calculate overall health score
    const healthScore = Math.round(
      avgEfficiency * 0.4 + avgUptime * 0.4 + (100 - avgErrorRate * 10) * 0.2
    );

    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    if (healthScore >= 85) riskLevel = 'Low';
    else if (healthScore >= 70) riskLevel = 'Medium';
    else if (healthScore >= 50) riskLevel = 'High';
    else riskLevel = 'Critical';

    // Analyze trends
    const trendAnalysis = this.analyzeTrends(performanceData);

    return {
      equipmentId: equipment.id,
      healthScore,
      riskLevel,
      lastAssessment: new Date().toISOString(),
      performanceMetrics: {
        efficiency: Math.round(avgEfficiency),
        uptime: Math.round(avgUptime),
        errorRate: Math.round(avgErrorRate * 10) / 10,
      },
      trendAnalysis,
      alerts: this.generateHealthAlerts(healthScore, riskLevel, trendAnalysis),
    };
  }

  private analyzeTrends(performanceData: any[]): any {
    // Simple trend analysis - compare first half vs second half
    const midPoint = Math.floor(performanceData.length / 2);
    const firstHalf = performanceData.slice(0, midPoint);
    const secondHalf = performanceData.slice(midPoint);

    const firstAvgEfficiency =
      firstHalf.reduce((sum, d) => sum + (d.efficiency || 85), 0) / firstHalf.length;
    const secondAvgEfficiency =
      secondHalf.reduce((sum, d) => sum + (d.efficiency || 85), 0) / secondHalf.length;

    const firstAvgUptime =
      firstHalf.reduce((sum, d) => sum + (d.uptime || 95), 0) / firstHalf.length;
    const secondAvgUptime =
      secondHalf.reduce((sum, d) => sum + (d.uptime || 95), 0) / secondHalf.length;

    const efficiencyTrend =
      secondAvgEfficiency > firstAvgEfficiency + 2
        ? 'Improving'
        : secondAvgEfficiency < firstAvgEfficiency - 2
          ? 'Declining'
          : 'Stable';

    const uptimeTrend =
      secondAvgUptime > firstAvgUptime + 2
        ? 'Improving'
        : secondAvgUptime < firstAvgUptime - 2
          ? 'Declining'
          : 'Stable';

    const overallTrend =
      efficiencyTrend === 'Improving' && uptimeTrend === 'Improving'
        ? 'Improving'
        : efficiencyTrend === 'Declining' || uptimeTrend === 'Declining'
          ? 'Declining'
          : 'Stable';

    return { efficiencyTrend, uptimeTrend, overallTrend };
  }

  private generateHealthAlerts(
    healthScore: number,
    _riskLevel: string,
    trendAnalysis: any
  ): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    if (healthScore < 60) {
      alerts.push({
        id: `alert-${Date.now()}-1`,
        type: 'Critical',
        message: 'Equipment health score is critically low',
        severity: 9,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

    if (trendAnalysis.overallTrend === 'Declining') {
      alerts.push({
        id: `alert-${Date.now()}-2`,
        type: 'Warning',
        message: 'Performance trend is declining',
        severity: 6,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

    return alerts;
  }

  private calculatePredictionConfidence(maintenanceHistory: any[], performanceData: any[]): number {
    let confidence = 0.5; // Base confidence

    // More maintenance history = higher confidence
    if (maintenanceHistory.length > 10) confidence += 0.2;
    else if (maintenanceHistory.length > 5) confidence += 0.1;

    // More performance data = higher confidence
    if (performanceData.length > 60) confidence += 0.2;
    else if (performanceData.length > 30) confidence += 0.1;

    // Recent data = higher confidence
    const recentData = performanceData.filter(
      (d) => new Date(d.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (recentData.length > 20) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }

  private generateCostAnalysis(
    _equipment: any,
    preventiveCost: number,
    emergencyRepairCost: number
  ) {
    return {
      preventiveCost,
      emergencyRepairCost,
      potentialSavings: emergencyRepairCost - preventiveCost,
    };
  }

  private estimatePreventiveCost(equipment: any): number {
    // Simple cost estimation based on equipment category
    const baseCosts: Record<string, number> = {
      Machine: 2500,
      Vehicle: 1500,
      Computer: 500,
      Tool: 300,
      Other: 1000,
    };
    return baseCosts[equipment.category] || 1000;
  }

  private estimateEmergencyRepairCost(equipment: any): number {
    // Emergency repairs typically cost 3-5x more than preventive
    return this.estimatePreventiveCost(equipment) * 4;
  }

  private generateDefaultRiskFactors(equipment: any, health: EquipmentHealth) {
    return [
      {
        factor: 'Equipment Age',
        impact: Math.min(this.calculateEquipmentAge(equipment.purchaseDate) * 15, 100),
        description: 'Older equipment has higher failure probability',
      },
      {
        factor: 'Performance Decline',
        impact: 100 - health.healthScore,
        description: 'Current performance metrics indicate potential issues',
      },
      {
        factor: 'Maintenance History',
        impact: 30,
        description: 'Historical maintenance patterns affect future reliability',
      },
    ];
  }

  private identifyCriticalComponents(equipment: any): string[] {
    // Default critical components based on equipment type
    const componentMap: Record<string, string[]> = {
      Machine: ['Motor', 'Bearings', 'Hydraulic System', 'Control Unit'],
      Vehicle: ['Engine', 'Transmission', 'Brakes', 'Electrical System'],
      Computer: ['Hard Drive', 'Power Supply', 'Cooling System', 'Memory'],
      Tool: ['Cutting Edge', 'Motor', 'Safety Guards', 'Power Cord'],
      Other: ['Primary System', 'Control Unit', 'Safety Systems'],
    };
    return componentMap[equipment.category] || ['Primary System', 'Control Unit', 'Safety Systems'];
  }

  private calculateOptimalMaintenanceDate(forecastDays: number): string {
    // Schedule maintenance at 70% of forecast period for optimal timing
    const optimalDays = Math.round(forecastDays * 0.7);
    const optimalDate = new Date(Date.now() + optimalDays * 24 * 60 * 60 * 1000);
    return optimalDate.toISOString();
  }

  private calculatePredictedFailureDate(forecastDays: number, failureProbability: number): string {
    // Higher probability = earlier predicted failure
    const failureDays = Math.round(forecastDays * (1 - failureProbability));
    const failureDate = new Date(Date.now() + failureDays * 24 * 60 * 60 * 1000);
    return failureDate.toISOString();
  }

  private async getPerformanceData(_equipmentId: string, days: number): Promise<any[]> {
    // Mock performance data - in real implementation, would fetch from monitoring systems
    const data = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      data.push({
        date: date.toISOString(),
        efficiency: 85 + Math.random() * 10 - i * 0.1, // Slight decline over time
        uptime: 95 + Math.random() * 5 - i * 0.05,
        errorRate: 1 + Math.random() * 2 + i * 0.01,
      });
    }
    return data;
  }

  private async getMaintenanceHistory(equipmentId: string): Promise<any[]> {
    // Mock maintenance history - in real implementation, would fetch from database
    return [
      {
        id: '1',
        equipmentId,
        type: 'Routine',
        completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 4,
        issues: ['Filter replacement', 'Oil change'],
      },
      {
        id: '2',
        equipmentId,
        type: 'Repair',
        completedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 8,
        issues: ['Motor bearing replacement'],
      },
    ];
  }

  private calculateAverageRepairTime(maintenanceHistory: any[]): number {
    if (maintenanceHistory.length === 0) return 4;
    const totalTime = maintenanceHistory.reduce((sum, m) => sum + (m.duration || 4), 0);
    return Math.round(totalTime / maintenanceHistory.length);
  }

  private extractCommonIssues(maintenanceHistory: any[]): string[] {
    const issues = maintenanceHistory.flatMap((m) => m.issues || []);
    const uniqueIssues = [...new Set(issues)];
    return uniqueIssues.slice(0, 3);
  }

  private async getTeamWorkload(_teamId?: string): Promise<any> {
    // Mock team workload data
    return {
      currentTasks: 3,
      upcomingTasks: 5,
      availability: 'Medium',
      skills: ['Mechanical', 'Electrical', 'Hydraulic'],
    };
  }

  private calculateDefaultScheduleDate(urgency: string): string {
    const daysFromNow =
      urgency === 'Critical' ? 1 : urgency === 'High' ? 3 : urgency === 'Medium' ? 7 : 14;
    const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
    return date.toISOString();
  }

  private generateAlternativeDates(): string[] {
    const dates = [];
    for (let i = 1; i <= 3; i++) {
      const date = new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000);
      dates.push(date.toISOString());
    }
    return dates;
  }

  private estimateMaintenanceDuration(type: string): number {
    const durations: Record<string, number> = {
      Routine: 2,
      Preventive: 4,
      Predictive: 6,
    };
    return durations[type] || 4;
  }

  private async logStatusChange(
    equipmentId: string,
    status: string,
    notes?: string
  ): Promise<void> {
    // In real implementation, would log to database
    logger.info('Equipment status changed', { equipmentId, status, notes });
  }
}

export const equipmentService = new EquipmentService();
