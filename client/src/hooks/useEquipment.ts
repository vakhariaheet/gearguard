import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { equipmentApi } from '../services/equipmentApi';
import type {
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  ListEquipmentQuery,
  HealthAssessmentRequest,
} from '../types/equipment';

// Query keys
export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (query?: ListEquipmentQuery) => [...equipmentKeys.lists(), query] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
};

/**
 * Hook to list equipment with filtering and pagination
 */
export function useEquipmentList(query?: ListEquipmentQuery) {
  return useQuery({
    queryKey: equipmentKeys.list(query),
    queryFn: () => equipmentApi.listEquipment(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get equipment by ID
 */
export function useEquipment(id: string) {
  return useQuery({
    queryKey: equipmentKeys.detail(id),
    queryFn: () => equipmentApi.getEquipment(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create equipment
 */
export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEquipmentRequest) => equipmentApi.createEquipment(data),
    onSuccess: (equipment) => {
      // Invalidate and refetch equipment lists
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      toast.success(`Equipment "${equipment.equipmentName}" created successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create equipment');
    },
  });
}

/**
 * Hook to update equipment
 */
export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipmentRequest }) =>
      equipmentApi.updateEquipment(id, data),
    onSuccess: (equipment) => {
      // Invalidate and refetch equipment lists and detail
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.detail(equipment.id) });
      toast.success(`Equipment "${equipment.equipmentName}" updated successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update equipment');
    },
  });
}

/**
 * Hook to delete equipment
 */
export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => equipmentApi.deleteEquipment(id),
    onSuccess: (_, id) => {
      // Invalidate and refetch equipment lists
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      // Remove the deleted equipment from cache
      queryClient.removeQueries({ queryKey: equipmentKeys.detail(id) });
      toast.success('Equipment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete equipment');
    },
  });
}

/**
 * Hook to assess equipment health
 */
export function useAssessEquipmentHealth() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: Partial<HealthAssessmentRequest> }) =>
      equipmentApi.assessEquipmentHealth(id, data),
    onSuccess: () => {
      toast.success('Health assessment completed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Health assessment failed');
    },
  });
}
