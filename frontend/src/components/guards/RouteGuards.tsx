import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute: Requires authentication
 * Redirects to /local/watchlists if not authenticated
 */
export function ProtectedRoute({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/local/watchlists" replace />;
  }

  return <>{children}</>;
}

/**
 * PublicOnlyRoute: For local/unauthenticated users
 * Redirects to /account/watchlists if authenticated
 */
export function PublicOnlyRoute({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // User became authenticated, redirect will happen below
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/account/watchlists" replace />;
  }

  return <>{children}</>;
}

/**
 * OfflineWatchlistRoute: For local watchlist detail pages
 * Redirects to /account/watchlist/:id (same ID) if authenticated
 */
export function OfflineWatchlistRoute({ children }: RouteGuardProps) {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={`/account/watchlist/${id}`} replace />;
  }

  return <>{children}</>;
}

/**
 * OnlineWatchlistRoute: For account/authenticated watchlist detail pages
 * Redirects to /local/watchlist/:id (same ID) if not authenticated
 */
export function OnlineWatchlistRoute({ children }: RouteGuardProps) {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/local/watchlist/${id}`} replace />;
  }

  return <>{children}</>;
}
