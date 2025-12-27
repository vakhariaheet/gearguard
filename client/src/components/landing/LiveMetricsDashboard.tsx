import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Users, Zap, Clock, TrendingUp, Server, AlertCircle } from 'lucide-react';
import { useSystemMetrics } from '@/hooks/useLandingStats';

export const LiveMetricsDashboard = () => {
  const { data: metrics, isLoading, error } = useSystemMetrics();

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !metrics) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Metrics Temporarily Unavailable</h3>
              <p className="text-muted-foreground">
                Live system metrics will be displayed here when available.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl font-bold">Live System Metrics</h2>
            <Badge variant="secondary" className="animate-pulse">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Live
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time performance insights from our production GearGuard system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Metrics */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-yellow-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>API Response Time</span>
                  <span className="font-medium">
                    {metrics.performanceMetrics.apiResponseTime}ms
                  </span>
                </div>
                <Progress
                  value={Math.max(0, 100 - metrics.performanceMetrics.apiResponseTime / 10)}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>System Availability</span>
                  <span className="font-medium text-green-600">
                    {metrics.performanceMetrics.systemAvailability}%
                  </span>
                </div>
                <Progress value={metrics.performanceMetrics.systemAvailability} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Processing Speed</span>
                  <span className="font-medium">
                    {metrics.performanceMetrics.dataProcessingSpeed}/sec
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Error Rate</span>
                  <span className="font-medium text-green-600">
                    {metrics.performanceMetrics.errorRate}%
                  </span>
                </div>
                <Progress value={100 - metrics.performanceMetrics.errorRate * 20} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Usage Metrics */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-blue-500" />
                Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.usageMetrics.dailyActiveUsers}
                </div>
                <div className="text-sm text-muted-foreground">Active Users Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.usageMetrics.requestsProcessed}
                </div>
                <div className="text-sm text-muted-foreground">Requests Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.usageMetrics.equipmentTracked.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Equipment Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.usageMetrics.maintenanceScheduled}
                </div>
                <div className="text-sm text-muted-foreground">Maintenance Scheduled</div>
              </div>
            </CardContent>
          </Card>

          {/* Efficiency Metrics */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Avg Resolution Time</span>
                  <span className="font-medium">
                    {metrics.efficiencyMetrics.averageResolutionTime}h
                  </span>
                </div>
                <Progress
                  value={Math.max(0, 100 - metrics.efficiencyMetrics.averageResolutionTime * 10)}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Preventive Maintenance</span>
                  <span className="font-medium text-green-600">
                    {metrics.efficiencyMetrics.preventiveMaintenanceRate}%
                  </span>
                </div>
                <Progress
                  value={metrics.efficiencyMetrics.preventiveMaintenanceRate}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Cost Reduction</span>
                  <span className="font-medium text-green-600">
                    {metrics.efficiencyMetrics.costReductionAchieved}%
                  </span>
                </div>
                <Progress value={metrics.efficiencyMetrics.costReductionAchieved} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Uptime Improvement</span>
                  <span className="font-medium text-green-600">
                    {metrics.efficiencyMetrics.uptimeImprovement}%
                  </span>
                </div>
                <Progress value={metrics.efficiencyMetrics.uptimeImprovement * 4} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Status Bar */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">System Status: Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-500" />
                <span>All Services Running</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span>Updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
