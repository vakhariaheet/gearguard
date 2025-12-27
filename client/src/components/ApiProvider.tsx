/**
 * API Provider Component
 * Initializes the apiClient with Clerk authentication
 */

import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiClient } from '../services/apiClient';

interface ApiProviderProps {
  children: React.ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set up the auth provider for API client
    apiClient.setAuthProvider(async () => {
      try {
        // Get token from Clerk
        const token = await getToken({
          template:"rbac"
        });
        return token;
      } catch (error) {
        console.error('Failed to get auth token:', error);
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
}
