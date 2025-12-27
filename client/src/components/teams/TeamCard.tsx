/**
 * TeamCard Component
 * Displays team information in a card format
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Settings,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import type { Team } from '@/types/teams';
import { SkillBadges } from './SkillBadges';
import { useLeadTechnicianName } from '@/hooks/useLeadTechnicianName';

interface TeamCardProps {
  team: Team;
  onView?: (team: Team) => void;
  onEdit?: (team: Team) => void;
  onDelete?: (team: Team) => void;
  onAddMember?: (team: Team) => void;
  showActions?: boolean;
}

export const TeamCard = ({
  team,
  onView,
  onEdit,
  onDelete,
  onAddMember,
  showActions = true,
}: TeamCardProps) => {
  const workloadPercentage = team.maxCapacity
    ? Math.round((team.currentWorkload / team.maxCapacity) * 100)
    : 0;

  // Try to fetch lead technician details if not in members
  const leadMember = team.members.find((m) => m.userId === team.leadTechnician);
  const { data: leadTechnicianUser } = useLeadTechnicianName(
    team.leadTechnician && !leadMember ? team.leadTechnician : undefined
  );

  const getWorkloadColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSpecializationColor = (specialization: string) => {
    const colors: Record<string, string> = {
      Mechanics: 'bg-blue-100 text-blue-800',
      Electricians: 'bg-yellow-100 text-yellow-800',
      'IT Support': 'bg-purple-100 text-purple-800',
      HVAC: 'bg-green-100 text-green-800',
      General: 'bg-gray-100 text-gray-800',
      Facilities: 'bg-orange-100 text-orange-800',
    };
    return colors[specialization] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {team.teamName}
              {team.isActive ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
            <Badge
              variant="secondary"
              className={`mt-1 ${getSpecializationColor(team.specialization)}`}
            >
              {team.specialization}
            </Badge>
          </div>
          {showActions && (
            <div className="flex gap-1">
              {onView && (
                <Button variant="ghost" size="sm" onClick={() => onView(team)}>
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(team)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(team)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {team.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>
        )}

        {/* Team Members */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {team.members.length} member{team.members.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Member Avatars */}
          <div className="flex -space-x-2">
            {team.members.slice(0, 3).map((member) => (
              <Avatar key={member.userId} className="h-6 w-6 border-2 border-background">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.userName}`}
                />
                <AvatarFallback className="text-xs">
                  {member.userName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {team.members.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs text-muted-foreground">+{team.members.length - 3}</span>
              </div>
            )}
            {onAddMember && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 rounded-full p-0 ml-2"
                onClick={() => onAddMember(team)}
              >
                <UserPlus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Workload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Workload</span>
            <span className={`font-medium ${getWorkloadColor(workloadPercentage)}`}>
              {team.currentWorkload}/{team.maxCapacity || 10} ({workloadPercentage}%)
            </span>
          </div>
          <Progress value={workloadPercentage} className="h-2" />
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Skills</span>
          <SkillBadges skills={team.skills} maxDisplay={3} size="sm" />
        </div>

        {/* Lead Technician */}
        {team.leadTechnician && (
          <div className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Lead:</span>
            <span className="font-medium">
              {(() => {
                // First check if lead is in the members array
                if (leadMember) {
                  return leadMember.userName;
                }
                // Then check if we have the enriched leadTechnicianName from backend
                if (team.leadTechnicianName) {
                  return team.leadTechnicianName;
                }
                // Then check if we fetched the user details (fallback)
                if (leadTechnicianUser) {
                  return (
                    `${leadTechnicianUser.firstName || ''} ${leadTechnicianUser.lastName || ''}`.trim() ||
                    leadTechnicianUser.email
                  );
                }
                // Show a more user-friendly message
                return (
                  <span className="text-muted-foreground italic">
                    Assigned (not yet added to team)
                  </span>
                );
              })()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
