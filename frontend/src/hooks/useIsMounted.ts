import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * SSR-safe mount detection.
 *
 * Returns `false` during server render and first client render (so the
 * hydrated HTML matches the server HTML), then `true` on subsequent
 * renders. Use this instead of the classic `useState + useEffect` mount
 * guard: no cascading re-render, and no `react-hooks/set-state-in-effect`
 * lint violation.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
