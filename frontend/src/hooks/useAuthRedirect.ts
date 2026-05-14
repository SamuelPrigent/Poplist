import { useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';

// NOTE — Les `as never` sur les paths de `navigate({ to: ... })` sont temporaires.
// TanStack Router type strictement les paths via le routeTree généré ; tant que
// les routes de la migration ne sont pas toutes posées, on contourne le check.
// À retirer une fois `/home`, `/account/lists`, `/local/lists` migrées.

/**
 * Hook pour gérer les redirections lors des changements d'état auth.
 *
 * Cas d'usage: l'utilisateur est sur une page protégée et se déconnecte.
 * Le `beforeLoad` des routes ne peut pas intercepter ce cas car la page est déjà chargée.
 *
 * Ce hook surveille les changements d'état et redirige en conséquence.
 */
export function useAuthRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useLocation({ select: (l) => l.pathname });
  const wasAuthenticated = useRef<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;

    // Premier rendu: stocker l'état initial
    if (wasAuthenticated.current === null) {
      wasAuthenticated.current = isAuthenticated;
      return;
    }

    // Logout (était auth, ne l'est plus)
    if (wasAuthenticated.current && !isAuthenticated) {
      handleLogoutRedirect(pathname, navigate);
    }

    // Login (n'était pas auth, l'est maintenant)
    if (!wasAuthenticated.current && isAuthenticated) {
      handleLoginRedirect(pathname, navigate);
    }

    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, isLoading, pathname, navigate]);
}

type Navigate = ReturnType<typeof useNavigate>;

function handleLogoutRedirect(pathname: string, navigate: Navigate) {
  // Sur /account/lists → /local/lists
  if (pathname === '/account/lists') {
    navigate({ to: '/local/lists' as never });
    return;
  }

  // Sur /lists/[id] → /home
  if (pathname.startsWith('/lists/')) {
    navigate({ to: '/home' as never });
    return;
  }

  // Sur /account (settings) → /home
  if (pathname.startsWith('/account')) {
    navigate({ to: '/home' as never });
    return;
  }

  navigate({ to: '/home' as never });
}

function handleLoginRedirect(pathname: string, navigate: Navigate) {
  // Sur /local/lists → /account/lists
  if (pathname === '/local/lists') {
    navigate({ to: '/account/lists' as never });
    return;
  }

  // Sur /local/list/[id] → rester (les listes locales existent toujours)
}

/**
 * Hook pour protéger une page - redirige si non authentifié.
 * Préférer le `beforeLoad` de la route pour intercepter avant le render,
 * ce hook est un filet de sécurité côté composant.
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useLocation({ select: (l) => l.pathname });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (pathname.startsWith('/lists/')) {
        navigate({ to: '/local/lists' as never, replace: true });
      } else {
        navigate({ to: '/home' as never, replace: true });
      }
    }
  }, [isAuthenticated, isLoading, pathname, navigate]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook pour les pages réservées aux non-authentifiés.
 */
export function useRequireGuest() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: '/account/lists' as never, replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isAuthenticated, isLoading };
}
