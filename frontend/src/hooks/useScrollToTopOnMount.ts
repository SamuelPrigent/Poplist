import { useEffect } from 'react';

/**
 * Force scroll-to-top on mount and override the browser's scroll restoration
 * for the current navigation.
 *
 * Why this is needed: pages like `/lists/[id]` are reachable from many entry
 * points, so the back button must use `router.back()` (browser history) to
 * return the user to the correct origin. But `router.back()` triggers the
 * browser's scroll restoration, which restores the scroll position on the
 * destination. For destination pages where we want "top of the page" UX on
 * every entry (forward push AND back nav), this hook overrides that.
 *
 * It disables `history.scrollRestoration` (=> manual) while the component
 * is mounted, explicitly scrolls to 0, and restores `'auto'` on unmount so
 * pages that prefer the default behavior are unaffected.
 */
export function useScrollToTopOnMount(): void {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);
}
