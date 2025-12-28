import { useState, useEffect } from 'react';
import { teamsApi } from '../services/teamsApi';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Hook to lookup user information by ID
 * Uses the search API to find user details
 */
export const useUserLookup = (userId?: string) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setUserInfo(null);
      setError(null);
      return;
    }

    const fetchUserInfo = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try to search for the user by their ID
        // This is a workaround since we don't have a direct user lookup endpoint
        const response = await teamsApi.searchUsers(userId, 1);

        if (response.success && response.data && response.data.users.length > 0) {
          const user = response.data.users.find((u) => u.id === userId);
          if (user) {
            setUserInfo({
              id: user.id,
              name: user.name,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            });
          } else {
            // If exact ID match not found, show a placeholder
            setUserInfo({
              id: userId,
              name: `User ID: ${userId}`,
              email: 'User details not available',
            });
          }
        } else {
          // If search fails, show a placeholder
          setUserInfo({
            id: userId,
            name: `User ID: ${userId}`,
            email: 'User details not available',
          });
        }
      } catch (err) {
        console.error('Failed to lookup user:', err);
        setError('Failed to lookup user details');
        // Show placeholder on error
        setUserInfo({
          id: userId,
          name: `User ID: ${userId}`,
          email: 'User details not available',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [userId]);

  return { userInfo, isLoading, error };
};
