'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BUILD_VERSION } from '@/api/client';
import { Toaster } from '@/components/ui/sonner';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { AuthProvider } from '@/context/AuthContext';
import { cleanLocalStorageIfVersionMismatch } from '@/lib/localStorageVersion';
import { useLanguageStore } from '@/store/language';
import { useListFiltersStore } from '@/store/listFilters';
import { useListPaginationStore } from '@/store/listPagination';

// Note : le `QueryClientProvider` est posé au niveau du router via l'option
// `Wrap` (cf. src/router.tsx) pour garantir une instance unique de QueryClient
// partagée entre les loaders et le React tree.

function AuthRedirectHandler({ children }: { children: React.ReactNode }) {
  // Surveille les changements d'état auth et redirige si nécessaire
  useAuthRedirect();
  return <>{children}</>;
}

function StorageVersionGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Si version localStorage absente ou différente → wipe complet + reload.
    // Le reload est nécessaire car Zustand a déjà hydraté ses stores en
    // mémoire à partir des anciennes données. Une fois la version posée,
    // ce useEffect est no-op au prochain boot.
    const wiped = cleanLocalStorageIfVersionMismatch();
    if (wiped) {
      window.location.reload();
      return;
    }
    // Rehydrate les stores Zustand après le mount pour éviter les
    // hydration mismatches React (les stores sont init avec leurs
    // defaults au SSR/first paint, on charge localStorage en post-mount).
    void useLanguageStore.persist.rehydrate();
    void useListFiltersStore.persist.rehydrate();
    void useListPaginationStore.persist.rehydrate();
  }, []);
  return <>{children}</>;
}

const BUILD_VERSION_KEY = 'app_build_version';

/**
 * Détecte un deploy en comparant le BUILD_VERSION du bundle courant à celui
 * stocké en localStorage. Si différent → vide le cache TanStack Query pour
 * éviter de servir des data hydratées au précédent build.
 *
 * Le cache HTTP navigateur est déjà invalidé en parallèle via `_v` dans
 * chaque URL `apiFetch`. Ce gate complète en gérant les caches in-memory
 * (TanStack Query) qui survivent à un soft reload (F5).
 */
function BuildVersionGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(BUILD_VERSION_KEY);
      if (stored && stored !== BUILD_VERSION) {
        queryClient.clear();
        console.log(
          `[BuildVersion] Cleared queryClient cache (was ${stored}, now ${BUILD_VERSION})`
        );
      }
      localStorage.setItem(BUILD_VERSION_KEY, BUILD_VERSION);
    } catch {
      // localStorage inaccessible (private browsing, quota plein) — ignore
    }
  }, [queryClient]);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StorageVersionGate>
        <BuildVersionGate>
          <AuthProvider>
            <AuthRedirectHandler>{children}</AuthRedirectHandler>
            <Toaster />
          </AuthProvider>
        </BuildVersionGate>
      </StorageVersionGate>
      {/* {import.meta.env.DEV && (
				<ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
			)} */}
    </>
  );
}
