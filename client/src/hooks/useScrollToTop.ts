import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook that scrolls to the top of the page when the route changes
 * @param behavior - Scroll behavior ('auto' | 'smooth')
 */
export function useScrollToTop(behavior: ScrollBehavior = 'auto') {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior,
    });
  }, [location.pathname, behavior]);
}
