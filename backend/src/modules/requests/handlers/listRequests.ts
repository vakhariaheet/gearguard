import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { RequestService } from '../services/RequestService';
import { ListRequestsQuery } from '../types';

const requestService = new RequestService();

/**
 * @route GET /api/requests
 * @description List maintenance requests with filtering and pagination
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { userId, role } = getAuthContext(event);

    // Parse query parameters
    const query: ListRequestsQuery = {};

    if (event.queryStringParameters) {
      const {
        limit,
        offset,
        status,
        requestType,
        priority,
        equipmentId,
        assignedTechnician,
        assignedTeam,
        orderBy,
        orderDirection,
      } = event.queryStringParameters;

      if (limit) {
        const parsedLimit = parseInt(limit, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
          query.limit = parsedLimit;
        }
      }

      if (offset) {
        const parsedOffset = parseInt(offset, 10);
        if (!isNaN(parsedOffset) && parsedOffset >= 0) {
          query.offset = parsedOffset;
        }
      }

      if (status && ['New', 'In Progress', 'Repaired', 'Scrap'].includes(status)) {
        query.status = status as any;
      }

      if (requestType && ['Corrective', 'Preventive'].includes(requestType)) {
        query.requestType = requestType as any;
      }

      if (priority && ['Low', 'Medium', 'High', 'Critical'].includes(priority)) {
        query.priority = priority as any;
      }

      if (equipmentId) {
        query.equipmentId = equipmentId;
      }

      if (assignedTechnician) {
        query.assignedTechnician = assignedTechnician;
      }

      if (assignedTeam) {
        query.assignedTeam = assignedTeam;
      }

      if (orderBy && ['createdAt', 'updatedAt', 'priority', 'scheduledDate'].includes(orderBy)) {
        query.orderBy = orderBy as any;
      }

      if (orderDirection && ['asc', 'desc'].includes(orderDirection)) {
        query.orderDirection = orderDirection as any;
      }
    }

    // For employees, only show their own requests
    if (role === 'employee') {
      query.assignedTechnician = userId;
    }

    const result = await requestService.listRequests(query);
    return successResponse(result);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'requests', 'read');
