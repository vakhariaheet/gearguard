/**
 * Development Mode Indicator
 *
 * Shows a visual indicator when mock data is being used
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TestTube, RotateCcw } from 'lucide-react';
import { USE_MOCK_DATA, DEV_FLAGS } from '../utils/devMode';
import { useMockData } from '../contexts/MockDataContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const DevModeIndicator: React.FC = () => {
  const queryClient = useQueryClient();
  const mockData = DEV_FLAGS.useMockKanban ? useMockData() : null;

  const handleResetMockData = () => {
    if (mockData) {
      mockData.resetMockData();
      queryClient.invalidateQueries({ queryKey: ['kanban-board'] });
      toast.success('Mock data reset to original state');
    }
  };

  if (!USE_MOCK_DATA) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
        <TestTube className="h-3 w-3 mr-1" />
        Mock Data Mode
      </Badge>
      {mockData && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetMockData}
          className="h-6 px-2 text-xs"
          title="Reset mock data to original state"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
