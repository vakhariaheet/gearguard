// Export all custom hooks
export { useApi } from './useApi';
export { useLocalStorage } from './useLocalStorage';
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useAsync, useAsyncCallback } from './useAsync';
export { useConfirmDialog } from './useConfirmDialog';
export { useWebSocket, useWebSocketChat, useWebSocketNotifications } from './useWebSocket';
export { useScrollToTop } from './useScrollToTop';
export { useUserLookup } from './useUserLookup';

// Landing page hooks
export {
  useLandingStats,
  useSystemMetrics,
  useLiveDemoData,
  useTestimonials,
} from './useLandingStats';

// User API hooks
export {
  useUsers,
  useUserDetails,
  useAdminStats,
  useWhoAmI,
  useInviteUser,
  useInvitations,
  useRevokeInvitation,
  useResendInvitation,
  useChangeRole,
  useBanUser,
  useUnbanUser,
  useDeleteUser,
  userKeys,
  authKeys,
} from './useUsers';

// Teams API hooks
export {
  useTeams,
  useTeam,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useAddTeamMember,
  useRemoveTeamMember,
  useSuggestTeamAssignment,
  TEAMS_QUERY_KEYS,
} from './useTeams';

// Team utility hooks
export { useTeamName, useTeamNames } from './useTeamName';

// User utility hooks
export { useUserName, useUserNames } from './useUserName';

// Kanban hooks
export {
  useKanbanBoard,
  useUpdateRequestStatus,
  useBoardStats,
  useDragAndDrop,
  useBoardFilters,
} from './useKanban';

// Calendar hooks
export {
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  useUpcomingEvents,
  useCurrentMonthEvents,
  useEquipmentEvents,
  useCalendarView,
  useEventForm,
} from './useCalendar';
