import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { equipmentService } from '../services/EquipmentService';
import { ListEquipmentQuery } from '../types';

/**
 * @route GET /api/equipment
 * @description List equipment with filtering and pagination
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Parse query parameters
    const query: ListEquipmentQuery = {};

    if (event.queryStringParameters) {
      const { limit, offset, department, category, status, assignedTeam, search } =
        event.queryStringParameters;

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

      if (department && department.trim()) {
        query.department = department.trim();
      }

      if (category && category.trim()) {
        query.category = category.trim();
      }

      if (status && status.trim()) {
        query.status = status.trim();
      }

      if (assignedTeam && assignedTeam.trim()) {
        query.assignedTeam = assignedTeam.trim();
      }

      if (search && search.trim()) {
        query.search = search.trim();
      }
    }

    const result = await equipmentService.listEquipment(query);
    return successResponse(result);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'equipment', 'read');
