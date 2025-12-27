import { useScrollToTop } from '../hooks/useScrollToTop';

interface ScrollToTopProps {
  behavior?: ScrollBehavior;
}

/**
 * Component that automatically scrolls to top on route changes
 * Place this component inside your Router but outside of Routes
 */
export function ScrollToTop({ behavior = 'auto' }: ScrollToTopProps) {
  useScrollToTop(behavior);
  return null;
}
