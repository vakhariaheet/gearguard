import { v4 as uuidv4 } from 'uuid';
import { dynamodb } from '../../../shared/clients/dynamodb';
import { gemini } from '../../../shared/clients/gemini';
import { createLogger } from '../../../shared/logger';
import {
  MaintenanceRequest,
  CreateRequestRequest,
  UpdateRequestRequest,
  AssignRequestRequest,
  UpdateStatusRequest,
  ListRequestsQuery,
  ListRequestsResponse,
  RequestAutoFillRequest,
  RequestAutoFillResponse,
  RequestDynamoItem,
  generateRequestKeys,
  mapDynamoToRequest,
  mapRequestToDynamo,
  isValidStatusTransition,
  getPriorityWeight,
  // M07 Advanced Workflow Types
  RequestWorkflow,
  SLATracking,
  EscalationRule,
  AutoAssignmentRequest,
  AutoAssignmentResponse,
  RequestAnalytics,
  WorkflowDynamoItem,
  SLADynamoItem,
} from '../types';

const logger = createLogger('RequestService');

export class RequestService {
  /**
   * Create a new maintenance request
   */
  async createRequest(
    requestData: CreateRequestRequest,
    createdBy: string
  ): Promise<MaintenanceRequest> {
    const requestId = uuidv4();
    const now = new Date().toISOString();

    // Mock equipment data for foundation phase
    const equipment = await this.getEquipmentDetails(requestData.equipmentId);
    if (!equipment) {
      throw new Error('Equipment not found');
    }

    const request: MaintenanceRequest = {
      id: requestId,
      subject: requestData.subject,
      description: requestData.description,
      requestType: requestData.requestType,
      equipmentId: requestData.equipmentId,
      equipmentName: equipment.name,
      equipmentCategory: equipment.category,
      status: 'New',
      priority: requestData.priority,
      scheduledDate: requestData.scheduledDate,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // Store main request record
    const mainItem = mapRequestToDynamo(request);
    await dynamodb.put(mainItem as unknown as Record<string, unknown>);

    // Store equipment relationship
    const equipmentKeys = generateRequestKeys(requestId).equipment(requestData.equipmentId);
    await dynamodb.put({
      ...equipmentKeys,
      id: requestId,
      equipmentId: requestData.equipmentId,
      equipmentName: equipment.name,
      createdAt: now,
      updatedAt: now,
    });

    logger.info('Request created', { requestId, equipmentId: requestData.equipmentId });
    return request;
  }

  /**
   * Get request by ID
   */
  async getRequestById(requestId: string): Promise<MaintenanceRequest | null> {
    const keys = generateRequestKeys(requestId).details;
    const item = await dynamodb.get<RequestDynamoItem>(keys);

    if (!item) {
      return null;
    }

    return mapDynamoToRequest(item);
  }

  /**
   * List requests with filtering and pagination
   */
  async listRequests(query: ListRequestsQuery): Promise<ListRequestsResponse> {
    const {
      limit = 20,
      offset = 0,
      status,
      requestType,
      priority,
      equipmentId,
      assignedTechnician,
      assignedTeam,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    } = query;

    let keyCondition: string;
    let expressionAttributeValues: Record<string, unknown>;
    let indexName: string | undefined;

    // Build query based on filters
    if (status) {
      // Query by status using GSI1
      keyCondition = 'GSI1PK = :statusKey';
      expressionAttributeValues = { ':statusKey': `STATUS#${status}` };
      indexName = 'GSI1';
    } else if (equipmentId) {
      // Query by equipment using GSI1
      keyCondition = 'GSI1PK = :equipmentKey';
      expressionAttributeValues = { ':equipmentKey': `EQUIPMENT#${equipmentId}` };
      indexName = 'GSI1';
    } else if (assignedTechnician) {
      // Query by assigned technician using GSI1
      keyCondition = 'GSI1PK = :userKey';
      expressionAttributeValues = { ':userKey': `USER#${assignedTechnician}` };
      indexName = 'GSI1';
    } else {
      // Scan all requests (less efficient, but needed for general listing)
      const scanResult = await dynamodb.scan<RequestDynamoItem>({
        filterExpression: 'begins_with(PK, :pkPrefix) AND SK = :detailsSK',
        expressionAttributeValues: {
          ':pkPrefix': 'REQUEST#',
          ':detailsSK': 'DETAILS',
        },
        limit: limit + offset, // Get more to handle offset
      });

      let filteredItems = scanResult.items;

      // Apply additional filters
      if (requestType) {
        filteredItems = filteredItems.filter((item) => item.requestType === requestType);
      }
      if (priority) {
        filteredItems = filteredItems.filter((item) => item.priority === priority);
      }
      if (assignedTeam) {
        filteredItems = filteredItems.filter((item) => item.assignedTeam === assignedTeam);
      }

      // Sort results
      filteredItems.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (orderBy) {
          case 'priority':
            aValue = getPriorityWeight(a.priority);
            bValue = getPriorityWeight(b.priority);
            break;
          case 'scheduledDate':
            aValue = a.scheduledDate || '9999-12-31';
            bValue = b.scheduledDate || '9999-12-31';
            break;
          default:
            aValue = a[orderBy as keyof RequestDynamoItem] || '';
            bValue = b[orderBy as keyof RequestDynamoItem] || '';
        }

        if (orderDirection === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      });

      // Apply pagination
      const paginatedItems = filteredItems.slice(offset, offset + limit);
      const requests = paginatedItems.map(mapDynamoToRequest);

      return {
        requests,
        totalCount: filteredItems.length,
      };
    }

    // Execute query for indexed searches
    const result = await dynamodb.query<RequestDynamoItem>(
      keyCondition,
      expressionAttributeValues,
      {
        indexName,
        limit: limit + offset,
        scanIndexForward: orderDirection === 'asc',
      }
    );

    let filteredItems = result.items;

    // Apply additional filters
    if (requestType) {
      filteredItems = filteredItems.filter((item) => item.requestType === requestType);
    }
    if (priority) {
      filteredItems = filteredItems.filter((item) => item.priority === priority);
    }
    if (assignedTeam) {
      filteredItems = filteredItems.filter((item) => item.assignedTeam === assignedTeam);
    }

    // Apply pagination
    const paginatedItems = filteredItems.slice(offset, offset + limit);
    const requests = paginatedItems.map(mapDynamoToRequest);

    return {
      requests,
      totalCount: filteredItems.length,
    };
  }

