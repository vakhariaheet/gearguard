/**
 * TeamAssignmentSuggestion Component
 * AI-powered team assignment suggestion for maintenance requests
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, Target, TrendingUp, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { useSuggestTeamAssignment } from '@/hooks/useTeams';
import type { Team, TeamAssignmentRequest, TeamAssignmentResponse } from '@/types/teams';
import { SkillBadges } from './SkillBadges';

interface TeamAssignmentSuggestionProps {
  equipmentId: string;
  equipmentCategory: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  requiredSkills?: string[];
  onTeamSelected?: (team: Team) => void;
  className?: string;
}

export const TeamAssignmentSuggestion = ({
  equipmentId,
  equipmentCategory,
  urgency,
  requiredSkills = [],
  onTeamSelected,
  className = '',
}: TeamAssignmentSuggestionProps) => {
  const [suggestion, setSuggestion] = useState<TeamAssignmentResponse['data'] | null>(null);

  const suggestMutation = useSuggestTeamAssignment();

  const handleGetSuggestion = async () => {
    const request: TeamAssignmentRequest = {
      equipmentId,
      equipmentCategory,
      urgency,
      requiredSkills:
        requiredSkills.length > 0
          ? requiredSkills
          : getRequiredSkillsForCategory(equipmentCategory),
    };

    try {
      const response = await suggestMutation.mutateAsync(request);
      setSuggestion(response.data);
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Team suggestion failed:', error);
    }
  };

  const getRequiredSkillsForCategory = (category: string): string[] => {
    const skillMap: Record<string, string[]> = {
      Machine: ['Mechanical Repair', 'Hydraulics', 'Pneumatics'],
      Vehicle: ['Automotive Repair', 'Engine Diagnostics', 'Electrical Systems'],
      Computer: ['Hardware Troubleshooting', 'Network Configuration', 'Software Installation'],
      HVAC: ['Climate Control', 'Refrigeration', 'Ductwork'],
      Electrical: ['Electrical Wiring', 'Circuit Analysis', 'Safety Protocols'],
      Building: ['Facility Management', 'Plumbing', 'Carpentry'],
      Equipment: ['Preventive Maintenance', 'Troubleshooting', 'Safety Protocols'],
    };
    return skillMap[category] || [];
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

  const getWorkloadColor = (impact: string) => {
    switch (impact) {
      case 'Low':
        return 'text-green-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'High':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Trigger Button */}
      <Button
        onClick={handleGetSuggestion}
        disabled={suggestMutation.isPending}
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
      >
        {suggestMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        {suggestMutation.isPending ? 'Analyzing...' : 'Suggest Best Team'}
      </Button>

      {/* Request Info */}
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">{equipmentCategory}</Badge>
        <Badge variant="outline" className={getUrgencyColor(urgency)}>
          {urgency} Priority
        </Badge>
        {requiredSkills.length > 0 && (
          <Badge variant="outline">{requiredSkills.length} Required Skills</Badge>
        )}
      </div>

      {/* Suggestion Results */}
      {suggestion && (
        <div className="space-y-4">
          {/* Recommended Team */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Recommended Team
                </div>
                <Badge className={`${getConfidenceColor(suggestion.confidence)}`}>
                  {Math.round(suggestion.confidence * 100)}% Match
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Team Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{suggestion.recommendedTeam.teamName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.recommendedTeam.specialization}
                    </p>
                  </div>
                  {onTeamSelected && (
                    <Button
                      onClick={() => onTeamSelected(suggestion.recommendedTeam)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Select Team
                    </Button>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">
                      {suggestion.recommendedTeam.members.length} Members
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">
                      {suggestion.estimatedResponseTime}h Response
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div
                      className={`text-sm font-medium ${getWorkloadColor(suggestion.workloadImpact)}`}
                    >
                      {suggestion.workloadImpact} Impact
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-medium">{suggestion.skillMatch}% Skills</div>
                    <Progress value={suggestion.skillMatch} className="h-1 mt-1" />
                  </div>
                </div>

                {/* AI Reasoning */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Why this team?
                  </h4>
                  <ul className="text-sm space-y-1">
                    {suggestion.reasoning.map((reason, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1 h-1 bg-current rounded-full mt-2 mr-2 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Team Skills */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Team Skills</h4>
                  <SkillBadges
                    skills={suggestion.recommendedTeam.skills}
                    maxDisplay={6}
                    size="sm"
                  />
                </div>

                {/* Current Workload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Workload</span>
                    <span className="font-medium">
                      {suggestion.recommendedTeam.currentWorkload}/
                      {suggestion.recommendedTeam.maxCapacity || 10}
                    </span>
                  </div>
                  <Progress
                    value={
                      (suggestion.recommendedTeam.currentWorkload /
                        (suggestion.recommendedTeam.maxCapacity || 10)) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Teams */}
          {suggestion.alternativeTeams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Alternative Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestion.alternativeTeams.slice(0, 2).map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{team.teamName}</div>
                        <div className="text-sm text-muted-foreground">
                          {team.specialization} • {team.members.length} members
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Workload: {team.currentWorkload}/{team.maxCapacity || 10}
                        </div>
                      </div>
                      {onTeamSelected && (
                        <Button variant="outline" size="sm" onClick={() => onTeamSelected(team)}>
                          Select
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
