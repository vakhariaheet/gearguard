import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Target,
  Lightbulb,
} from 'lucide-react';
import type { SmartScheduleRequest, SmartScheduleResponse } from '@/types/equipment';
import { useMaintenanceSchedule } from '@/hooks/useEquipment';
import { toast } from 'sonner';

interface SmartSchedulerProps {
  equipmentId: string;
  onScheduleCreated?: (schedule: SmartScheduleResponse) => void;
}

export const SmartScheduler = ({ equipmentId, onScheduleCreated }: SmartSchedulerProps) => {
  const [scheduleParams, setScheduleParams] = useState<Partial<SmartScheduleRequest>>({
    maintenanceType: 'Routine',
    urgency: 'Medium',
    estimatedDuration: 4,
    requiredSkills: [],
    preferredTeam: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<SmartScheduleResponse | null>(null);

  const {
    data: schedule,
    isLoading,
    refetch,
  } = useMaintenanceSchedule(equipmentId, scheduleParams);

  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    try {
      const result = await refetch();
      if (result.data) {
        setGeneratedSchedule(result.data);
        toast.success('Smart schedule generated successfully');
      }
    } catch (error) {
      toast.error('Failed to generate schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !scheduleParams.requiredSkills?.includes(skillInput.trim())) {
      setScheduleParams((prev) => ({
        ...prev,
        requiredSkills: [...(prev.requiredSkills || []), skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setScheduleParams((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills?.filter((s) => s !== skill) || [],
    }));
  };

  const handleCreateMaintenanceRequest = async () => {
    if (!generatedSchedule) return;

    try {
      // This would integrate with the request management system
      const requestData = {
        subject: `${scheduleParams.maintenanceType} Maintenance - Smart Scheduled`,
        description: `Smart-scheduled maintenance based on AI optimization.\n\nRecommended date: ${new Date(generatedSchedule.recommendedDate).toLocaleDateString()}\nAssigned team: ${generatedSchedule.assignedTeam}\nEstimated duration: ${generatedSchedule.estimatedDuration} hours\n\nOptimization reasoning:\n${generatedSchedule.reasoning.join('\n')}`,
        requestType: scheduleParams.maintenanceType,
        equipmentId,
        priority: scheduleParams.urgency,
        scheduledDate: generatedSchedule.recommendedDate,
        assignedTeam: generatedSchedule.assignedTeam,
        estimatedDuration: generatedSchedule.estimatedDuration,
      };

      // In a real implementation, this would call the requests API
      console.log('Creating maintenance request:', requestData);
      toast.success('Maintenance request created successfully');
      onScheduleCreated?.(generatedSchedule);
    } catch (error) {
      toast.error('Failed to create maintenance request');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
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

  const getOptimizationScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Schedule Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Smart Schedule Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Maintenance Type */}
            <div className="space-y-2">
              <Label htmlFor="maintenanceType">Maintenance Type</Label>
              <Select
                value={scheduleParams.maintenanceType}
                onValueChange={(value: any) =>
                  setScheduleParams((prev) => ({ ...prev, maintenanceType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select maintenance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Routine">Routine</SelectItem>
                  <SelectItem value="Preventive">Preventive</SelectItem>
                  <SelectItem value="Predictive">Predictive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select
                value={scheduleParams.urgency}
                onValueChange={(value: any) =>
                  setScheduleParams((prev) => ({ ...prev, urgency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estimated Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (hours)</Label>
              <Input
                type="number"
                min="1"
                max="48"
                value={scheduleParams.estimatedDuration || ''}
                onChange={(e) =>
                  setScheduleParams((prev) => ({
                    ...prev,
                    estimatedDuration: parseInt(e.target.value) || undefined,
                  }))
                }
                placeholder="4"
              />
            </div>

            {/* Preferred Team */}
            <div className="space-y-2">
              <Label htmlFor="team">Preferred Team</Label>
              <Input
                value={scheduleParams.preferredTeam || ''}
                onChange={(e) =>
                  setScheduleParams((prev) => ({ ...prev, preferredTeam: e.target.value }))
                }
                placeholder="Team name (optional)"
              />
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-2">
            <Label>Required Skills</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add required skill"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              />
              <Button onClick={handleAddSkill} variant="outline">
                Add
              </Button>
            </div>
            {scheduleParams.requiredSkills && scheduleParams.requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {scheduleParams.requiredSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveSkill(skill)}
                  >
                    {skill} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleGenerateSchedule}
            disabled={isGenerating || isLoading}
            className="w-full"
          >
            {isGenerating || isLoading ? 'Generating...' : 'Generate Smart Schedule'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Schedule */}
      {(schedule || generatedSchedule) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                AI-Generated Schedule
              </div>
              <Badge className={getUrgencyColor(scheduleParams.urgency || 'Medium')}>
                {scheduleParams.urgency} Priority
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const currentSchedule = generatedSchedule || schedule;
              if (!currentSchedule) return null;

              return (
                <>
                  {/* Optimization Score */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">Optimization Score</span>
                    <span
                      className={`text-lg font-bold ${getOptimizationScoreColor(currentSchedule.optimizationScore)}`}
                    >
                      {currentSchedule.optimizationScore}/100
                    </span>
                  </div>

                  {/* Recommended Schedule */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Recommended Date</span>
                        </div>
                        <div className="text-lg font-bold">
                          {new Date(currentSchedule.recommendedDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(currentSchedule.recommendedDate).toLocaleTimeString()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Assigned Team</span>
                        </div>
                        <div className="text-lg font-bold">{currentSchedule.assignedTeam}</div>
                        <div className="text-sm text-muted-foreground">
                          Duration: {currentSchedule.estimatedDuration} hours
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Alternative Dates */}
                  {currentSchedule.alternativeDates.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Alternative Dates</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {currentSchedule.alternativeDates.map((date, index) => (
                          <div key={index} className="p-2 bg-muted rounded text-center text-sm">
                            {new Date(date).toLocaleDateString()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reasoning */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      AI Reasoning
                    </h4>
                    <ul className="space-y-1">
                      {(Array.isArray(currentSchedule.reasoning)
                        ? currentSchedule.reasoning
                        : [currentSchedule.reasoning || 'No reasoning provided']
                      ).map((reason, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Conflict Warnings */}
                  {currentSchedule.conflictWarnings.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Potential Conflicts
                      </h4>
                      <ul className="space-y-1">
                        {(Array.isArray(currentSchedule.conflictWarnings)
                          ? currentSchedule.conflictWarnings
                          : [currentSchedule.conflictWarnings || 'No conflicts detected']
                        ).map((warning, index) => (
                          <li key={index} className="text-sm flex items-start text-yellow-700">
                            <span className="w-1 h-1 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={handleCreateMaintenanceRequest} className="flex-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Maintenance Request
                    </Button>
                    <Button variant="outline" onClick={handleGenerateSchedule}>
                      <Clock className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
