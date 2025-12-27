import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Activity,
  Zap,
  BarChart3,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useEquipment, useEquipmentHealth } from '@/hooks/useEquipment';
import { EquipmentHealthDashboard } from '@/components/equipment/EquipmentHealthDashboard';
import { PredictiveMaintenancePanel } from '@/components/equipment/PredictiveMaintenancePanel';
import { EquipmentAnalytics } from '@/components/equipment/EquipmentAnalytics';
import { SmartScheduler } from '@/components/equipment/SmartScheduler';
import { toast } from 'sonner';
import type { SmartScheduleResponse } from '@/types/equipment';

export const EquipmentHealthPage = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('health');

  // Get equipment ID from either URL params or query params
  const equipmentId = paramId || searchParams.get('equipmentId');

  const {
    data: equipment,
    isLoading: equipmentLoading,
    error: equipmentError,
  } = useEquipment(equipmentId!);
  const {
    data: health,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useEquipmentHealth(equipmentId!);

  if (!equipmentId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <Activity className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Equipment Health Dashboard</h2>
              <p className="text-muted-foreground">
                Select an equipment to view its health status and analytics
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/equipment')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Equipment List
              </Button>
              <Button variant="outline" onClick={() => navigate('/equipment/maintenance')}>
                <Calendar className="h-4 w-4 mr-2" />
                Maintenance Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (equipmentLoading || healthLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-sm text-muted-foreground">Loading equipment health data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (equipmentError || !equipment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <div className="text-lg font-medium mb-2">Equipment Not Found</div>
            <div className="text-sm text-muted-foreground mb-4">
              The requested equipment could not be found.
            </div>
            <Button onClick={() => navigate('/equipment')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Equipment List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePredictiveAnalysis = () => {
    setActiveTab('predictive');
  };

  const handleMaintenanceScheduled = (schedule: SmartScheduleResponse) => {
    toast.success(
      `Maintenance scheduled for ${new Date(schedule.recommendedDate).toLocaleDateString()}`
    );
    // Optionally navigate to requests or refresh data
    refetchHealth();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500';
      case 'Under Maintenance':
        return 'bg-yellow-500';
      case 'Scrapped':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/equipment')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{equipment.equipmentName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(equipment.status)}>{equipment.status}</Badge>
              <span className="text-sm text-muted-foreground">
                {equipment.category} • {equipment.department}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetchHealth()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Equipment Info Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Serial Number:</span>
              <div className="font-medium">{equipment.serialNumber}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>
              <div className="font-medium">{equipment.location}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Assigned Team:</span>
              <div className="font-medium">{equipment.assignedTeam}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Purchase Date:</span>
              <div className="font-medium">
                {new Date(equipment.purchaseDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Health Monitor
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Predictive AI
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Smart Scheduler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-6">
          {health ? (
            <EquipmentHealthDashboard
              equipmentId={equipmentId}
              onPredictiveAnalysis={handlePredictiveAnalysis}
            />
          ) : healthError ? (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                <div className="text-lg font-medium mb-2">Health Data Unavailable</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Unable to load equipment health data. This may be due to insufficient monitoring
                  data.
                </div>
                <Button onClick={() => refetchHealth()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-sm text-muted-foreground">
                  Health monitoring data is being collected. Please check back later.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          {health ? (
            <PredictiveMaintenancePanel
              equipmentId={equipmentId}
              currentHealth={health}
              onMaintenanceScheduled={handleMaintenanceScheduled}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
                <div className="text-lg font-medium mb-2">Health Data Required</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Predictive maintenance analysis requires current health data.
                </div>
                <Button onClick={() => setActiveTab('health')}>
                  <Activity className="h-4 w-4 mr-2" />
                  Check Health Status
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <EquipmentAnalytics health={health} />
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-6">
          <SmartScheduler
            equipmentId={equipmentId}
            onScheduleCreated={handleMaintenanceScheduled}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
