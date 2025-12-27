import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../services/usersApi';

/**
 * Hook to fetch lead technician name by user ID
 * This is a workaround until the backend includes lead technician details in team responses
 */
export function useLeadTechnicianName(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['leadTechnician', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const response = await usersApi.getUserDetails(userId);
        return response.data;
      } catch (error) {
        // If we can't fetch user details (e.g., not admin), return null
        console.warn('Could not fetch lead technician details:', error);
        return null;
      }
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if we don't have permission
  });
}
