/**
 * Kanban Service - Business logic for Kanban board operations
 *
 * Handles Kanban board data aggregation, status transitions, and workflow management
 */

import { dynamodb } from '../../../shared/clients/dynamodb';
import { logger } from '../../../shared/logger';
import {
  KanbanBoard,
  KanbanColumn,
  RequestCard,
  BoardFilters,
  WorkflowRules,
  generateKanbanKeys,
  isValidStatusTransition,
  getDefaultBoardConfig,
} from '../types';
import { handleError } from '../../../shared/utils/queryParams';

export class KanbanService {
  /**
   * Get Kanban board with filtered requests
   */
  async getKanbanBoard(filters?: BoardFilters, userId?: string): Promise<KanbanBoard> {
    try {
      logger.info('Getting Kanban board', { filters, userId });

      // Get all requests with their current status
      const requests = await this.getAllRequests(filters, userId);

      // Get board configuration
      const boardConfig = await this.getBoardConfiguration();

      // Organize requests by status into columns
      const columns = this.organizeRequestsIntoColumns(requests, boardConfig.columns);

      const board: KanbanBoard = {
        id: 'main-board',
        name: 'Maintenance Requests',
        columns,
        rules: boardConfig.rules,
        filters: filters || {},
        lastUpdated: new Date().toISOString(),
      };

      logger.info('Kanban board retrieved successfully', {
        requestCount: requests.length,
        columnCount: columns.length,
      });

      return board;
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to get Kanban board', {
        error: message,
        filters,
      });
      throw new Error(`Failed to load Kanban board: ${message}`);
    }
  }

  /**
   * Update request status with validation and logging
   */
  async updateRequestStatus(
    requestId: string,
    newStatus: string,
    previousStatus: string,
    updatedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      logger.info('Updating request status', {
        requestId,
        newStatus,
        previousStatus,
        updatedBy,
      });

      // Validate transition
      const isValid = this.validateStatusTransition(previousStatus, newStatus);
      if (!isValid) {
        throw new Error(`Invalid status transition from ${previousStatus} to ${newStatus}`);
      }

      // Update request status in database
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy,
      };

      // Add status-specific timestamps
      if (newStatus === 'In Progress') {
        updateData.startedAt = new Date().toISOString();
      } else if (newStatus === 'Repaired') {
        updateData.completedAt = new Date().toISOString();
      }

      await dynamodb.update({ PK: `REQUEST#${requestId}`, SK: 'DETAILS' }, updateData);

      // Log status change
      await this.logStatusChange(requestId, previousStatus, newStatus, updatedBy, reason);

      // Process any automation rules
      await this.processAutomationRules(requestId, newStatus);

      // Send notifications if required
      await this.sendStatusChangeNotifications(requestId, newStatus, updatedBy);

      logger.info('Request status updated successfully', { requestId, newStatus });
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to update request status', {
        error: message,
        requestId,
        newStatus,
      });
      throw new Error(`Failed to update status: ${message}`);
    }
  }

  /**
   * Get all requests with optional filters
   */
  private async getAllRequests(filters?: BoardFilters, userId?: string): Promise<RequestCard[]> {
    try {
      // Build query parameters
      let queryParams: any = {
        FilterExpression: 'begins_with(PK, :pk) AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': 'REQUEST#',
          ':sk': 'DETAILS',
        },
      };

      // Apply filters
      const filterExpressions: string[] = [];

      if (filters?.teams?.length) {
        filterExpressions.push('assignedTeam IN (:teams)');
        queryParams.ExpressionAttributeValues[':teams'] = filters.teams;
      }

      if (filters?.priorities?.length) {
        filterExpressions.push('priority IN (:priorities)');
        queryParams.ExpressionAttributeValues[':priorities'] = filters.priorities;
      }

      if (filters?.equipmentCategories?.length) {
        filterExpressions.push('equipmentCategory IN (:categories)');
        queryParams.ExpressionAttributeValues[':categories'] = filters.equipmentCategories;
      }

      if (filters?.assignedTechnicians?.length) {
        filterExpressions.push('assignedTechnician IN (:technicians)');
        queryParams.ExpressionAttributeValues[':technicians'] = filters.assignedTechnicians;
      }

      if (filters?.dateRange) {
        filterExpressions.push('createdAt BETWEEN :startDate AND :endDate');
        queryParams.ExpressionAttributeValues[':startDate'] = filters.dateRange.start;
        queryParams.ExpressionAttributeValues[':endDate'] = filters.dateRange.end;
      }

      if (filters?.showMyRequestsOnly && userId) {
        filterExpressions.push('(assignedTechnician = :userId OR createdBy = :userId)');
        queryParams.ExpressionAttributeValues[':userId'] = userId;
      }

      // Add additional filters to the expression
      if (filterExpressions.length > 0) {
        queryParams.FilterExpression += ' AND (' + filterExpressions.join(' AND ') + ')';
      }

      const result = await dynamodb.scan(queryParams);
      const requests = (result.items || []).map((item: any) => this.mapToRequestCard(item));

      // Apply overdue filter if needed
      if (filters?.showOverdueOnly) {
        const now = new Date();
        return requests.filter((request: any) => {
          if (!request.dueDate) return false;
          const dueDate = new Date(request.dueDate);
          return now > dueDate && request.status !== 'Repaired';
        });
      }

      return requests;
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to get requests', { error: message, filters });
      throw error;
    }
  }

  /**
   * Map DynamoDB item to RequestCard
   */
  private mapToRequestCard(item: any): RequestCard {
    const now = new Date();
    const dueDate = item.scheduledDate ? new Date(item.scheduledDate) : null;
    const isOverdue = dueDate ? now > dueDate && item.status !== 'Repaired' : false;

    return {
      id: item.PK.replace('REQUEST#', ''),
      subject: item.subject,
      description: item.description,
      equipmentName: item.equipmentName,
      equipmentCategory: item.equipmentCategory || 'Unknown',
      priority: item.priority,
      assignedTechnician: item.assignedTechnician
        ? {
            id: item.assignedTechnician,
            name: item.assignedTechnicianName || 'Unknown',
            avatar: item.assignedTechnicianAvatar,
          }
        : undefined,
      assignedTeam: item.assignedTeam,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      dueDate: item.scheduledDate,
      estimatedHours: item.estimatedHours,
      actualHours: item.hoursSpent,
      tags: item.tags || [],
      isOverdue,
      healthScore: item.equipmentHealthScore,
      lastActivity: item.updatedAt,
      status: item.status,
    };
  }

  /**
   * Organize requests into Kanban columns by status
   */
  private organizeRequestsIntoColumns(
    requests: RequestCard[],
    columnConfigs: any[]
  ): KanbanColumn[] {
    return columnConfigs.map((config) => ({
      id: config.id,
      title: config.title,
      status: config.status,
      color: config.color,
      order: config.order,
      requests: requests.filter((request) => request.status === config.status),
      limits: config.limits,
      automationRules: config.automationRules || [],
    }));
  }

  /**
   * Get board configuration (default for now, could be stored in DB)
   */
  private async getBoardConfiguration(): Promise<{ columns: any[]; rules: WorkflowRules }> {
    try {
      // Try to get configuration from database
      const keys = generateKanbanKeys();
      const result = await dynamodb.get(keys.board);

      if ((result as any).item) {
        return {
          columns: (result as any).item.columns,
          rules: (result as any).item.rules,
        };
      }

      // Return default configuration
      return getDefaultBoardConfig();
    } catch (error) {
      const { message } = handleError(error);
      logger.warn('Failed to get board configuration, using defaults', { error: message });
      return getDefaultBoardConfig();
    }
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(fromStatus: string, toStatus: string): boolean {
    return isValidStatusTransition(fromStatus, toStatus);
  }

  /**
   * Log status change for audit trail
   */
  private async logStatusChange(
    requestId: string,
    fromStatus: string,
    toStatus: string,
    updatedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      await dynamodb.put({
        PK: `REQUEST#${requestId}`,
        SK: `STATUS_CHANGE#${Date.now()}`,
        fromStatus,
        toStatus,
        updatedBy,
        reason,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to log status change', { error: message, requestId });
      // Don't throw - this is non-critical
    }
  }

  /**
   * Process automation rules for the new status
   */
  private async processAutomationRules(requestId: string, newStatus: string): Promise<void> {
    try {
      // This could include auto-assignments, notifications, etc.
      // For now, just log the action
      logger.info('Processing automation rules', { requestId, newStatus });

      // Future implementation could include:
      // - Auto-assign technicians based on workload
      // - Send notifications to team leads
      // - Update equipment status
      // - Schedule follow-up tasks
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to process automation rules', { error: message, requestId });
      // Don't throw - this is non-critical
    }
  }

  /**
   * Send notifications for status changes
   */
  private async sendStatusChangeNotifications(
    requestId: string,
    newStatus: string,
    updatedBy: string
  ): Promise<void> {
    try {
      // This could integrate with email, SMS, or push notifications
      logger.info('Sending status change notifications', { requestId, newStatus, updatedBy });

      // Future implementation could include:
      // - Email notifications to assigned technician
      // - SMS alerts for critical status changes
      // - Push notifications to mobile app
      // - Slack/Teams integration
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to send notifications', { error: message, requestId });
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get board statistics
   */
  async getBoardStats(filters?: BoardFilters, userId?: string): Promise<any> {
    try {
      const requests = await this.getAllRequests(filters, userId);

      const stats = {
        totalRequests: requests.length,
        byStatus: {
          New: requests.filter((r) => r.status === 'New').length,
          'In Progress': requests.filter((r) => r.status === 'In Progress').length,
          Repaired: requests.filter((r) => r.status === 'Repaired').length,
          Scrap: requests.filter((r) => r.status === 'Scrap').length,
        },
        byPriority: {
          Critical: requests.filter((r) => r.priority === 'Critical').length,
          High: requests.filter((r) => r.priority === 'High').length,
          Medium: requests.filter((r) => r.priority === 'Medium').length,
          Low: requests.filter((r) => r.priority === 'Low').length,
        },
        overdueCount: requests.filter((r) => r.isOverdue).length,
        averageAge: this.calculateAverageAge(requests),
      };

      return stats;
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to get board stats', { error: message });
      throw error;
    }
  }

  /**
   * Calculate average age of requests in days
   */
  private calculateAverageAge(requests: RequestCard[]): number {
    if (requests.length === 0) return 0;

    const now = new Date();
    const totalAge = requests.reduce((sum, request) => {
      const createdDate = new Date(request.createdAt);
      const ageInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return sum + ageInDays;
    }, 0);

    return Math.round(totalAge / requests.length);
  }
}

export const kanbanService = new KanbanService();
