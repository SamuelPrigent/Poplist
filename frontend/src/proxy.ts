import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Proxy Next.js (v16+) - S'exécute côté serveur AVANT le rendu
 * Remplace middleware.ts (déprécié depuis v16.0.0)
 *
 * Avantages:
 * - Peut lire les cookies HTTP-only
 * - Redirige sans flash côté client
 * - Idéal pour la protection des routes initiales
 */
export async function proxy(request: NextRequest) {
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
	const accessToken = request.cookies.get("accessToken");
	const refreshToken = request.cookies.get("refreshToken");

	// Considérer authentifié si au moins un token existe
	// (le refresh token suffit car l'API peut rafraîchir l'access token)
	const hasTokens = accessToken || refreshToken;

	// Cas spécial: /account/list/[id] - vérifier si la liste est publique
	// pour permettre l'accès même sans auth (DOIT être avant le redirect général)
	if (pathname.match(/^\/account\/list\/[^/]+$/) && !hasTokens) {
		// Extraire l'ID de la liste
		const listId = pathname.split("/").pop();

		try {
			// Vérifier si la liste est publique via l'API
			const response = await fetch(
				`${API_URL}/watchlists/public/${listId}`,
				{
					method: "GET",
					headers: { "Content-Type": "application/json" },
				},
			);

			if (response.ok) {
				// Liste publique, autoriser l'accès
				return NextResponse.next();
			}
		} catch {
			// En cas d'erreur, continuer vers le redirect
		}

		// Liste privée ou erreur → redirect vers home
		return NextResponse.redirect(new URL("/home", request.url));
	}

	// Route protégée sans token → redirect
	if (isProtectedRoute && !hasTokens) {
		// Si on était sur /account/lists → redirect vers /local/lists
		if (pathname.startsWith("/account/list")) {
			return NextResponse.redirect(new URL("/local/lists", request.url));
		}
		// Sinon → redirect vers /home
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
