import { useState, useEffect } from 'react';
import type {
  RequestWorkflow,
  AutoAssignmentRequest,
  AutoAssignmentResponse,
} from '@/types/requests';

export const useRequestWorkflow = (requestId: string) => {
  const [workflow, setWorkflow] = useState<RequestWorkflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflow = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('clerk-db-jwt');
      const response = await fetch(`/api/requests/${requestId}/workflow`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workflow');
      }

      const data = await response.json();
      setWorkflow(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const autoAssignRequest = async (
    assignmentData: AutoAssignmentRequest
  ): Promise<AutoAssignmentResponse> => {
    const token = localStorage.getItem('clerk-db-jwt');
    const response = await fetch(`/api/requests/${requestId}/auto-assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(assignmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Auto-assignment failed');
    }

    const data = await response.json();

    // Refresh workflow after assignment
    await fetchWorkflow();

    return data.data;
  };

  const escalateRequest = async (
    escalationLevel: number,
    reason?: string
  ): Promise<RequestWorkflow> => {
    const token = localStorage.getItem('clerk-db-jwt');
    const response = await fetch(`/api/requests/${requestId}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        escalationLevel,
        reason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Escalation failed');
    }

    const data = await response.json();
    setWorkflow(data.data);
    return data.data;
  };

  const updateSLA = async (slaData: any) => {
    const token = localStorage.getItem('clerk-db-jwt');
    const response = await fetch(`/api/requests/${requestId}/sla`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(slaData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'SLA update failed');
    }

    const data = await response.json();

    // Update workflow with new SLA data
    if (workflow) {
      setWorkflow({ ...workflow, slaTracking: data.data });
    }

    return data.data;
  };

  useEffect(() => {
    if (requestId) {
      fetchWorkflow();
    }
  }, [requestId]);

  return {
    workflow,
    isLoading,
    error,
    refetch: fetchWorkflow,
    autoAssignRequest,
    escalateRequest,
    updateSLA,
  };
};

export const useRequestAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (timeRange: { start: string; end: string }) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('clerk-db-jwt');
      const startDate = new Date(timeRange.start).toISOString();
      const endDate = new Date(timeRange.end + 'T23:59:59').toISOString();

      const response = await fetch(
        `/api/requests/analytics?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.data);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analytics,
    isLoading,
    error,
    fetchAnalytics,
  };
};