  /**
   * Update request details
   */
  async updateRequest(
    requestId: string,
    updates: UpdateRequestRequest
  ): Promise<MaintenanceRequest> {
    const keys = generateRequestKeys(requestId).details;

    // Verify request exists and user has permission
    const existingRequest = await this.getRequestById(requestId);
    if (!existingRequest) {
      throw new Error('Request not found');
    }

    // Update the request
    const updatedItem = await dynamodb.update<RequestDynamoItem>(keys, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return mapDynamoToRequest(updatedItem);
  }

  /**
   * Assign request to team or technician
   */
  async assignRequest(
    requestId: string,
    assignment: AssignRequestRequest,
    assignedBy?: string
  ): Promise<MaintenanceRequest> {
    const keys = generateRequestKeys(requestId).details;

    const existingRequest = await this.getRequestById(requestId);
    if (!existingRequest) {
      throw new Error('Request not found');
    }

    // Prepare update data
    const updateData: Partial<RequestDynamoItem> = {
      assignedTeam: assignment.assignedTeam,
      assignedTechnician: assignment.assignedTechnician,
      updatedAt: new Date().toISOString(),
    };

    // Automatically update status to "In Progress" when assigning (if currently "New")
    if (existingRequest.status === 'New') {
      updateData.status = 'In Progress';
      updateData.startedAt = new Date().toISOString();
    }

    // Update assignment
    const updatedItem = await dynamodb.update<RequestDynamoItem>(keys, updateData);

    // Create assignee relationship if technician is assigned
    if (assignment.assignedTechnician) {
      const assigneeKeys = generateRequestKeys(requestId).assignee(assignment.assignedTechnician);
      await dynamodb.put({
        ...assigneeKeys,
        id: requestId,
        userId: assignment.assignedTechnician,
        assignedBy: assignedBy || 'system',
        assignedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    logger.info('Request assigned', {
      requestId,
      assignment,
      statusUpdated: existingRequest.status === 'New',
    });
    return mapDynamoToRequest(updatedItem);
  }

  /**
   * Update request status with workflow validation
   */
  async updateStatus(
    requestId: string,
    statusUpdate: UpdateStatusRequest
  ): Promise<MaintenanceRequest> {
    const keys = generateRequestKeys(requestId).details;

    const existingRequest = await this.getRequestById(requestId);
    if (!existingRequest) {
      throw new Error('Request not found');
    }

    // Validate status transition
    if (!isValidStatusTransition(existingRequest.status, statusUpdate.newStatus)) {
      throw new Error(
        `Invalid status transition from ${existingRequest.status} to ${statusUpdate.newStatus}`
      );
    }

    const now = new Date().toISOString();
    const updates: Partial<RequestDynamoItem> = {
      status: statusUpdate.newStatus,
      notes: statusUpdate.notes,
      updatedAt: now,
    };

    // Update GSI1PK for status queries
    updates.GSI1PK = `STATUS#${statusUpdate.newStatus}`;

    // Handle status-specific updates
    if (statusUpdate.newStatus === 'In Progress' && !existingRequest.startedAt) {
      updates.startedAt = now;
    }

    if (['Repaired', 'Scrap'].includes(statusUpdate.newStatus)) {
      updates.completedAt = now;
      if (statusUpdate.hoursSpent) {
        updates.hoursSpent = statusUpdate.hoursSpent;
      }
    }

    const updatedItem = await dynamodb.update<RequestDynamoItem>(keys, updates);

    logger.info('Request status updated', {
      requestId,
      oldStatus: existingRequest.status,
      newStatus: statusUpdate.newStatus,
    });

    return mapDynamoToRequest(updatedItem);
  }

  /**
   * Delete a request
   */
  async deleteRequest(requestId: string): Promise<void> {
    const existingRequest = await this.getRequestById(requestId);
    if (!existingRequest) {
      throw new Error('Request not found');
    }

    try {
      // Delete main request record
      const keys = generateRequestKeys(requestId).details;
      await dynamodb.delete(keys);

      // Delete equipment relationship (may not exist)
      try {
        const equipmentKeys = generateRequestKeys(requestId).equipment(existingRequest.equipmentId);
        await dynamodb.delete(equipmentKeys);
      } catch (error: any) {
        // Ignore if equipment relationship doesn't exist
        if (error.name !== 'ResourceNotFoundException') {
          logger.warn('Failed to delete equipment relationship', {
            requestId,
            equipmentId: existingRequest.equipmentId,
            error: error.message,
          });
        }
      }

      // Delete assignee relationship if exists (may not exist)
      if (existingRequest.assignedTechnician) {
        try {
          const assigneeKeys = generateRequestKeys(requestId).assignee(
            existingRequest.assignedTechnician
          );
          await dynamodb.delete(assigneeKeys);
        } catch (error: any) {
          // Ignore if assignee relationship doesn't exist
          if (error.name !== 'ResourceNotFoundException') {
            logger.warn('Failed to delete assignee relationship', {
              requestId,
              assignedTechnician: existingRequest.assignedTechnician,
              error: error.message,
            });
          }
        }
      }

      logger.info('Request deleted', { requestId });
    } catch (error: any) {
      logger.error('Failed to delete request', error, { requestId });
      throw error;
    }
  }

  /**
   * Generate smart auto-fill suggestions using AI
   */
  async generateAutoFillSuggestions(
    params: RequestAutoFillRequest
  ): Promise<RequestAutoFillResponse> {
    try {
      // Get equipment details
      const equipment = await this.getEquipmentDetails(params.equipmentId);
      if (!equipment) {
        throw new Error('Equipment not found');
      }

      // Get maintenance history for this equipment
      const maintenanceHistory = await this.getMaintenanceHistory(params.equipmentId);

      // Analyze common issues and patterns
      const commonIssues = this.extractCommonIssues(maintenanceHistory);
      const averageRepairTime = this.calculateAverageRepairTime(maintenanceHistory);

      // Use AI to generate smart suggestions
      const aiPrompt = `Generate maintenance request suggestions for equipment:

Equipment: ${equipment.name} (${equipment.category})
Request Type: ${params.requestType || 'Corrective'}
User Description: ${params.userDescription || 'None provided'}

History: ${maintenanceHistory.length} requests, Common: ${commonIssues.join(', ')}, Avg repair: ${averageRepairTime}h

Return ONLY valid JSON with these exact camelCase fields:

{
  "suggestedSubject": "brief subject line",
  "suggestedDescription": "detailed description based on equipment type and common issues",
  "suggestedPriority": "Low|Medium|High|Critical",
  "recommendedActions": ["action1", "action2", "action3"],
  "suggestedScheduleDate": "2025-01-15T10:00:00.000Z"
}

CRITICAL: Use exact camelCase field names. Return complete valid JSON only.`;

      const aiResponse = await gemini.generateJSON<{
        suggestedSubject: string;
        suggestedDescription: string;
        suggestedPriority: string;
        recommendedActions: string[];
        suggestedScheduleDate?: string;
      }>(aiPrompt, {
        model: 'gemini-3-flash-preview',
        config: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        },
      });

      // Determine suggested team based on equipment category
      const suggestedTeam = await this.getSuggestedTeam(equipment.category);

      // Calculate confidence based on available data
      const confidence = this.calculateSuggestionConfidence(maintenanceHistory, equipment);

      return {
        suggestedSubject:
          aiResponse.suggestedSubject || `${equipment.category} maintenance required`,
        suggestedDescription:
          aiResponse.suggestedDescription || `Maintenance needed for ${equipment.name}`,
        suggestedPriority: (aiResponse.suggestedPriority as any) || 'Medium',
        suggestedTeam: suggestedTeam?.id,
        suggestedScheduleDate: aiResponse.suggestedScheduleDate,
        commonIssues,
        maintenanceHistory: {
          lastMaintenance: maintenanceHistory[0]?.completedAt,
          averageRepairTime,
          commonProblems: commonIssues,
          recommendedActions: aiResponse.recommendedActions || [
            'Inspect equipment thoroughly',
            'Check for wear and tear',
            'Test all functions',
            'Update maintenance log',
          ],
        },
        confidence,
      };
    } catch (error: any) {
      logger.error('Auto-fill suggestion failed', error);
      throw new Error(`Auto-fill failed: ${error?.message || 'Unknown error'}`);
    }
  }

  // =============================================================================
  // ADVANCED WORKFLOW METHODS - Module M07
  // =============================================================================

  /**
   * Auto-assign request to optimal technician using AI
   */
  async autoAssignRequest(params: AutoAssignmentRequest): Promise<AutoAssignmentResponse> {
    try {
      // Get request and equipment details
      const request = await this.getRequestById(params.requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      const equipment = await this.getEquipmentDetails(params.equipmentId);
      if (!equipment) {
        throw new Error('Equipment not found');
      }

      // Get available technicians
      const availableTechnicians = await this.getAvailableTechnicians(params.preferredTeam);
      if (availableTechnicians.length === 0) {
        throw new Error('No available technicians found');
      }

      // Score each technician
      const technicianScores = await Promise.all(
        availableTechnicians.map(async (technician) => {
          const score = await this.calculateTechnicianScore(technician, params, equipment);
          return { technician, score };
        })
      );

      // Sort by score (highest first)
      technicianScores.sort((a, b) => b.score.total - a.score.total);

      const bestTechnician = technicianScores[0];
      if (!bestTechnician) {
        throw new Error('No available technicians found');
      }

      const alternatives = technicianScores.slice(1, 4);

      // Use AI to generate assignment reasoning
      const aiPrompt = `Analyze technician assignment for maintenance request:
Request: ${request.subject}
Equipment: ${equipment.name} (${equipment.category})
Urgency: ${params.urgency}
Required Skills: ${params.requiredSkills?.join(', ') || 'None specified'}

Recommended Technician: ${bestTechnician.technician.name}
- Team: ${bestTechnician.technician.team}
- Skills: ${bestTechnician.technician.skills.join(', ')}
- Current Workload: ${bestTechnician.technician.currentWorkload}/10
- Score: ${bestTechnician.score.total}/100

Provide 3-4 specific reasons why this technician is the best choice for this assignment.
Consider skill match, availability, workload, and location factors.`;

      const aiResponse = (await gemini.generateJSON(aiPrompt, {
        model: 'gemini-3-flash-preview',
        config: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        },
      })) as {
        reasoning?: string[];
        estimatedResponseTime?: number;
        confidence?: number;
      };

      // Calculate estimated response time
      const baseResponseTime = this.getBaseResponseTime(params.urgency);
      const workloadMultiplier = 1 + bestTechnician.technician.currentWorkload / 10;
      const estimatedResponseTime = Math.round(baseResponseTime * workloadMultiplier);

      // Determine if auto-assignment should be applied
      const autoAssign = bestTechnician.score.total >= 80 && params.urgency !== 'Critical';

      // If auto-assigning, update the request
      if (autoAssign) {
        await this.assignRequest(params.requestId, {
          assignedTechnician: bestTechnician.technician.userId,
          assignedTeam: bestTechnician.technician.team,
        });

        // Initialize workflow tracking
        await this.initializeWorkflow(params.requestId, {
          assignedTechnician: bestTechnician.technician.userId,
          estimatedResponseTime,
          autoAssigned: true,
        });
      }

      return {
        assignedTechnician: {
          userId: bestTechnician.technician.userId,
          name: bestTechnician.technician.name,
          email: bestTechnician.technician.email,
          team: bestTechnician.technician.team,
          skills: bestTechnician.technician.skills,
          currentWorkload: bestTechnician.technician.currentWorkload,
          location: bestTechnician.technician.location,
          estimatedArrival: bestTechnician.score.travelTime,
        },
        alternativeTechnicians: alternatives.map((alt) => ({
          userId: alt.technician.userId,
          name: alt.technician.name,
          score: alt.score.total,
          reason: this.generateAlternativeReason(alt.technician, alt.score),
        })),
        assignmentScore: bestTechnician.score.total,
        assignmentReasoning: aiResponse.reasoning || [
          `Best skill match for ${equipment.category} maintenance`,
          `Optimal workload balance (${bestTechnician.technician.currentWorkload}/10 current requests)`,
          `Team specialization aligns with equipment requirements`,
          `Available for immediate response`,
        ],
        estimatedResponseTime: aiResponse.estimatedResponseTime || estimatedResponseTime,
        confidence: aiResponse.confidence || bestTechnician.score.total / 100,
        autoAssigned: autoAssign,
      };
    } catch (error: any) {
      logger.error('Auto-assignment failed:', error);
      throw new Error(`Auto-assignment failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Initialize workflow tracking for a request
   */
  async initializeWorkflow(
    requestId: string,
    options: {
      assignedTechnician?: string;
      estimatedResponseTime?: number;
      autoAssigned?: boolean;
    }
  ): Promise<RequestWorkflow> {
    const now = new Date().toISOString();
    const request = await this.getRequestById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Calculate SLA deadlines based on priority
    const slaTargets = this.getSLATargets(request.priority);
    const responseDeadline = new Date(Date.now() + slaTargets.responseTime * 60000).toISOString();
    const resolutionDeadline = new Date(
      Date.now() + slaTargets.resolutionTime * 60000
    ).toISOString();

    const workflow: RequestWorkflow = {
      requestId,
      currentStep: options.assignedTechnician ? 'Assigned' : 'Created',
      workflowHistory: [
        {
          step: 'Created',
          status: 'Completed',
          startTime: request.createdAt,
          endTime: now,
          duration: Math.round(
            (new Date(now).getTime() - new Date(request.createdAt).getTime()) / 60000
          ),
          automatedAction: false,
        },
      ],
      slaTracking: {
        responseTime: {
          target: slaTargets.responseTime,
          deadline: responseDeadline,
          isBreached: false,
          remainingTime: slaTargets.responseTime,
        },
        resolutionTime: {
          target: slaTargets.resolutionTime,
          deadline: resolutionDeadline,
          isBreached: false,
          remainingTime: slaTargets.resolutionTime,
        },
        escalationTriggers: this.generateEscalationTriggers(request.priority),
      },
      escalationRules: this.getDefaultEscalationRules(request.priority),
      assignmentHistory: options.assignedTechnician
        ? [
            {
              assignedTo: options.assignedTechnician,
              assignedBy: 'system',
              assignedAt: now,
              reason: options.autoAssigned ? 'Auto-assigned by AI' : 'Manual assignment',
              isAutoAssigned: options.autoAssigned || false,
            },
          ]
        : [],
      estimatedCompletion: new Date(
        Date.now() + (options.estimatedResponseTime || slaTargets.resolutionTime) * 60000
      ).toISOString(),
    };

    // Add assignment step if technician assigned
    if (options.assignedTechnician) {
      workflow.workflowHistory.push({
        step: 'Assigned',
        status: 'Completed',
        startTime: now,
        endTime: now,
        duration: 0,
        assignedTo: options.assignedTechnician,
        automatedAction: options.autoAssigned || false,
      });
    }

    // Store workflow in DynamoDB
    const workflowItem: WorkflowDynamoItem = {
      PK: `REQUEST#${requestId}`,
      SK: 'WORKFLOW#MAIN',
      GSI1PK: `WORKFLOW_STATUS#${workflow.currentStep}`,
      GSI1SK: `REQUEST#${requestId}`,
      requestId,
      currentStep: workflow.currentStep,
      workflowData: workflow,
      createdAt: now,
      updatedAt: now,
    };

    await dynamodb.put(workflowItem as any);

    // Store SLA tracking
    await this.storeSLATracking(requestId, workflow.slaTracking);

    logger.info('Workflow initialized', { requestId, currentStep: workflow.currentStep });
    return workflow;
  }

  /**
   * Get request workflow details
   */
  async getRequestWorkflow(requestId: string): Promise<RequestWorkflow | null> {
    const workflowItem = await dynamodb.get<WorkflowDynamoItem>({
      PK: `REQUEST#${requestId}`,
      SK: 'WORKFLOW#MAIN',
    });

    if (!workflowItem) {
      return null;
    }

    // Update SLA status in real-time
    const updatedWorkflow = await this.updateSLAStatus(workflowItem.workflowData);
    return updatedWorkflow;
  }

  /**
   * Escalate request based on rules
   */
  async escalateRequest(requestId: string, escalationLevel: number = 1): Promise<RequestWorkflow> {
    const workflow = await this.getRequestWorkflow(requestId);
    if (!workflow) {
      throw new Error('Workflow not found for request');
    }

    const now = new Date().toISOString();
    const escalationRule = workflow.escalationRules.find((rule) => rule.level === escalationLevel);

    if (!escalationRule) {
      throw new Error(`Escalation rule for level ${escalationLevel} not found`);
    }

    // Update workflow step
    workflow.currentStep = 'Escalated';
    workflow.workflowHistory.push({
      step: `Escalated_Level_${escalationLevel}`,
      status: 'Active',
      startTime: now,
      automatedAction: true,
      notes: `Escalated to ${escalationRule.escalateTo} due to ${escalationRule.triggerCondition}`,
    });

    // Mark escalation as triggered
    const trigger = workflow.slaTracking.escalationTriggers.find(
      (t) => t.level === escalationLevel
    );
    if (trigger) {
      trigger.triggered = true;
      trigger.triggeredAt = now;
    }

    // Update escalation rule
    escalationRule.lastTriggered = now;

    // Store updated workflow
    await this.updateWorkflow(requestId, workflow);

    // Send notifications (mock implementation)
    await this.sendEscalationNotification(requestId, escalationRule);

    logger.info('Request escalated', {
      requestId,
      escalationLevel,
      escalatedTo: escalationRule.escalateTo,
    });
    return workflow;
  }

  /**
   * Update SLA tracking
   */
  async updateSLA(requestId: string, slaData: Partial<SLATracking>): Promise<SLATracking> {
    const workflow = await this.getRequestWorkflow(requestId);
    if (!workflow) {
      throw new Error('Workflow not found for request');
    }

    // Merge SLA updates
    const updatedSLA = { ...workflow.slaTracking, ...slaData };

    // Update workflow
    workflow.slaTracking = updatedSLA;
    await this.updateWorkflow(requestId, workflow);

    // Store SLA tracking separately for queries
    await this.storeSLATracking(requestId, updatedSLA);

    return updatedSLA;
  }

  /**
   * Get request analytics
   */
  async getRequestAnalytics(timeRange: { start: string; end: string }): Promise<RequestAnalytics> {
    // Query requests within time range
    const requests = await this.getRequestsInTimeRange(timeRange);
    const workflows = await this.getWorkflowsInTimeRange(timeRange);

    // Calculate metrics
    const totalRequests = requests.length;
    const responseTimes = workflows
      .map((w) => w.slaTracking.responseTime.actual)
      .filter((t): t is number => t !== undefined);
    const resolutionTimes = workflows
      .map((w) => w.slaTracking.resolutionTime.actual)
      .filter((t): t is number => t !== undefined);

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;
    const averageResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

    const slaBreaches = workflows.filter(
      (w) => w.slaTracking.responseTime.isBreached || w.slaTracking.resolutionTime.isBreached
    ).length;
    const slaComplianceRate =
      totalRequests > 0 ? ((totalRequests - slaBreaches) / totalRequests) * 100 : 100;

    const escalations = workflows.filter((w) => w.currentStep === 'Escalated').length;
    const escalationRate = totalRequests > 0 ? (escalations / totalRequests) * 100 : 0;

    const autoAssignments = workflows.filter((w) =>
      w.assignmentHistory.some((a) => a.isAutoAssigned)
    ).length;
    const autoAssignmentRate = totalRequests > 0 ? (autoAssignments / totalRequests) * 100 : 0;

    return {
      timeRange,
      metrics: {
        totalRequests,
        averageResponseTime,
        averageResolutionTime,
        slaComplianceRate,
        escalationRate,
        autoAssignmentRate,
      },
      trends: {
        requestVolume: this.calculateRequestVolumeTrend(requests, timeRange),
        responseTimesTrend: this.calculateResponseTimeTrend(workflows, timeRange),
        slaBreaches: this.calculateSLABreachTrend(workflows, timeRange),
      },
      teamPerformance: await this.calculateTeamPerformance(requests, workflows),
      equipmentInsights: await this.calculateEquipmentInsights(requests, workflows),
    };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private async getEquipmentDetails(equipmentId: string): Promise<any> {
    // Mock equipment data for foundation phase
    // In integration phase, this would call the equipment service
    const mockEquipment = {
      'eq-001': {
        id: 'eq-001',
        name: 'CNC Machine #1',
        category: 'Machine',
        department: 'Production',
      },
      'eq-002': { id: 'eq-002', name: 'Forklift #3', category: 'Vehicle', department: 'Warehouse' },
      'eq-003': { id: 'eq-003', name: 'Server Rack A1', category: 'Computer', department: 'IT' },
      'eq-004': { id: 'eq-004', name: 'HVAC Unit B2', category: 'HVAC', department: 'Facilities' },
      'eq-005': {
        id: 'eq-005',
        name: 'Conveyor Belt #2',
        category: 'Machine',
        department: 'Production',
      },
    };

    return (
      mockEquipment[equipmentId as keyof typeof mockEquipment] || {
        id: equipmentId,
        name: `Equipment ${equipmentId}`,
        category: 'Machine',
        department: 'Production',
      }
    );
  }

  private async getMaintenanceHistory(equipmentId: string): Promise<any[]> {
    // Get historical requests for this equipment
    try {
      const result = await dynamodb.query<RequestDynamoItem>(
        'GSI1PK = :equipmentKey',
        { ':equipmentKey': `EQUIPMENT#${equipmentId}` },
        { indexName: 'GSI1', limit: 50 }
      );

      return result.items
        .map((item) => ({
          subject: item.subject,
          completedAt: item.completedAt,
          hoursSpent: item.hoursSpent,
          status: item.status,
          priority: item.priority,
        }))
        .filter((item) => item.completedAt); // Only completed requests
    } catch (error) {
      logger.warn('Failed to get maintenance history', error);
      return [];
    }
  }

  private extractCommonIssues(history: any[]): string[] {
    // Analyze subjects to find common patterns
    const subjects = history.map((h) => h.subject).filter(Boolean);

    // Simple pattern matching for common issues
    const patterns = [
      'Oil leak',
      'Overheating',
      'Strange noise',
      "Won't start",
      'Performance issue',
      'Calibration needed',
      'Worn parts',
      'Electrical problem',
      'Software error',
      'Connectivity issue',
    ];

    return patterns
      .filter((pattern) =>
        subjects.some((subject) => subject.toLowerCase().includes(pattern.toLowerCase()))
      )
      .slice(0, 5);
  }

  private calculateAverageRepairTime(history: any[]): number {
    const completedRequests = history.filter((h) => h.hoursSpent && h.hoursSpent > 0);
    if (completedRequests.length === 0) return 4; // Default estimate

    const totalHours = completedRequests.reduce((sum, req) => sum + req.hoursSpent, 0);
    return Math.round((totalHours / completedRequests.length) * 10) / 10;
  }

  private async getSuggestedTeam(equipmentCategory: string): Promise<any> {
    // Simple team suggestion based on equipment category
    const teamMap: Record<string, string> = {
      Machine: 'Mechanics',
      Vehicle: 'Mechanics',
      Computer: 'IT Support',
      Electrical: 'Electricians',
      HVAC: 'HVAC',
    };

    const specialization = teamMap[equipmentCategory] || 'General';

    // Mock team data - in integration phase, would call team service
    return {
      id: 'team-1',
      name: `${specialization} Team`,
      specialization,
    };
  }

  private calculateSuggestionConfidence(history: any[], equipment: any): number {
    let confidence = 0.5; // Base confidence

    // More history = higher confidence
    if (history.length > 5) confidence += 0.2;
    else if (history.length > 2) confidence += 0.1;

    // Equipment with clear category = higher confidence
    if (equipment.category && equipment.category !== 'Other') confidence += 0.2;

    // Recent maintenance history = higher confidence
    if (
      history.some(
        (h) =>
          h.completedAt && new Date(h.completedAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      )
    ) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  // M07 Advanced Workflow Helper Methods

  private async calculateTechnicianScore(
    technician: any,
    params: AutoAssignmentRequest,
    equipment: any
  ): Promise<{
    total: number;
    skillMatch: number;
    availability: number;
    location: number;
    workload: number;
    travelTime?: number;
  }> {
    // Skill matching score (0-40 points)
    const skillScore =
      this.calculateSkillMatch(technician.skills, params.requiredSkills || []) *
      params.skillWeighting *
      100;

    // Availability score (0-30 points)
    const availabilityScore =
      this.calculateAvailabilityScore(technician) * params.availabilityWeighting * 100;

    // Location score (0-20 points)
    const locationScore =
      (await this.calculateLocationScore(technician, equipment, params.locationConstraints)) *
      params.locationWeighting *
      100;

    // Workload score (0-10 points)
    const workloadScore = this.calculateWorkloadScore(technician.currentWorkload);

    const total = Math.round(skillScore + availabilityScore + locationScore + workloadScore);

    return {
      total: Math.min(total, 100),
      skillMatch: Math.round(skillScore),
      availability: Math.round(availabilityScore),
      location: Math.round(locationScore),
      workload: Math.round(workloadScore),
      travelTime: await this.calculateTravelTime(technician, equipment),
    };
  }

  private calculateSkillMatch(technicianSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 0.8; // Default good score if no specific skills required

    const matchCount = requiredSkills.filter((skill) =>
      technicianSkills.some(
        (techSkill) =>
          techSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(techSkill.toLowerCase())
      )
    ).length;

    return matchCount / requiredSkills.length;
  }

  private calculateAvailabilityScore(technician: any): number {
    // Score based on current availability and schedule
    if (technician.isOnLeave) return 0;
    if (technician.currentWorkload >= 10) return 0.2;
    if (technician.currentWorkload >= 8) return 0.5;
    if (technician.currentWorkload >= 6) return 0.7;
    if (technician.currentWorkload >= 4) return 0.9;
    return 1.0;
  }

  private async calculateLocationScore(
    technician: any,
    equipment: any,
    constraints?: any
  ): Promise<number> {
    // Mock location scoring - in real system would use GPS/mapping services
    if (constraints?.sameBuilding && technician.building === equipment.building) {
      return 1.0;
    }

    // Mock distance calculation
    const distance = Math.random() * 50; // km
    if (constraints?.maxDistance && distance > constraints.maxDistance) {
      return 0.1;
    }

    // Score inversely proportional to distance
    return Math.max(0.1, 1 - distance / 100);
  }

  private calculateWorkloadScore(currentWorkload: number): number {
    // Bonus points for balanced workload
    if (currentWorkload <= 3) return 10;
    if (currentWorkload <= 5) return 8;
    if (currentWorkload <= 7) return 5;
    return 2;
  }

  private async calculateTravelTime(_technician: any, _equipment: any): Promise<number> {
    // Mock travel time calculation
    return Math.floor(Math.random() * 30) + 10; // 10-40 minutes
  }

  private generateAlternativeReason(_technician: any, score: any): string {
    if (score.skillMatch > 80) return 'Excellent skill match, higher workload';
    if (score.availability > 80) return 'Highly available, moderate skill match';
    if (score.location > 80) return 'Optimal location, busy schedule';
    return 'Good overall candidate, lower priority';
  }

  private getBaseResponseTime(urgency: string): number {
    switch (urgency) {
      case 'Critical':
        return 15;
      case 'High':
        return 60;
      case 'Medium':
        return 240;
      case 'Low':
        return 480;
      default:
        return 240;
    }
  }

  private getSLATargets(priority: string): { responseTime: number; resolutionTime: number } {
    switch (priority) {
      case 'Critical':
        return { responseTime: 15, resolutionTime: 240 }; // 15min response, 4hr resolution
      case 'High':
        return { responseTime: 60, resolutionTime: 480 }; // 1hr response, 8hr resolution
      case 'Medium':
        return { responseTime: 240, resolutionTime: 1440 }; // 4hr response, 24hr resolution
      case 'Low':
        return { responseTime: 480, resolutionTime: 2880 }; // 8hr response, 48hr resolution
      default:
        return { responseTime: 240, resolutionTime: 1440 };
    }
  }

  private generateEscalationTriggers(
    priority: string
  ): Array<{ level: number; triggerTime: number; triggered: boolean }> {
    const slaTargets = this.getSLATargets(priority);
    return [
      { level: 1, triggerTime: slaTargets.responseTime * 0.8, triggered: false },
      { level: 2, triggerTime: slaTargets.responseTime * 1.2, triggered: false },
      { level: 3, triggerTime: slaTargets.resolutionTime * 0.9, triggered: false },
    ];
  }

  private getDefaultEscalationRules(priority: string): EscalationRule[] {
    return [
      {
        level: 1,
        triggerCondition: 'TimeElapsed',
        triggerValue: this.getSLATargets(priority).responseTime * 0.8,
        escalateTo: 'team-lead',
        notificationMethod: 'Email',
        isActive: true,
      },
      {
        level: 2,
        triggerCondition: 'SLABreach',
        triggerValue: this.getSLATargets(priority).responseTime,
        escalateTo: 'manager',
        notificationMethod: 'All',
        isActive: true,
      },
      {
        level: 3,
        triggerCondition: 'SLABreach',
        triggerValue: this.getSLATargets(priority).resolutionTime,
        escalateTo: 'director',
        notificationMethod: 'All',
        isActive: true,
      },
    ];
  }

  private async getAvailableTechnicians(preferredTeam?: string): Promise<any[]> {
    // Mock technician data - in real system would query user/team services
    return [
      {
        userId: 'tech-1',
        name: 'John Smith',
        email: 'john@company.com',
        team: 'Mechanics',
        skills: ['Mechanical Repair', 'Hydraulics', 'Pneumatics'],
        currentWorkload: 4,
        location: 'Building A',
        building: 'A',
        isOnLeave: false,
      },
      {
        userId: 'tech-2',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        team: 'Electricians',
        skills: ['Electrical Wiring', 'Circuit Analysis', 'Motor Repair'],
        currentWorkload: 2,
        location: 'Building B',
        building: 'B',
        isOnLeave: false,
      },
      {
        userId: 'tech-3',
        name: 'Mike Wilson',
        email: 'mike@company.com',
        team: 'IT Support',
        skills: ['Hardware Troubleshooting', 'Network Configuration', 'Software Installation'],
        currentWorkload: 6,
        location: 'Building A',
        building: 'A',
        isOnLeave: false,
      },
    ].filter((tech) => !preferredTeam || tech.team === preferredTeam);
  }

  private async updateWorkflow(requestId: string, workflow: RequestWorkflow): Promise<void> {
    const now = new Date().toISOString();
    const workflowItem: WorkflowDynamoItem = {
      PK: `REQUEST#${requestId}`,
      SK: 'WORKFLOW#MAIN',
      GSI1PK: `WORKFLOW_STATUS#${workflow.currentStep}`,
      GSI1SK: `REQUEST#${requestId}`,
      requestId,
      currentStep: workflow.currentStep,
      workflowData: workflow,
      createdAt: workflow.workflowHistory[0]?.startTime || now,
      updatedAt: now,
    };

    await dynamodb.put(workflowItem as any);
  }

  private async storeSLATracking(requestId: string, slaTracking: SLATracking): Promise<void> {
    const now = new Date().toISOString();

    // Store response SLA
    const responseSLAItem: SLADynamoItem = {
      PK: `REQUEST#${requestId}`,
      SK: 'SLA#RESPONSE',
      GSI1PK: `SLA_STATUS#${slaTracking.responseTime.isBreached ? 'BREACHED' : 'ACTIVE'}`,
      GSI1SK: `DUE_DATE#${slaTracking.responseTime.deadline}`,
      requestId,
      slaType: 'response',
      slaData: slaTracking,
      createdAt: now,
      updatedAt: now,
    };

    // Store resolution SLA
    const resolutionSLAItem: SLADynamoItem = {
      PK: `REQUEST#${requestId}`,
      SK: 'SLA#RESOLUTION',
      GSI1PK: `SLA_STATUS#${slaTracking.resolutionTime.isBreached ? 'BREACHED' : 'ACTIVE'}`,
      GSI1SK: `DUE_DATE#${slaTracking.resolutionTime.deadline}`,
      requestId,
      slaType: 'resolution',
      slaData: slaTracking,
      createdAt: now,
      updatedAt: now,
    };

    await Promise.all([
      dynamodb.put(responseSLAItem as any),
      dynamodb.put(resolutionSLAItem as any),
    ]);
  }

  private async updateSLAStatus(workflow: RequestWorkflow): Promise<RequestWorkflow> {
    const now = new Date();

    // Update response time SLA
    if (!workflow.slaTracking.responseTime.actual) {
      const responseDeadline = new Date(workflow.slaTracking.responseTime.deadline);
      workflow.slaTracking.responseTime.remainingTime = Math.max(
        0,
        Math.round((responseDeadline.getTime() - now.getTime()) / 60000)
      );
      workflow.slaTracking.responseTime.isBreached = now > responseDeadline;
    }

    // Update resolution time SLA
    if (!workflow.slaTracking.resolutionTime.actual) {
      const resolutionDeadline = new Date(workflow.slaTracking.resolutionTime.deadline);
      workflow.slaTracking.resolutionTime.remainingTime = Math.max(
        0,
        Math.round((resolutionDeadline.getTime() - now.getTime()) / 60000)
      );
      workflow.slaTracking.resolutionTime.isBreached = now > resolutionDeadline;
    }

    return workflow;
  }

  private async sendEscalationNotification(
    requestId: string,
    escalationRule: EscalationRule
  ): Promise<void> {
    // Mock notification implementation
    logger.info('Escalation notification sent', {
      requestId,
      escalatedTo: escalationRule.escalateTo,
      method: escalationRule.notificationMethod,
    });
  }

  private async getRequestsInTimeRange(_timeRange: {
    start: string;
    end: string;
  }): Promise<MaintenanceRequest[]> {
    // Mock implementation - in real system would query DynamoDB with time range
    return [];
  }

  private async getWorkflowsInTimeRange(_timeRange: {
    start: string;
    end: string;
  }): Promise<RequestWorkflow[]> {
    // Mock implementation - in real system would query workflow items
    return [];
  }

  private calculateRequestVolumeTrend(
    _requests: MaintenanceRequest[],
    _timeRange: { start: string; end: string }
  ): Array<{ date: string; count: number }> {
    // Mock implementation
    return [];
  }

  private calculateResponseTimeTrend(
    _workflows: RequestWorkflow[],
    _timeRange: { start: string; end: string }
  ): Array<{ date: string; avgTime: number }> {
    // Mock implementation
    return [];
  }

  private calculateSLABreachTrend(
    _workflows: RequestWorkflow[],
    _timeRange: { start: string; end: string }
  ): Array<{ date: string; breaches: number }> {
    // Mock implementation
    return [];
  }

  private async calculateTeamPerformance(
    _requests: MaintenanceRequest[],
    _workflows: RequestWorkflow[]
  ): Promise<
    Array<{
      teamId: string;
      teamName: string;
      requestsHandled: number;
      avgResponseTime: number;
      slaCompliance: number;
    }>
  > {
    // Mock implementation
    return [];
  }

  private async calculateEquipmentInsights(
    _requests: MaintenanceRequest[],
    _workflows: RequestWorkflow[]
  ): Promise<
    Array<{
      equipmentId: string;
      equipmentName: string;
      requestCount: number;
      avgResolutionTime: number;
      criticalIssues: number;
    }>
  > {
    // Mock implementation
    return [];
  }
}
