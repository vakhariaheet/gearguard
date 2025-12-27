import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '../ui/slider';
import { Users, Zap, MapPin, Clock, Target, Brain, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { AutoAssignmentResponse, MaintenanceRequest } from '@/types/requests';

interface AutoAssignmentPanelProps {
  request: MaintenanceRequest;
  onAssignmentComplete?: (assignment: AutoAssignmentResponse) => void;
}

export const AutoAssignmentPanel = ({
  request,
  onAssignmentComplete,
}: AutoAssignmentPanelProps) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignment, setAssignment] = useState<AutoAssignmentResponse | null>(null);
  const [assignmentConfig, setAssignmentConfig] = useState({
    workloadConsideration: true,
    skillWeighting: 0.4,
    locationWeighting: 0.3,
    availabilityWeighting: 0.3,
    maxDistance: 50,
    sameBuilding: false,
  });

  const handleAutoAssignment = async () => {
    setIsAssigning(true);
    try {
      const token = localStorage.getItem('clerk-db-jwt');
      const response = await fetch(`/api/requests/${request.id}/auto-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: request.id,
          equipmentId: request.equipmentId,
          urgency: request.priority,
          requiredSkills: getRequiredSkills(request),
          preferredTeam: request.assignedTeam,
          locationConstraints: {
            maxDistance: assignmentConfig.maxDistance,
            sameBuilding: assignmentConfig.sameBuilding,
          },
          workloadConsideration: assignmentConfig.workloadConsideration,
          skillWeighting: assignmentConfig.skillWeighting,
          locationWeighting: assignmentConfig.locationWeighting,
          availabilityWeighting: assignmentConfig.availabilityWeighting,
        }),
      });

      // Check if response is HTML (404 page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType?.includes('application/json')) {
        // If API is not available, show mock assignment
        const mockAssignment = {
          assignedTechnician: {
            userId: 'user-123',
            name: 'John Smith',
            email: 'john.smith@company.com',
            team: 'Mechanics Team',
            skills: ['Mechanical Repair', 'Hydraulics', 'Pneumatics'],
            currentWorkload: 3,
            location: 'Building A',
            estimatedArrival: 15,
          },
          alternativeTechnicians: [
            {
              userId: 'user-456',
              name: 'Sarah Johnson',
              score: 85,
              reason: 'High skill match but currently busy',
            },
            {
              userId: 'user-789',
              name: 'Mike Wilson',
              score: 78,
              reason: 'Available but lower skill match',
            },
          ],
          assignmentScore: 92,
          assignmentReasoning: [
            'Perfect skill match for mechanical repair',
            'Low current workload (3/10)',
            'Located in same building',
            'Excellent past performance rating',
          ],
          estimatedResponseTime: 15,
          confidence: 0.92,
          autoAssigned: false,
        };

        setAssignment(mockAssignment);
        onAssignmentComplete?.(mockAssignment);
        toast.success('Generated demo assignment recommendation (API not available)');
        return;
      }

      const data = await response.json();
      setAssignment(data.data);
      onAssignmentComplete?.(data.data);

      if (data.data.autoAssigned) {
        toast.success(`Request automatically assigned to ${data.data.assignedTechnician.name}`);
      } else {
        toast.success('Assignment recommendation generated');
      }
    } catch (error: any) {
      console.error('Auto-assignment error:', error);

      // If it's a network error, show demo data
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        const mockAssignment = {
          assignedTechnician: {
            userId: 'user-123',
            name: 'John Smith',
            email: 'john.smith@company.com',
            team: 'Mechanics Team',
            skills: ['Mechanical Repair', 'Hydraulics', 'Pneumatics'],
            currentWorkload: 3,
            location: 'Building A',
            estimatedArrival: 15,
          },
          alternativeTechnicians: [
            {
              userId: 'user-456',
              name: 'Sarah Johnson',
              score: 85,
              reason: 'High skill match but currently busy',
            },
            {
              userId: 'user-789',
              name: 'Mike Wilson',
              score: 78,
              reason: 'Available but lower skill match',
            },
          ],
          assignmentScore: 92,
          assignmentReasoning: [
            'Perfect skill match for mechanical repair',
            'Low current workload (3/10)',
            'Located in same building',
            'Excellent past performance rating',
          ],
          estimatedResponseTime: 15,
          confidence: 0.92,
          autoAssigned: false,
        };

        setAssignment(mockAssignment);
        onAssignmentComplete?.(mockAssignment);
        toast.success('Generated demo assignment recommendation (API not available)');
      } else {
        toast.error(error?.message || 'Auto-assignment failed. Please try again.');
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const confirmAssignment = async () => {
    if (!assignment) return;

    try {
      const token = localStorage.getItem('clerk-db-jwt');
      const response = await fetch(`/api/requests/${request.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedTechnician: assignment.assignedTechnician.userId,
          assignedTeam: assignment.assignedTechnician.team,
        }),
      });

      if (response.ok) {
        toast.success('Request assigned successfully');
        onAssignmentComplete?.(assignment);
      }
    } catch (error) {
      toast.error('Failed to confirm assignment');
    }
  };

  const getRequiredSkills = (request: MaintenanceRequest): string[] => {
    // Extract required skills based on request and equipment type
    const skillMap: Record<string, string[]> = {
      Machine: ['Mechanical Repair', 'Hydraulics', 'Pneumatics'],
      Vehicle: ['Automotive Repair', 'Engine Diagnostics'],
      Computer: ['Hardware Troubleshooting', 'Network Configuration'],
      Electrical: ['Electrical Wiring', 'Circuit Analysis'],
    };
    return skillMap[request.equipmentCategory] || [];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Assignment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Smart Assignment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="workload">Consider Current Workload</Label>
                <Switch
                  id="workload"
                  checked={assignmentConfig.workloadConsideration}
                  onCheckedChange={(checked) =>
                    setAssignmentConfig((prev) => ({ ...prev, workloadConsideration: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Skill Matching Weight: {Math.round(assignmentConfig.skillWeighting * 100)}%
                </Label>
                <Slider
                  value={[assignmentConfig.skillWeighting]}
                  onValueChange={([value]: number[]) =>
                    setAssignmentConfig((prev) => ({ ...prev, skillWeighting: value }))
                  }
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Location Priority: {Math.round(assignmentConfig.locationWeighting * 100)}%
                </Label>
                <Slider
                  value={[assignmentConfig.locationWeighting]}
                  onValueChange={([value]: number[]) =>
                    setAssignmentConfig((prev) => ({ ...prev, locationWeighting: value }))
                  }
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Availability Weight: {Math.round(assignmentConfig.availabilityWeighting * 100)}%
                </Label>
                <Slider
                  value={[assignmentConfig.availabilityWeighting]}
                  onValueChange={([value]: number[]) =>
                    setAssignmentConfig((prev) => ({ ...prev, availabilityWeighting: value }))
                  }
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Max Distance: {assignmentConfig.maxDistance} km</Label>
                <Slider
                  value={[assignmentConfig.maxDistance]}
                  onValueChange={([value]: number[]) =>
                    setAssignmentConfig((prev) => ({ ...prev, maxDistance: value }))
                  }
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sameBuilding">Same Building Only</Label>
                <Switch
                  id="sameBuilding"
                  checked={assignmentConfig.sameBuilding}
                  onCheckedChange={(checked) =>
                    setAssignmentConfig((prev) => ({ ...prev, sameBuilding: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleAutoAssignment}
            disabled={isAssigning || request.status !== 'New'}
            className="w-full"
            size="lg"
          >
            {isAssigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing Technicians...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Smart Assignment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Assignment Results */}
      {assignment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Assignment Recommendation
              </div>
              <Badge
                className={`${getScoreColor(assignment.assignmentScore)} bg-transparent border`}
              >
                {assignment.assignmentScore}% Match
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="recommended" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recommended">Recommended</TabsTrigger>
                <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
                <TabsTrigger value="reasoning">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="recommended" className="space-y-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">
                            {assignment.assignedTechnician.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.assignedTechnician.team}
                          </div>
                        </div>
                      </div>
                      {!assignment.autoAssigned && (
                        <Button onClick={confirmAssignment}>Confirm Assignment</Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Target className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium">
                          {assignment.assignedTechnician.currentWorkload}/10
                        </div>
                        <div className="text-xs text-muted-foreground">Current Load</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium">
                          {assignment.estimatedResponseTime}min
                        </div>
                        <div className="text-xs text-muted-foreground">Response Time</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium">
                          {assignment.assignedTechnician.estimatedArrival || 'N/A'}min
                        </div>
                        <div className="text-xs text-muted-foreground">Travel Time</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium">
                          {Math.round(assignment.confidence * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Confidence</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {assignment.assignedTechnician.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alternatives" className="space-y-3">
                {assignment.alternativeTechnicians.map((tech) => (
                  <Card key={tech.userId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{tech.name}</div>
                          <div className="text-sm text-muted-foreground">{tech.reason}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(tech.score)}`}>
                            {tech.score}%
                          </div>
                          <Progress value={tech.score} className="w-20 h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="reasoning" className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    Assignment Analysis
                  </h4>
                  <ul className="space-y-2">
                    {assignment.assignmentReasoning.map((reason, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-800 mb-1">
                    Assignment Score Breakdown
                  </div>
                  <div className="text-sm text-blue-700">
                    This assignment scored {assignment.assignmentScore}% based on skill matching (
                    {Math.round(assignmentConfig.skillWeighting * 100)}%), location proximity (
                    {Math.round(assignmentConfig.locationWeighting * 100)}%), and current
                    availability ({Math.round(assignmentConfig.availabilityWeighting * 100)}%).
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {isAssigning && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-lg font-medium mb-2">Analyzing Available Technicians</div>
            <div className="text-sm text-muted-foreground">
              Evaluating skills, workload, location, and availability...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
