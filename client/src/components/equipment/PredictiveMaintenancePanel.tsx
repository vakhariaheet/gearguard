import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  DollarSign,
  Zap,
  Clock,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  PredictiveMaintenanceResponse,
  EquipmentHealth,
  PredictiveMaintenanceRequest,
  SmartScheduleResponse,
} from '@/types/equipment';
import { usePredictiveMaintenance } from '@/hooks/useEquipment';

interface PredictiveMaintenancePanelProps {
  equipmentId: string;
  currentHealth: EquipmentHealth;
  onMaintenanceScheduled?: (schedule: SmartScheduleResponse) => void;
}

export const PredictiveMaintenancePanel = ({
  equipmentId,
  currentHealth,
  onMaintenanceScheduled,
}: PredictiveMaintenancePanelProps) => {
  const { getToken } = useAuth();
  const [prediction, setPrediction] = useState<PredictiveMaintenanceResponse | null>(null);
  const [analysisType, setAnalysisType] = useState<'Quick' | 'Comprehensive'>('Quick');

  const predictiveMaintenanceMutation = usePredictiveMaintenance();

  const handlePredictiveMaintenance = async () => {
    try {
      const data: Partial<PredictiveMaintenanceRequest> = {
        equipmentId,
        analysisType,
        includeEnvironmental: true,
        forecastDays: 90,
      };

      const result = await predictiveMaintenanceMutation.mutateAsync({ id: equipmentId, data });
      setPrediction(result);
    } catch (error) {
      console.error('Predictive maintenance error:', error);
    }
  };

  const scheduleOptimalMaintenance = async () => {
    if (!prediction) return;

    try {
      const token = await getToken();
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: 'Predictive Maintenance - Optimal Timing',
          description: `AI-recommended maintenance based on predictive analysis. Failure probability: ${Math.round(prediction.predictions.failureProbability * 100)}%`,
          requestType: 'Preventive',
          equipmentId,
          priority: prediction.predictions.failureProbability > 0.7 ? 'High' : 'Medium',
          scheduledDate: prediction.predictions.optimalMaintenanceDate,
        }),
      });

      if (response.ok) {
        toast.success('Maintenance request scheduled for optimal date');
        onMaintenanceScheduled?.({
          recommendedDate: prediction.predictions.optimalMaintenanceDate,
          alternativeDates: [],
          assignedTeam: '',
          estimatedDuration: 0,
          reasoning: [],
          conflictWarnings: [],
          optimizationScore: 0,
        });
      }
    } catch (error) {
      toast.error('Failed to schedule maintenance request');
    }
  };

  const getRiskColor = (probability: number) => {
    if (probability < 0.3) return 'text-green-600';
    if (probability < 0.6) return 'text-yellow-600';
    if (probability < 0.8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'Declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Equipment Health Status
            <Badge
              className={
                currentHealth.riskLevel === 'Low'
                  ? 'bg-green-500'
                  : currentHealth.riskLevel === 'Medium'
                    ? 'bg-yellow-500'
                    : currentHealth.riskLevel === 'High'
                      ? 'bg-orange-500'
                      : 'bg-red-500'
              }
            >
              {currentHealth.riskLevel} Risk
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{currentHealth.healthScore}</div>
              <div className="text-sm text-muted-foreground">Health Score</div>
              <Progress value={currentHealth.healthScore} className="h-2 mt-2" />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <span className="text-2xl font-bold mr-2">
                  {currentHealth.performanceMetrics.efficiency}%
                </span>
                {getTrendIcon(currentHealth.trendAnalysis.efficiencyTrend)}
              </div>
              <div className="text-sm text-muted-foreground">Efficiency</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <span className="text-2xl font-bold mr-2">
                  {currentHealth.performanceMetrics.uptime}%
                </span>
                {getTrendIcon(currentHealth.trendAnalysis.uptimeTrend)}
              </div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {currentHealth.performanceMetrics.errorRate}
              </div>
              <div className="text-sm text-muted-foreground">Errors/Hour</div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              onClick={handlePredictiveMaintenance}
              disabled={predictiveMaintenanceMutation.isPending}
              className="flex-1"
            >
              {predictiveMaintenanceMutation.isPending ? 'Analyzing...' : 'Run Predictive Analysis'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setAnalysisType(analysisType === 'Quick' ? 'Comprehensive' : 'Quick')}
            >
              {analysisType} Mode
            </Button>
          </div>

          {/* Active Alerts */}
          {currentHealth.alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Active Alerts ({currentHealth.alerts.length})
              </h4>
              {currentHealth.alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.type === 'Critical' ? 'destructive' : 'secondary'}>
                      {alert.type}
                    </Badge>
                    <span className="text-sm">{alert.message}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predictive Analysis Results */}
      {prediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Predictive Maintenance Analysis
              <Badge variant="secondary">
                {Math.round(prediction.predictions.confidenceLevel * 100)}% Confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="predictions" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="predictions">Predictions</TabsTrigger>
                <TabsTrigger value="recommendations">Actions</TabsTrigger>
                <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
                <TabsTrigger value="risks">Risk Factors</TabsTrigger>
              </TabsList>

              <TabsContent value="predictions" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Failure Probability</span>
                        <span
                          className={`text-lg font-bold ${getRiskColor(prediction.predictions.failureProbability)}`}
                        >
                          {Math.round(prediction.predictions.failureProbability * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={prediction.predictions.failureProbability * 100}
                        className="h-2"
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Optimal Maintenance Date</span>
                      </div>
                      <div className="text-lg font-bold">
                        {new Date(
                          prediction.predictions.optimalMaintenanceDate
                        ).toLocaleDateString()}
                      </div>
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={scheduleOptimalMaintenance}
                      >
                        Schedule Maintenance
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {prediction.predictions.criticalComponents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Critical Components</h4>
                    <div className="flex flex-wrap gap-2">
                      {prediction.predictions.criticalComponents.map((component, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-red-600 border-red-200"
                        >
                          {component}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Immediate Actions
                    </h4>
                    <ul className="space-y-1">
                      {prediction.recommendations.immediate.map((action, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Short-term (1-4 weeks)
                    </h4>
                    <ul className="space-y-1">
                      {prediction.recommendations.shortTerm.map((action, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <span className="w-1 h-1 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      Long-term (1-6 months)
                    </h4>
                    <ul className="space-y-1">
                      {prediction.recommendations.longTerm.map((action, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <span className="w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="costs" className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        ${prediction.costAnalysis.preventiveCost.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Preventive Cost</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-600">
                        ${prediction.costAnalysis.emergencyRepairCost.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Emergency Repair</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">
                        ${prediction.costAnalysis.potentialSavings.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Potential Savings</div>
                    </CardContent>
                  </Card>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-800 mb-1">
                    Cost Benefit Analysis
                  </div>
                  <div className="text-sm text-green-700">
                    Preventive maintenance could save up to{' '}
                    <span className="font-bold">
                      $
                      {(
                        prediction.costAnalysis.emergencyRepairCost -
                        prediction.costAnalysis.preventiveCost
                      ).toLocaleString()}
                    </span>{' '}
                    compared to emergency repairs, representing a{' '}
                    <span className="font-bold">
                      {Math.round(
                        ((prediction.costAnalysis.emergencyRepairCost -
                          prediction.costAnalysis.preventiveCost) /
                          prediction.costAnalysis.emergencyRepairCost) *
                          100
                      )}
                      %
                    </span>{' '}
                    cost reduction.
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="risks" className="space-y-4">
                {prediction.riskFactors.map((risk, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{risk.factor}</span>
                        <Badge
                          variant={
                            risk.impact > 70
                              ? 'destructive'
                              : risk.impact > 40
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {risk.impact}% Impact
                        </Badge>
                      </div>
                      <Progress value={risk.impact} className="h-2 mb-2" />
                      <p className="text-sm text-muted-foreground">{risk.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {predictiveMaintenanceMutation.isPending && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-lg font-medium mb-2">Running {analysisType} Analysis</div>
            <div className="text-sm text-muted-foreground">
              Analyzing equipment data, maintenance history, and performance patterns...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
