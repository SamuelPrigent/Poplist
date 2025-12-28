import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

interface SmartRedirectProps {
	authenticatedPath: string;
	unauthenticatedPath: string;
}

/**
 * SmartRedirect: Redirects based on authentication status
 * Used for routes like /lists that should go to different places
 * depending on whether the user is authenticated or not
 */
export function SmartRedirect({
	authenticatedPath,
	unauthenticatedPath,
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
 * SmartListRedirect: Redirects list detail pages based on auth status
 * Preserves the list ID in the URL
 */
export function SmartListRedirect() {
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

	const redirectPath = isAuthenticated
		? `/account/list/${id}`
		: `/local/list/${id}`;
	return <Navigate to={redirectPath} replace />;
}
