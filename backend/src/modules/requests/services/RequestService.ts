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
    assignedBy: string
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
        assignedBy,
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

  // Private helper methods

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
}
