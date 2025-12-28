import { useTeams } from './useTeams';

/**
 * Custom hook to get team name by team ID
 * Returns the team name or 'Unknown' if not found
 */
export const useTeamName = (teamId: string | undefined): string => {
  const { data: teamsResponse } = useTeams({ isActive: true });
  const teams = teamsResponse?.data?.teams || [];

  if (!teamId) return '';

  const team = teams.find((t) => t.id === teamId);
  return team?.teamName || 'Unknown';
};

/**
 * Custom hook to get multiple team names by team IDs
 * Returns a map of teamId -> teamName
 */
export const useTeamNames = (teamIds: (string | undefined)[]): Record<string, string> => {
  const { data: teamsResponse } = useTeams({ isActive: true });
  const teams = teamsResponse?.data?.teams || [];

  const teamMap: Record<string, string> = {};

  teamIds.forEach((teamId) => {
    if (teamId) {
      const team = teams.find((t) => t.id === teamId);
      teamMap[teamId] = team?.teamName || 'Unknown';
    }
  });

  return teamMap;
};
