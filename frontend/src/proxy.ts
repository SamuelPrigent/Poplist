import { type NextRequest, NextResponse } from "next/server";

/**
 * Proxy Next.js (v16+) - S'exécute côté serveur AVANT le rendu
 *
 * Avec les rewrites configurés dans next.config.ts, les cookies sont
 * maintenant sur le même domaine (same-site), donc le proxy peut les lire.
 */
export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Routes qui nécessitent une authentification
	const protectedRoutes = ["/account"];

	// Routes réservées aux utilisateurs non-authentifiés
	const publicOnlyRoutes = ["/local/lists"];

	const isProtectedRoute = protectedRoutes.some((route) =>
		pathname.startsWith(route),
	);
	const isPublicOnlyRoute = publicOnlyRoutes.some((route) =>
		pathname.startsWith(route),
	);

	// Si la route n'est ni protégée ni public-only, laisser passer
	if (!isProtectedRoute && !isPublicOnlyRoute) {
		return NextResponse.next();
	}

	// Vérifier l'authentification via le cookie
	// Maintenant les cookies sont same-site grâce aux rewrites
	const accessToken = request.cookies.get("accessToken");
	const refreshToken = request.cookies.get("refreshToken");

	// Considérer authentifié si au moins un token existe
	const hasTokens = accessToken || refreshToken;

	// Route protégée sans token → redirect
	if (isProtectedRoute && !hasTokens) {
		if (pathname.startsWith("/account/list")) {
			return NextResponse.redirect(new URL("/local/lists", request.url));
		}
		return NextResponse.redirect(new URL("/home", request.url));
	}

	// Route public-only avec token → redirect vers account
	if (isPublicOnlyRoute && hasTokens) {
		return NextResponse.redirect(new URL("/account/lists", request.url));
	}

	return NextResponse.next();
}

// Configurer les routes où le proxy s'exécute
export const config = {
	matcher: [
		// Routes protégées
		"/account/:path*",
		// Routes public-only
		"/local/:path*",
	],
};
