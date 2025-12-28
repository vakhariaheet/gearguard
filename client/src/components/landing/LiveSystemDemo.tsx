import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Monitor,
  Wrench,
  Users,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useLiveDemoData } from '@/hooks/useLandingStats';
import type { LiveDemoData } from '@/types/landing';

export const LiveSystemDemo = () => {
  const { data: demoData, isLoading, error } = useLiveDemoData();
  const [activeTab, setActiveTab] = useState('equipment');

  // Fallback data for when API is unavailable
  const fallbackDemoData = {
    sampleEquipment: [
      {
        id: 'demo-eq-1',
        name: 'CNC Machine #1',
        category: 'Manufacturing',
        status: 'Active',
        healthScore: 87,
        lastMaintenance: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-eq-2',
        name: 'Forklift #3',
        category: 'Vehicle',
        status: 'Under Maintenance',
        healthScore: 65,
        lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-eq-3',
        name: 'Server Rack A',
        category: 'IT Equipment',
        status: 'Active',
        healthScore: 94,
        lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    sampleRequests: [
      {
        id: 'demo-req-1',
        subject: 'Oil leak in hydraulic system',
        status: 'In Progress',
        priority: 'High',
        assignedTeam: 'Mechanics Team',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-req-2',
        subject: 'Routine maintenance check',
        status: 'Completed',
        priority: 'Medium',
        assignedTeam: 'General Maintenance',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-req-3',
        subject: 'Network connectivity issues',
        status: 'New',
        priority: 'Critical',
        assignedTeam: 'IT Support',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ],
    sampleTeams: [
      {
        id: 'demo-team-1',
        name: 'Mechanics Team',
        specialization: 'Mechanical Repair',
        memberCount: 8,
        activeRequests: 12,
      },
      {
        id: 'demo-team-2',
        name: 'IT Support',
        specialization: 'Computer Systems',
        memberCount: 5,
        activeRequests: 7,
      },
      {
        id: 'demo-team-3',
        name: 'Electricians',
        specialization: 'Electrical Systems',
        memberCount: 6,
        activeRequests: 4,
      },
    ],
    realTimeMetrics: {
      activeUsers: 42,
      requestsToday: 187,
      systemLoad: 35,
      responseTime: 165,
    },
  };

  const displayData: LiveDemoData = demoData || fallbackDemoData;
  const isLiveData = !!demoData;

  // Additional safety check
  if (!displayData || !displayData.realTimeMetrics) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="w-full max-w-4xl mx-auto">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <div className="text-lg font-medium">Demo Temporarily Unavailable</div>
              <div className="text-sm text-muted-foreground">
                Please refresh the page to try again
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'bg-green-500';
      case 'in progress':
      case 'assigned':
        return 'bg-blue-500';
      case 'new':
      case 'pending':
        return 'bg-yellow-500';
      case 'under maintenance':
      case 'critical':
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="w-full max-w-4xl mx-auto">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <div className="text-lg font-medium">Loading Live Demo...</div>
              <div className="text-sm text-muted-foreground">Connecting to GearGuard system</div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (error || !demoData) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="w-full max-w-4xl mx-auto">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <div className="text-lg font-medium">Demo Temporarily Unavailable</div>
              <div className="text-sm text-muted-foreground">
                Please try again later or contact support
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* Real-time Metrics Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Live System Metrics
                {isLiveData ? (
                  <Badge variant="secondary" className="ml-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Live Data
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-auto">
                    Demo Data
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {displayData.realTimeMetrics.activeUsers}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {displayData.realTimeMetrics.requestsToday}
                  </div>
                  <div className="text-sm text-muted-foreground">Requests Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {displayData.realTimeMetrics.responseTime}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {displayData.realTimeMetrics.systemLoad}%
                  </div>
                  <div className="text-sm text-muted-foreground">System Load</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Demo Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Interactive System Demo
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Explore real GearGuard features with{' '}
                {isLiveData
                  ? 'live data from our production system'
                  : 'demo data showcasing system capabilities'}
              </p>
              {error && !isLiveData && (
                <p className="text-sm text-orange-600 mt-2">
                  Live data temporarily unavailable - showing demo data
                </p>
              )}
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="equipment" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Equipment
                  </TabsTrigger>
                  <TabsTrigger value="requests" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Requests
                  </TabsTrigger>
                  <TabsTrigger value="teams" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Teams
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="equipment" className="space-y-4 mt-6">
                  <div className="grid gap-4">
                    {displayData.sampleEquipment.map((equipment: any) => (
                      <Card key={equipment.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Wrench className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{equipment.equipmentName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {equipment.category}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-sm font-medium">Health Score</div>
                                <div className="flex items-center gap-2">
                                  <Progress value={equipment.healthScore} className="w-16 h-2" />
                                  <span className="text-sm font-bold">
                                    {equipment.healthScore}%
                                  </span>
                                </div>
                              </div>
                              <Badge className={getStatusColor(equipment.status)}>
                                {equipment.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            Last Maintenance:{' '}
                            {new Date(equipment.lastMaintenance).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="requests" className="space-y-4 mt-6">
                  <div className="grid gap-4">
                    {displayData.sampleRequests.map((request: any) => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                {request.status === 'Completed' ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : request.priority === 'Critical' ? (
                                  <AlertTriangle className="h-5 w-5 text-red-600" />
                                ) : (
                                  <Clock className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{request.subject}</div>
                                <div className="text-sm text-muted-foreground">
                                  Assigned to {request.assignedTeam}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={getPriorityColor(request.priority)}
                              >
                                {request.priority}
                              </Badge>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            Created: {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="teams" className="space-y-4 mt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {displayData.sampleTeams.map((team: any) => (
                      <Card key={team.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="font-medium">{team.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {team.specialization}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <div className="text-lg font-bold text-blue-600">
                                {team.memberCount}
                              </div>
                              <div className="text-xs text-muted-foreground">Members</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-orange-600">
                                {team.activeRequests}
                              </div>
                              <div className="text-xs text-muted-foreground">Active Requests</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold mb-2">
                Ready to Transform Your Maintenance Operations?
              </h3>
              <p className="text-muted-foreground mb-4">
                Join hundreds of companies already using GearGuard to optimize their maintenance
                workflows
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg">Start Free Trial</Button>
                <Button size="lg" variant="outline">
                  Schedule Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
