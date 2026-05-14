'use client';

import { useEffect } from 'react';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StorageVersionGate>
        <AuthProvider>
          <AuthRedirectHandler>{children}</AuthRedirectHandler>
          <Toaster />
        </AuthProvider>
      </StorageVersionGate>
      {/* {import.meta.env.DEV && (
				<ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
			)} */}
    </>
  );
}
