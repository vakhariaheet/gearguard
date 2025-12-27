import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../services/usersApi';

/**
 * Hook to fetch user name by user ID
 * Returns the user's display name or 'Unknown' if not found
 */
export function useUserName(userId: string | undefined, enabled = true): string {
  const { data: user } = useQuery({
    queryKey: ['userName', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const response = await usersApi.getUserDetails(userId);
        return response.data;
      } catch (error) {
        // If we can't fetch user details (e.g., not admin), return null
        console.warn('Could not fetch user details:', error);
        return null;
      }
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if we don't have permission
  });

  if (!userId) return '';
  if (!user) return 'Unknown';

  // Return the best available name
  return user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.lastName || user.email || 'Unknown';
}

/**
 * Hook to fetch multiple user names by user IDs
 * Returns a map of userId -> userName
 */
export function useUserNames(userIds: (string | undefined)[]): Record<string, string> {
  const validUserIds = userIds.filter((id): id is string => !!id);

  const { data: users } = useQuery({
    queryKey: ['userNames', validUserIds.sort()], // Sort for consistent cache key
    queryFn: async () => {
      const userPromises = validUserIds.map(async (userId) => {
        try {
          const response = await usersApi.getUserDetails(userId);
          return { userId, user: response.data };
        } catch (error) {
          console.warn('Could not fetch user details:', error);
          return { userId, user: null };
        }
      });

      return Promise.all(userPromises);
    },
    enabled: validUserIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const userMap: Record<string, string> = {};

  if (users) {
    users.forEach(({ userId, user }) => {
      if (user) {
        userMap[userId] =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.lastName || user.email || 'Unknown';
      } else {
        userMap[userId] = 'Unknown';
      }
    });
  }

  // Add default values for any missing users
  validUserIds.forEach((userId) => {
    if (!(userId in userMap)) {
      userMap[userId] = 'Unknown';
    }
  });

  return userMap;
}
