'use client';

import { domAnimation, LazyMotion, m, AnimatePresence } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { usePageReady, PageReadyProvider } from '@/hooks/usePageReady';

interface PageRevealProps {
  children: ReactNode;
  /** Timeout in ms after which page is considered ready regardless of sections */
  timeout?: number;
  /** Minimum time to show loading state (prevents flash) */
  minLoadingTime?: number;
  /** Duration of the reveal animation in seconds */
  revealDuration?: number;
}

/**
 * Wrapper component that provides coordinated page loading.
 * Wrap your page content with this, and use useRegisterSection in each data-fetching section.
 */
export function PageReveal({
  children,
  timeout = 5000,
  minLoadingTime = 300,
  revealDuration = 0.6,
}: PageRevealProps) {
  return (
    <PageReadyProvider timeout={timeout} minLoadingTime={minLoadingTime}>
      <PageRevealContent revealDuration={revealDuration}>{children}</PageRevealContent>
    </PageReadyProvider>
  );
}

function PageRevealContent({
  children,
  revealDuration,
}: {
  children: ReactNode;
  revealDuration: number;
}) {
  const { isPageReady } = usePageReady();
  // Only show glow after a delay to avoid flash on fast loads
  const [showGlow, setShowGlow] = useState(false);

  useEffect(() => {
    // Don't show glow if page is already ready
    if (isPageReady) {
      return;
    }

    // Show glow after delay if page is still loading
    const timer = setTimeout(() => {
      setShowGlow(true);
    }, 400);

    return () => {
      clearTimeout(timer);
      // Reset glow when effect cleans up (including when isPageReady changes to true)
      setShowGlow(false);
    };
  }, [isPageReady]);

  // Block scroll during loading
  useEffect(() => {
    if (!isPageReady) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isPageReady]);

  return (
    <LazyMotion features={domAnimation}>
      {/* Loading overlay with subtle animated background */}
      <AnimatePresence>
        {!isPageReady && (
          <m.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-background"
          >
            {/* Subtle breathing glow effect - only shows after delay */}
            <AnimatePresence>
              {showGlow && (
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 overflow-hidden"
                >
                  {/* Central glow */}
                  <m.div
                    animate={{
                      opacity: [0.02, 0.06, 0.02],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-r from-violet-500/20 via-blue-500/15 to-violet-500/20 blur-[120px]"
                  />
                </m.div>
              )}
            </AnimatePresence>

            {/* Spinner loader - shows immediately */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="absolute left-1/2 top-[250px] z-10 -translate-x-1/2"
            >
              <m.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="h-8 w-8 rounded-full border-[3px] border-white/20 border-t-white/80"
              />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Main content with reveal animation */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: isPageReady ? 1 : 0,
        }}
        transition={{
          duration: revealDuration,
          ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
        }}
        style={{
          // Gradient mask reveal effect
          maskImage: isPageReady
            ? 'linear-gradient(to bottom, black 0%, black 100%)'
            : 'linear-gradient(to bottom, transparent 0%, transparent 100%)',
          WebkitMaskImage: isPageReady
            ? 'linear-gradient(to bottom, black 0%, black 100%)'
            : 'linear-gradient(to bottom, transparent 0%, transparent 100%)',
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

/**
 * Alternative: Simple fade reveal without the gradient mask effect
 */
export function PageRevealSimple({
  children,
  timeout = 5000,
  minLoadingTime = 300,
}: Omit<PageRevealProps, 'revealDuration'>) {
  return (
    <PageReadyProvider timeout={timeout} minLoadingTime={minLoadingTime}>
      <PageRevealSimpleContent>{children}</PageRevealSimpleContent>
    </PageReadyProvider>
  );
}

function PageRevealSimpleContent({ children }: { children: ReactNode }) {
  const { isPageReady } = usePageReady();

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {!isPageReady && (
          <m.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-40 bg-background"
          >
            <div className="absolute inset-0 overflow-hidden">
              <m.div
                animate={{
                  opacity: [0.03, 0.08, 0.03],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-r from-violet-500/30 via-blue-500/20 to-violet-500/30 blur-[100px]"
              />
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isPageReady ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
