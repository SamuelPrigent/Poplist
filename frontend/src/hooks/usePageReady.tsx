'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface SectionState {
  id: string;
  ready: boolean;
}

interface PageReadyContextValue {
  registerSection: (id: string) => void;
  unregisterSection: (id: string) => void;
  markSectionReady: (id: string) => void;
  isPageReady: boolean;
  sections: Map<string, SectionState>;
}

const PageReadyContext = createContext<PageReadyContextValue | null>(null);

interface PageReadyProviderProps {
  children: ReactNode;
  /** Timeout in ms after which page is considered ready regardless of sections */
  timeout?: number;
  /** Minimum time to show loading state (prevents flash) */
  minLoadingTime?: number;
}

export function PageReadyProvider({
  children,
  timeout = 5000,
  minLoadingTime = 300,
}: PageReadyProviderProps) {
  const [sections, setSections] = useState<Map<string, SectionState>>(new Map());
  const [isPageReady, setIsPageReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Min loading time timer
  useEffect(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, minLoadingTime - elapsed);

    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, remaining);

    return () => clearTimeout(timer);
  }, [minLoadingTime]);

  // Safety timeout
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsPageReady(true);
    }, timeout);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeout]);

  // Check if all sections are ready
  useEffect(() => {
    if (sections.size === 0) return;

    const allReady = Array.from(sections.values()).every(s => s.ready);

    if (allReady && minTimeElapsed) {
      // Small delay to ensure render is complete
      requestAnimationFrame(() => {
        setIsPageReady(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      });
    }
  }, [sections, minTimeElapsed]);

  const registerSection = useCallback((id: string) => {
    setSections(prev => {
      const next = new Map(prev);
      if (!next.has(id)) {
        next.set(id, { id, ready: false });
      }
      return next;
    });
  }, []);

  const unregisterSection = useCallback((id: string) => {
    setSections(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const markSectionReady = useCallback((id: string) => {
    setSections(prev => {
      const next = new Map(prev);
      const section = next.get(id);
      if (section) {
        next.set(id, { ...section, ready: true });
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      registerSection,
      unregisterSection,
      markSectionReady,
      isPageReady,
      sections,
    }),
    [registerSection, unregisterSection, markSectionReady, isPageReady, sections]
  );

  return <PageReadyContext.Provider value={value}>{children}</PageReadyContext.Provider>;
}

/**
 * Hook to register a section and track its loading state
 * @param sectionId - Unique identifier for this section
 * @returns markReady function to call when section data is loaded
 */
export function useRegisterSection(sectionId: string) {
  const context = useContext(PageReadyContext);
  const hasMarkedReady = useRef(false);

  if (!context) {
    // If no provider, return a no-op (graceful degradation)
    return {
      markReady: () => {},
      isPageReady: true,
    };
  }

  const { registerSection, unregisterSection, markSectionReady, isPageReady } = context;

  // Register on mount, unregister on unmount
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    registerSection(sectionId);
    return () => unregisterSection(sectionId);
  }, [sectionId, registerSection, unregisterSection]);

  const markReady = useCallback(() => {
    if (!hasMarkedReady.current) {
      hasMarkedReady.current = true;
      markSectionReady(sectionId);
    }
  }, [sectionId, markSectionReady]);

  return { markReady, isPageReady };
}

/**
 * Hook to just check if page is ready (for components that don't contribute to loading)
 */
export function usePageReady() {
  const context = useContext(PageReadyContext);

  if (!context) {
    return { isPageReady: true, sections: new Map() };
  }

  return {
    isPageReady: context.isPageReady,
    sections: context.sections,
  };
}
