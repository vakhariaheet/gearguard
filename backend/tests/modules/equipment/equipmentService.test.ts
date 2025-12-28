import { EquipmentService } from '../../../src/modules/equipment/services/EquipmentService';
import type { CreateEquipmentRequest } from '../../../src/modules/equipment/types';

// Mock the DynamoDB client
jest.mock('../../../src/shared/clients/dynamodb', () => ({
  dynamodb: {
    put: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    scan: jest.fn(),
    query: jest.fn(),
  },
}));

// Mock the Gemini client
jest.mock('../../../src/shared/clients/gemini', () => ({
  gemini: {
    generateJSON: jest.fn(),
  },
}));

describe('EquipmentService', () => {
  let equipmentService: EquipmentService;

  beforeEach(() => {
    equipmentService = new EquipmentService();
    jest.clearAllMocks();
  });

  describe('createEquipment', () => {
    it('should create equipment successfully', async () => {
      const mockEquipmentData: CreateEquipmentRequest = {
        equipmentName: 'Test Machine',
        serialNumber: 'TM-001',
        category: 'Machine',
        department: 'Production',
        assignedTeam: 'Team A',
        purchaseDate: '2024-01-01T00:00:00.000Z',
        location: 'Factory Floor 1',
      };

      // Mock DynamoDB scan to return no existing equipment (for serial number check)
      const { dynamodb } = require('../../../src/shared/clients/dynamodb');
      dynamodb.scan.mockResolvedValue({ items: [] });
      dynamodb.put.mockResolvedValue({});

      const result = await equipmentService.createEquipment(mockEquipmentData);

      expect(result).toMatchObject({
        equipmentName: 'Test Machine',
        serialNumber: 'TM-001',
        category: 'Machine',
        department: 'Production',
        assignedTeam: 'Team A',
        location: 'Factory Floor 1',
        status: 'Active',
      });

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(dynamodb.put).toHaveBeenCalledTimes(1);
    });

    it('should throw error for duplicate serial number', async () => {
      const mockEquipmentData: CreateEquipmentRequest = {
        equipmentName: 'Test Machine',
        serialNumber: 'TM-001',
        category: 'Machine',
        department: 'Production',
        assignedTeam: 'Team A',
        purchaseDate: '2024-01-01T00:00:00.000Z',
        location: 'Factory Floor 1',
      };

      // Mock DynamoDB scan to return existing equipment with same serial number
      const { dynamodb } = require('../../../src/shared/clients/dynamodb');
      dynamodb.scan.mockResolvedValue({
        items: [{ serialNumber: 'TM-001', id: 'existing-id' }],
      });

      await expect(equipmentService.createEquipment(mockEquipmentData)).rejects.toThrow(
        'Equipment with this serial number already exists'
      );
    });
  });

  describe('assessEquipmentHealth', () => {
    it('should assess equipment health successfully', async () => {
      const equipmentId = 'test-equipment-id';
      const mockEquipment = {
        id: equipmentId,
        equipmentName: 'Test Machine',
        serialNumber: 'TM-001',
        category: 'Machine',
        purchaseDate: '2023-01-01T00:00:00.000Z',
        status: 'Active',
        usageHours: 1000,
        lastMaintenanceDate: '2024-01-01T00:00:00.000Z',
      };

      const mockAIResponse = {
        healthScore: 75,
        riskLevel: 'Medium',
        recommendations: ['Schedule routine inspection', 'Check oil levels', 'Calibrate sensors'],
        predictedMaintenanceDate: '2024-06-01T00:00:00.000Z',
        reasoning: 'Equipment shows moderate wear',
      };

      // Mock dependencies
      const { dynamodb } = require('../../../src/shared/clients/dynamodb');
      const { gemini } = require('../../../src/shared/clients/gemini');

      dynamodb.get.mockResolvedValue(mockEquipment);
      gemini.generateJSON.mockResolvedValue(mockAIResponse);

      const result = await equipmentService.assessEquipmentHealth({
        equipmentId,
        usageHours: 1000,
        performanceMetrics: {
          efficiency: 85,
          errorRate: 2,
          downtime: 5,
        },
      });

      expect(result).toMatchObject({
        equipmentId,
        healthScore: 75,
        riskLevel: 'Medium',
        recommendations: expect.arrayContaining([
          'Schedule routine inspection',
          'Check oil levels',
          'Calibrate sensors',
        ]),
        confidence: 0.85,
      });

      expect(result.factors).toHaveProperty('age');
      expect(result.factors).toHaveProperty('usage');
      expect(result.factors).toHaveProperty('maintenance');
      expect(result.factors).toHaveProperty('performance');
      expect(result.timestamp).toBeDefined();
    });

    it('should throw error for non-existent equipment', async () => {
      const equipmentId = 'non-existent-id';

      // Mock DynamoDB to return null (equipment not found)
      const { dynamodb } = require('../../../src/shared/clients/dynamodb');
      dynamodb.get.mockResolvedValue(null);

      await expect(
        equipmentService.assessEquipmentHealth({
          equipmentId,
          usageHours: 1000,
        })
      ).rejects.toThrow('Equipment not found');
    });
  });
});
