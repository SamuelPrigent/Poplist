import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

interface SmartRedirectProps {
  authenticatedPath: string;
  unauthenticatedPath: string;
}

/**
 * SmartRedirect: Redirects based on authentication status
 * Used for routes like /watchlists that should go to different places
 * depending on whether the user is authenticated or not
 */
export function SmartRedirect({
  authenticatedPath,
  unauthenticatedPath
}: SmartRedirectProps) {
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

  return (
    <Navigate
      to={isAuthenticated ? authenticatedPath : unauthenticatedPath}
      replace
    />
  );
}

/**
 * SmartWatchlistRedirect: Redirects watchlist detail pages based on auth status
 * Preserves the watchlist ID in the URL
 */
export function SmartWatchlistRedirect() {
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

  const redirectPath = isAuthenticated ? `/account/watchlist/${id}` : `/local/watchlist/${id}`;
  return (
    <Navigate
      to={redirectPath}
      replace
    />
  );
}
