import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  Users,
  Wrench,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import type { RequestAnalytics } from '@/types/requests';

export const RequestAnalyticsComponent = () => {
  const [analytics, setAnalytics] = useState<RequestAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0], // Today
  });

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('clerk-db-jwt');
      const startDate = new Date(dateRange.start).toISOString();
      const endDate = new Date(dateRange.end + 'T23:59:59').toISOString();

      const response = await fetch(
        `/api/requests/analytics?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Check if response is HTML (404 page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType?.includes('application/json')) {
        throw new Error('API not available');
      }

      const data = await response.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);

      // Use mock data for development when API is not available
      const mockAnalytics = {
        timeRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        metrics: {
          totalRequests: 156,
          averageResponseTime: 45,
          averageResolutionTime: 180,
          slaComplianceRate: 87.5,
          escalationRate: 12.8,
          autoAssignmentRate: 73.2,
        },
        trends: {
          requestVolume: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 20) + 5,
          })),
          responseTimesTrend: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            avgTime: Math.floor(Math.random() * 60) + 30,
          })),
          slaBreaches: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            breaches: Math.floor(Math.random() * 5),
          })),
        },
        teamPerformance: [
          {
            teamId: 'team-1',
            teamName: 'Mechanics Team',
            requestsHandled: 45,
            avgResponseTime: 42,
            slaCompliance: 89.2,
          },
          {
            teamId: 'team-2',
            teamName: 'Electronics Team',
            requestsHandled: 38,
            avgResponseTime: 38,
            slaCompliance: 91.5,
          },
          {
            teamId: 'team-3',
            teamName: 'IT Support',
            requestsHandled: 73,
            avgResponseTime: 25,
            slaCompliance: 95.8,
          },
        ],
        equipmentInsights: [
          {
            equipmentId: 'eq-1',
            equipmentName: 'CNC Machine #1',
            requestCount: 12,
            avgResolutionTime: 240,
            criticalIssues: 2,
          },
          {
            equipmentId: 'eq-2',
            equipmentName: 'Hydraulic Press #3',
            requestCount: 8,
            avgResolutionTime: 180,
            criticalIssues: 1,
          },
          {
            equipmentId: 'eq-3',
            equipmentName: 'Server Rack A1',
            requestCount: 15,
            avgResolutionTime: 90,
            criticalIssues: 0,
          },
        ],
      };

      setAnalytics(mockAnalytics);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  // Chart colors - removed unused constant

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-sm text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-lg font-medium mb-2">No Analytics Data</div>
          <div className="text-sm text-muted-foreground mb-4">Unable to load analytics data.</div>
          <Button onClick={fetchAnalytics}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Request Analytics
            </div>
            <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <Button onClick={fetchAnalytics} disabled={isLoading}>
              Update Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{analytics.metrics.totalRequests}</div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {formatDuration(analytics.metrics.averageResponseTime)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {formatDuration(analytics.metrics.averageResolutionTime)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Resolution Time</div>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {formatPercentage(analytics.metrics.slaComplianceRate)}
                </div>
                <div className="text-sm text-muted-foreground">SLA Compliance</div>
              </div>
              <Badge
                variant={analytics.metrics.slaComplianceRate >= 90 ? 'default' : 'destructive'}
              >
                {analytics.metrics.slaComplianceRate >= 90 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {formatPercentage(analytics.metrics.escalationRate)}
                </div>
                <div className="text-sm text-muted-foreground">Escalation Rate</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {formatPercentage(analytics.metrics.autoAssignmentRate)}
                </div>
                <div className="text-sm text-muted-foreground">Auto-Assignment Rate</div>
              </div>
              <Users className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Volume Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Request Volume Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <BarChart data={analytics.trends.requestVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Response Times Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Response Times Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <LineChart data={analytics.trends.responseTimesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [formatDuration(value as number), 'Avg Response Time']}
                />
                <Line type="monotone" dataKey="avgTime" stroke="#00C49F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* SLA Breaches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            SLA Breaches Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <BarChart data={analytics.trends.slaBreaches}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="breaches" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.teamPerformance.map((team) => (
              <div key={team.teamId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{team.teamName}</div>
                  <Badge variant={team.slaCompliance >= 90 ? 'default' : 'secondary'}>
                    {formatPercentage(team.slaCompliance)} SLA Compliance
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Requests Handled</div>
                    <div className="font-medium">{team.requestsHandled}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg Response Time</div>
                    <div className="font-medium">{formatDuration(team.avgResponseTime)}</div>
                  </div>
                </div>
              </div>
            ))}

            {analytics.teamPerformance.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No team performance data available for the selected period.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-500" />
            Equipment Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.equipmentInsights.map((equipment) => (
              <div key={equipment.equipmentId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{equipment.equipmentName}</div>
                  {equipment.criticalIssues > 0 && (
                    <Badge variant="destructive">{equipment.criticalIssues} Critical Issues</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total Requests</div>
                    <div className="font-medium">{equipment.requestCount}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg Resolution Time</div>
                    <div className="font-medium">{formatDuration(equipment.avgResolutionTime)}</div>
                  </div>
                </div>
              </div>
            ))}

            {analytics.equipmentInsights.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No equipment insights available for the selected period.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
