import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  Clock,
} from 'lucide-react';
import { useEquipmentHealth } from '@/hooks/useEquipment';

interface EquipmentHealthDashboardProps {
  equipmentId: string;
  onPredictiveAnalysis?: () => void;
}

export const EquipmentHealthDashboard = ({
  equipmentId,
  onPredictiveAnalysis,
}: EquipmentHealthDashboardProps) => {
  const { data: health, isLoading, error, refetch } = useEquipmentHealth(equipmentId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-sm text-muted-foreground">Loading health data...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !health) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <div className="text-sm text-muted-foreground mb-4">Failed to load health data</div>
          <Button onClick={() => refetch()} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return 'bg-green-500';
      case 'Medium':
        return 'bg-yellow-500';
      case 'High':
        return 'bg-orange-500';
      case 'Critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'Declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Equipment Health Overview
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getRiskColor(health.riskLevel)}>{health.riskLevel} Risk</Badge>
              <Button onClick={() => refetch()} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Overall Health Score */}
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${getHealthScoreColor(health.healthScore)}`}>
                {health.healthScore}
              </div>
              <div className="text-sm text-muted-foreground mb-2">Overall Health</div>
              <Progress value={health.healthScore} className="h-3" />
            </div>

            {/* Efficiency */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl font-bold mr-2">
                  {health.performanceMetrics.efficiency}%
                </span>
                {getTrendIcon(health.trendAnalysis.efficiencyTrend)}
              </div>
              <div className="text-sm text-muted-foreground mb-2">Efficiency</div>
              <Progress value={health.performanceMetrics.efficiency} className="h-2" />
            </div>

            {/* Uptime */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl font-bold mr-2">{health.performanceMetrics.uptime}%</span>
                {getTrendIcon(health.trendAnalysis.uptimeTrend)}
              </div>
              <div className="text-sm text-muted-foreground mb-2">Uptime</div>
              <Progress value={health.performanceMetrics.uptime} className="h-2" />
            </div>

            {/* Error Rate */}
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{health.performanceMetrics.errorRate}</div>
              <div className="text-sm text-muted-foreground mb-2">Errors/Hour</div>
              <div className="h-2 bg-muted rounded-full">
                <div
                  className="h-2 bg-red-500 rounded-full transition-all"
                  style={{ width: `${Math.min(health.performanceMetrics.errorRate * 10, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          {(health.performanceMetrics.energyConsumption ||
            health.performanceMetrics.temperature) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
              {health.performanceMetrics.energyConsumption && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Energy Consumption</span>
                  <span className="text-sm">{health.performanceMetrics.energyConsumption} kWh</span>
                </div>
              )}
              {health.performanceMetrics.temperature && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Temperature</span>
                  <span className="text-sm">{health.performanceMetrics.temperature}°C</span>
                </div>
              )}
              {health.performanceMetrics.vibrationLevel && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Vibration Level</span>
                  <span className="text-sm">{health.performanceMetrics.vibrationLevel}%</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <Button onClick={onPredictiveAnalysis} className="flex-1">
              <Zap className="h-4 w-4 mr-2" />
              Run Predictive Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {health.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Active Alerts ({health.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <Badge
                      variant={
                        alert.type === 'Critical'
                          ? 'destructive'
                          : alert.type === 'Warning'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {alert.type}
                    </Badge>
                    <div>
                      <div className="text-sm font-medium">{alert.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Severity: {alert.severity}/10
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="text-sm font-medium">Efficiency Trend</div>
                <div className="text-xs text-muted-foreground">Last 30 days</div>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(health.trendAnalysis.efficiencyTrend)}
                <span className="text-sm font-medium">{health.trendAnalysis.efficiencyTrend}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="text-sm font-medium">Uptime Trend</div>
                <div className="text-xs text-muted-foreground">Last 30 days</div>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(health.trendAnalysis.uptimeTrend)}
                <span className="text-sm font-medium">{health.trendAnalysis.uptimeTrend}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="text-sm font-medium">Overall Trend</div>
                <div className="text-xs text-muted-foreground">Combined metrics</div>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(health.trendAnalysis.overallTrend)}
                <span className="text-sm font-medium">{health.trendAnalysis.overallTrend}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Assessment Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Last health assessment:</span>
            <span>{new Date(health.lastAssessment).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
