"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";

/**
 * Hook pour gérer les redirections lors des changements d'état auth
 *
 * Cas d'usage: l'utilisateur est sur une page protégée et se déconnecte
 * Le middleware ne peut pas intercepter ce cas car la page est déjà chargée
 *
 * Ce hook surveille les changements d'état et redirige en conséquence
 */
export function useAuthRedirect() {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const wasAuthenticated = useRef<boolean | null>(null);

	useEffect(() => {
		// DEBUG - à retirer après
		console.log("[AuthRedirect]", { isLoading, isAuthenticated, was: wasAuthenticated.current, pathname });

		// Attendre que le chargement initial soit terminé
		if (isLoading) return;

		// Premier rendu: stocker l'état initial
		if (wasAuthenticated.current === null) {
			wasAuthenticated.current = isAuthenticated;
			return;
		}

		// Détecter un logout (était auth, ne l'est plus)
		if (wasAuthenticated.current && !isAuthenticated) {
			console.log("[AuthRedirect] LOGOUT detected -> redirecting");
			handleLogoutRedirect(pathname, router);
		}

		// Détecter un login (n'était pas auth, l'est maintenant)
		if (!wasAuthenticated.current && isAuthenticated) {
			console.log("[AuthRedirect] LOGIN detected");
			handleLoginRedirect(pathname, router);
		}

		// Mettre à jour l'état précédent
		wasAuthenticated.current = isAuthenticated;
	}, [isAuthenticated, isLoading, pathname, router]);
}

function handleLogoutRedirect(
	pathname: string,
	router: ReturnType<typeof useRouter>,
) {
	// Sur /account/lists → aller vers /local/lists
	if (pathname === "/account/lists") {
		router.push("/local/lists");
		return;
	}

	// Sur /account/list/[id] → aller vers /home
	// (idéalement on vérifierait si la liste est publique, mais pour simplifier)
	if (pathname.startsWith("/account/list/")) {
		router.push("/home");
		return;
	}

	// Sur /account (settings) → aller vers /home
	if (pathname.startsWith("/account")) {
		router.push("/home");
		return;
	}

	// Autres pages protégées → home
	router.push("/home");
}

function handleLoginRedirect(
	pathname: string,
	router: ReturnType<typeof useRouter>,
) {
	// Sur /local/lists → aller vers /account/lists
	if (pathname === "/local/lists") {
		router.push("/account/lists");
		return;
	}

	// Sur /local/list/[id] → rester (les listes locales existent toujours)
	// L'utilisateur peut choisir de les migrer
}

/**
 * Hook pour protéger une page - affiche loading pendant la vérification
 * et redirige si non autorisé
 */
export function useRequireAuth() {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			// Redirection selon la page actuelle
			if (pathname.startsWith("/account/list")) {
				router.replace("/local/lists");
			} else {
				router.replace("/home");
			}
		}
	}, [isAuthenticated, isLoading, pathname, router]);

	return { isAuthenticated, isLoading };
}

/**
 * Hook pour les pages réservées aux non-authentifiés
 */
export function useRequireGuest() {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			router.replace("/account/lists");
		}
	}, [isAuthenticated, isLoading, router]);

	return { isAuthenticated, isLoading };
}
