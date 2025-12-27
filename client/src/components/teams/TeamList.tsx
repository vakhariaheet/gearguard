/**
 * TeamList Component
 * Displays a list of teams with filtering and pagination
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Users, Loader2, AlertCircle } from 'lucide-react';
import { useTeams } from '@/hooks/useTeams';
import { TeamCard } from './TeamCard';
import type { Team, ListTeamsQuery, TeamSpecialization } from '@/types/teams';

interface TeamListProps {
  onCreateTeam?: () => void;
  onViewTeam?: (team: Team) => void;
  onEditTeam?: (team: Team) => void;
  onDeleteTeam?: (team: Team) => void;
  onAddMember?: (team: Team) => void;
  showActions?: boolean;
}

const SPECIALIZATIONS: TeamSpecialization[] = [
  'Mechanics',
  'Electricians',
  'IT Support',
  'HVAC',
  'General',
  'Facilities',
];

const ORDER_BY_OPTIONS = [
  { value: 'teamName', label: 'Team Name' },
  { value: 'specialization', label: 'Specialization' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'currentWorkload', label: 'Workload' },
];

export const TeamList = ({
  onCreateTeam,
  onViewTeam,
  onEditTeam,
  onDeleteTeam,
  onAddMember,
  showActions = true,
}: TeamListProps) => {
  const [query, setQuery] = useState<ListTeamsQuery>({
    limit: 20,
    offset: 0,
    orderBy: 'createdAt',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error, refetch } = useTeams(query);

  const handleSpecializationFilter = (specialization: string) => {
    setQuery((prev) => ({
      ...prev,
      specialization: specialization === 'all' ? undefined : specialization,
      offset: 0,
    }));
  };

  const handleActiveFilter = (isActive: string) => {
    setQuery((prev) => ({
      ...prev,
      isActive: isActive === 'all' ? undefined : isActive === 'true',
      offset: 0,
    }));
  };

  const handleOrderByChange = (orderBy: string) => {
    setQuery((prev) => ({
      ...prev,
      orderBy: orderBy as ListTeamsQuery['orderBy'],
      offset: 0,
    }));
  };

  const handleLoadMore = () => {
    setQuery((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 20),
    }));
  };

  // Filter teams by search term (client-side)
  const filteredTeams =
    data?.data.teams.filter(
      (team) =>
        searchTerm === '' ||
        team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.skills || []).some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm text-muted-foreground mb-4">Failed to load teams</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teams</h2>
          <p className="text-muted-foreground">Manage maintenance teams and their members</p>
        </div>
        {onCreateTeam && (
          <Button onClick={onCreateTeam}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Specialization Filter */}
            <Select onValueChange={handleSpecializationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Specializations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {SPECIALIZATIONS.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Active Status Filter */}
            <Select onValueChange={handleActiveFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select onValueChange={handleOrderByChange} defaultValue="createdAt">
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {ORDER_BY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {data && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>
              Showing {filteredTeams.length} of {data.data.totalCount} teams
            </span>
          </div>
          {query.specialization && <Badge variant="secondary">{query.specialization}</Badge>}
          {query.isActive !== undefined && (
            <Badge variant="secondary">{query.isActive ? 'Active' : 'Inactive'}</Badge>
          )}
        </div>
      )}

      {/* Teams Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading teams...</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || query.specialization || query.isActive !== undefined
                ? 'No teams match your filters'
                : 'No teams found'}
            </p>
            {onCreateTeam && (
              <Button onClick={onCreateTeam} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create First Team
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onView={onViewTeam}
              onEdit={onEditTeam}
              onDelete={onDeleteTeam}
              onAddMember={onAddMember}
              showActions={showActions}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {data && data.data.teams.length < data.data.totalCount && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} variant="outline" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Load More Teams
          </Button>
        </div>
      )}
    </div>
  );
};
