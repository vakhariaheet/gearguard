/**
 * Development Mode Utilities
 *
 * Controls whether to use mock data or real API calls
 */

// Check if we're in development mode and should use mock data
export const USE_MOCK_DATA =
  import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
  (import.meta.env.DEV && !import.meta.env.VITE_API_URL);

// Development mode flags
export const DEV_FLAGS = {
  useMockKanban: USE_MOCK_DATA,
  useMockCalendar: USE_MOCK_DATA,
  logMockData: import.meta.env.DEV,
};

/**
 * Log mock data usage in development
 */
export const logMockUsage = (feature: string, enabled: boolean) => {
  if (DEV_FLAGS.logMockData && enabled) {
    console.log(`🎭 Using mock data for ${feature}`);
  }
};
