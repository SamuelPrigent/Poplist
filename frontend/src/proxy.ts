import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy Next.js 16+ - Vérifications d'authentification
 *
 * Règles d'accès :
 * - /account/list/[id] : accessible à tous (la page vérifie si public ou owner)
 * - /account/lists : auth requis, sinon → /local/lists
 * - /account : auth requis, sinon → /home
 * - /local/lists : non-auth requis, sinon → /account/lists
 */
export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Vérifier l'authentification via les cookies
	const accessToken = request.cookies.get("accessToken")?.value;
	const refreshToken = request.cookies.get("refreshToken")?.value;
	const isAuthenticated = Boolean(accessToken || refreshToken);

	// /account/list/[id] - Laisser passer, la page gère la logique public/privé
	if (pathname.match(/^\/account\/list\/[^/]+$/)) {
		return NextResponse.next();
	}

	// /account/lists - Auth requis
	if (pathname === "/account/lists") {
		if (!isAuthenticated) {
			return NextResponse.redirect(new URL("/local/lists", request.url));
		}
		return NextResponse.next();
	}

	// /account/* (settings, etc.) - Auth requis
	if (pathname.startsWith("/account")) {
		if (!isAuthenticated) {
			return NextResponse.redirect(new URL("/home", request.url));
		}
		return NextResponse.next();
	}

	// /local/lists - Non-auth requis (utilisateurs connectés → /account/lists)
	if (pathname === "/local/lists") {
		if (isAuthenticated) {
			return NextResponse.redirect(new URL("/account/lists", request.url));
		}
		return NextResponse.next();
	}

	// /local/list/[id] - Laisser passer (listes offline)
	if (pathname.startsWith("/local/list/")) {
		return NextResponse.next();
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/account/:path*", "/local/:path*"],
};
