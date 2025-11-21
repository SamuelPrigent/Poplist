import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { watchlistAPI } from "@/lib/api-client";

interface RouteGuardProps {
	children: React.ReactNode;
}

/**
 * ProtectedRoute: Requires authentication
 * Redirects to /local/watchlists if not authenticated and coming from account watchlists
 * Otherwise redirects to home page
 */
export function ProtectedRoute({ children }: RouteGuardProps) {
	const { isAuthenticated, isLoading } = useAuth();
	const location = useLocation();

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
		// If user was on account watchlists, redirect to local watchlists
		if (location.pathname.startsWith("/account/watchlist")) {
			return <Navigate to="/local/watchlists" replace />;
		}
		// Otherwise redirect to home page
		return <Navigate to="/" replace />;
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
 * Allows access if:
 * - User is authenticated (backend will check ownership/collaboration)
 * - OR watchlist is public (accessible to everyone)
 * Redirects to home page if not authenticated AND watchlist is not public
 */
export function OnlineWatchlistRoute({ children }: RouteGuardProps) {
	const { id } = useParams<{ id: string }>();
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const [checkingPublic, setCheckingPublic] = useState(false);
	const [isPublic, setIsPublic] = useState<boolean | null>(null);

	useEffect(() => {
		// If user is authenticated, no need to check if watchlist is public
		if (isAuthenticated || authLoading) {
			return;
		}

		// If not authenticated, check if watchlist is public
		const checkWatchlistAccess = async () => {
			if (!id) return;

			try {
				setCheckingPublic(true);
				const { watchlist } = await watchlistAPI.getPublic(id);
				setIsPublic(watchlist.isPublic);
			} catch (error) {
				// If fetch fails, watchlist doesn't exist or is not public
				setIsPublic(false);
				return error;
			} finally {
				setCheckingPublic(false);
			}
		};

		checkWatchlistAccess();
	}, [id, isAuthenticated, authLoading]);

	if (authLoading || checkingPublic) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-center py-12">
					<div className="text-muted-foreground">Loading...</div>
				</div>
			</div>
		);
	}

	// If authenticated, always allow access (backend will handle authorization)
	if (isAuthenticated) {
		return <>{children}</>;
	}

	// If not authenticated, only allow if watchlist is public
	if (isPublic === true) {
		return <>{children}</>;
	}

	// Not authenticated and watchlist is not public (or doesn't exist)
	if (isPublic === false) {
		return <Navigate to="/" replace />;
	}

	// Still checking (shouldn't reach here due to loading check above)
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex items-center justify-center py-12">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		</div>
	);
}
