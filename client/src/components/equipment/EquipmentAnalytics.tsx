import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import type { EquipmentHealth, PredictiveMaintenanceResponse } from '@/types/equipment';

interface EquipmentAnalyticsProps {
  health?: EquipmentHealth;
  prediction?: PredictiveMaintenanceResponse;
}

export const EquipmentAnalytics = ({ health, prediction }: EquipmentAnalyticsProps) => {
  // Mock analytics data - in real implementation, would fetch from API
  const analyticsData = {
    maintenanceHistory: {
      totalEvents: 12,
      averageDowntime: 4.2,
      costSavings: 15420,
      preventiveRatio: 0.75,
    },
    performanceMetrics: {
      availabilityTrend: [95, 94, 96, 93, 97, 95, 98],
      efficiencyTrend: [88, 87, 89, 85, 91, 89, 92],
      errorRateTrend: [2.1, 2.3, 1.9, 2.8, 1.7, 2.0, 1.5],
    },
    costAnalysis: {
      monthlyOperatingCost: 3200,
      maintenanceCostTrend: [2800, 3100, 2900, 3400, 2700, 3200, 2950],
      energyConsumption: [145, 142, 148, 139, 151, 147, 144],
    },
  };

  const getPerformanceColor = (value: number, threshold: { good: number; warning: number }) => {
    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return 'stable';
    const recent = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previous = data.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    const change = ((recent - previous) / previous) * 100;

    if (change > 2) return 'improving';
    if (change < -2) return 'declining';
    return 'stable';
  };

  const getTrendIcon = (trend: string, isInverted = false) => {
    const improving = isInverted ? 'declining' : 'improving';
    const declining = isInverted ? 'improving' : 'declining';

    switch (trend) {
      case improving:
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case declining:
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Availability */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <span
                  className={`text-2xl font-bold mr-2 ${getPerformanceColor(
                    analyticsData.performanceMetrics.availabilityTrend.slice(-1)[0],
                    { good: 95, warning: 90 }
                  )}`}
                >
                  {analyticsData.performanceMetrics.availabilityTrend.slice(-1)[0]}%
                </span>
                {getTrendIcon(calculateTrend(analyticsData.performanceMetrics.availabilityTrend))}
              </div>
              <div className="text-sm text-muted-foreground mb-2">Availability</div>
              <Progress
                value={analyticsData.performanceMetrics.availabilityTrend.slice(-1)[0]}
                className="h-2"
              />
              <div className="text-xs text-muted-foreground mt-1">7-day average</div>
            </div>

            {/* Efficiency */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <span
                  className={`text-2xl font-bold mr-2 ${getPerformanceColor(
                    analyticsData.performanceMetrics.efficiencyTrend.slice(-1)[0],
                    { good: 85, warning: 75 }
                  )}`}
                >
                  {analyticsData.performanceMetrics.efficiencyTrend.slice(-1)[0]}%
                </span>
                {getTrendIcon(calculateTrend(analyticsData.performanceMetrics.efficiencyTrend))}
              </div>
              <div className="text-sm text-muted-foreground mb-2">Efficiency</div>
              <Progress
                value={analyticsData.performanceMetrics.efficiencyTrend.slice(-1)[0]}
                className="h-2"
              />
              <div className="text-xs text-muted-foreground mt-1">7-day average</div>
            </div>

            {/* Error Rate */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <span
                  className={`text-2xl font-bold mr-2 ${getPerformanceColor(
                    5 - analyticsData.performanceMetrics.errorRateTrend.slice(-1)[0],
                    { good: 3, warning: 2 }
                  )}`}
                >
                  {analyticsData.performanceMetrics.errorRateTrend.slice(-1)[0]}
                </span>
                {getTrendIcon(
                  calculateTrend(analyticsData.performanceMetrics.errorRateTrend),
                  true
                )}
              </div>
              <div className="text-sm text-muted-foreground mb-2">Errors/Hour</div>
              <div className="h-2 bg-muted rounded-full">
                <div
                  className="h-2 bg-red-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(analyticsData.performanceMetrics.errorRateTrend.slice(-1)[0] * 20, 100)}%`,
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">7-day average</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Maintenance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {analyticsData.maintenanceHistory.totalEvents}
              </div>
              <div className="text-sm text-muted-foreground">Total Events</div>
              <div className="text-xs text-muted-foreground mt-1">Last 12 months</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {analyticsData.maintenanceHistory.averageDowntime}h
              </div>
              <div className="text-sm text-muted-foreground">Avg Downtime</div>
              <div className="text-xs text-muted-foreground mt-1">Per event</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1 text-green-600">
                ${analyticsData.maintenanceHistory.costSavings.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Cost Savings</div>
              <div className="text-xs text-muted-foreground mt-1">vs reactive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {Math.round(analyticsData.maintenanceHistory.preventiveRatio * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Preventive</div>
              <div className="text-xs text-muted-foreground mt-1">vs reactive</div>
            </div>
          </div>

          {/* Maintenance Type Distribution */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium mb-3">Maintenance Type Distribution</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Preventive</span>
                <div className="flex items-center gap-2">
                  <Progress value={75} className="w-24 h-2" />
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Corrective</span>
                <div className="flex items-center gap-2">
                  <Progress value={20} className="w-24 h-2" />
                  <span className="text-sm font-medium">20%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Emergency</span>
                <div className="flex items-center gap-2">
                  <Progress value={5} className="w-24 h-2" />
                  <span className="text-sm font-medium">5%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                ${analyticsData.costAnalysis.monthlyOperatingCost.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Monthly Operating Cost</div>
              <div className="text-xs text-muted-foreground mt-1">
                Trend:{' '}
                {getTrendIcon(calculateTrend(analyticsData.costAnalysis.maintenanceCostTrend))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {analyticsData.costAnalysis.energyConsumption.slice(-1)[0]} kWh
              </div>
              <div className="text-sm text-muted-foreground">Energy Consumption</div>
              <div className="text-xs text-muted-foreground mt-1">Daily average</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1 text-green-600">
                ${(analyticsData.costAnalysis.monthlyOperatingCost * 0.15).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Potential Savings</div>
              <div className="text-xs text-muted-foreground mt-1">With optimization</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictive Insights */}
      {prediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-500" />
              Predictive Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Risk Assessment</h4>
                <div className="space-y-3">
                  {prediction.riskFactors.slice(0, 3).map((risk, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{risk.factor}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={risk.impact} className="w-16 h-2" />
                        <Badge
                          variant={
                            risk.impact > 70
                              ? 'destructive'
                              : risk.impact > 40
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {risk.impact}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3">Optimization Opportunities</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">
                      Preventive maintenance could save $
                      {prediction.costAnalysis.potentialSavings.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">
                      Optimal maintenance window:{' '}
                      {new Date(prediction.predictions.optimalMaintenanceDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">
                      {Math.round(prediction.predictions.confidenceLevel * 100)}% prediction
                      confidence
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Summary */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Health Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Current Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Health</span>
                    <Badge
                      className={
                        health.riskLevel === 'Low'
                          ? 'bg-green-500'
                          : health.riskLevel === 'Medium'
                            ? 'bg-yellow-500'
                            : health.riskLevel === 'High'
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                      }
                    >
                      {health.healthScore}/100
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Risk Level</span>
                    <Badge variant="outline">{health.riskLevel}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Alerts</span>
                    <Badge variant={health.alerts.length > 0 ? 'destructive' : 'outline'}>
                      {health.alerts.length}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3">Performance Trends</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Efficiency</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(health.trendAnalysis.efficiencyTrend.toLowerCase())}
                      <span className="text-sm">{health.trendAnalysis.efficiencyTrend}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uptime</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(health.trendAnalysis.uptimeTrend.toLowerCase())}
                      <span className="text-sm">{health.trendAnalysis.uptimeTrend}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(health.trendAnalysis.overallTrend.toLowerCase())}
                      <span className="text-sm">{health.trendAnalysis.overallTrend}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
