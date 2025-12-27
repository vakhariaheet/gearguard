import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { equipmentService } from '../services/EquipmentService';

/**
 * @route POST /api/equipment/sample
 * @description Create sample equipment for testing
 */
const baseHandler = async (
  _event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const sampleEquipment = [
      {
        equipmentName: 'Industrial Printer HP-2000',
        serialNumber: 'HP-2000-001',
        category: 'Machine' as const,
        department: 'Production',
        assignedTeam: 'Team A',
        purchaseDate: '2023-01-15T00:00:00.000Z',
        warrantyExpiry: '2025-01-15T00:00:00.000Z',
        location: 'Factory Floor 1',
        status: 'Active' as const,
        specifications: {
          power: '500W',
          voltage: '220V',
          weight: '50kg',
        },
        usageHours: 1200,
        lastMaintenanceDate: '2024-11-01T00:00:00.000Z',
      },
      {
        equipmentName: 'Delivery Truck Ford-150',
        serialNumber: 'FORD-150-002',
        category: 'Vehicle' as const,
        department: 'Logistics',
        assignedEmployee: 'EMP-001',
        assignedTeam: 'Team B',
        purchaseDate: '2022-06-10T00:00:00.000Z',
        warrantyExpiry: '2025-06-10T00:00:00.000Z',
        location: 'Parking Lot A',
        status: 'Active' as const,
        specifications: {
          engine: '3.5L V6',
          capacity: '1000kg',
          fuel: 'Gasoline',
        },
        usageHours: 2500,
      },
      {
        equipmentName: 'Laptop Dell Precision 5000',
        serialNumber: 'DELL-5000-003',
        category: 'Computer' as const,
        department: 'IT',
        assignedEmployee: 'EMP-002',
        assignedTeam: 'IT Support',
        purchaseDate: '2024-03-20T00:00:00.000Z',
        warrantyExpiry: '2027-03-20T00:00:00.000Z',
        location: 'Office Building B',
        status: 'Active' as const,
        specifications: {
          processor: 'Intel i7-12700H',
          memory: '32GB DDR4',
          storage: '1TB SSD',
        },
        usageHours: 800,
        lastMaintenanceDate: '2024-12-01T00:00:00.000Z',
      },
    ];

    const createdEquipment = [];
    for (const equipment of sampleEquipment) {
      try {
        const created = await equipmentService.createEquipment(equipment);
        createdEquipment.push(created);
      } catch (error) {
        // Skip if already exists
        console.log(`Skipping ${equipment.serialNumber}: ${(error as Error).message}`);
      }
    }

    return successResponse({
      message: `Created ${createdEquipment.length} sample equipment items`,
      equipment: createdEquipment,
    });
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'equipment', 'create');
