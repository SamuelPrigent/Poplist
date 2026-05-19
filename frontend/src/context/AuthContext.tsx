import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { mergeLocalWatchlistsToDB } from "@/features/watchlists/localStorage";
import { auth, setAuthErrorHandler } from "@/api";
import { authQueries } from "@/api/queries";
import { type Language, useLanguageStore } from "@/store/language";
import { AuthContext, type AuthContextValue, type User } from "./auth-context";

// Clé localStorage pour l'état d'auth optimiste
const AUTH_STORAGE_KEY = "poplist_auth";

// Lire l'état d'auth depuis localStorage (côté client uniquement)
function getStoredAuthState(): { wasAuthenticated: boolean; cachedUser: User | null } {
	if (typeof window === "undefined") {
		return { wasAuthenticated: false, cachedUser: null };
	}
	try {
		const stored = localStorage.getItem(AUTH_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return {
				wasAuthenticated: parsed.isAuthenticated ?? false,
				cachedUser: parsed.user ?? null,
			};
		}
	} catch {
		// Ignore parsing errors
	}
	return { wasAuthenticated: false, cachedUser: null };
}

// Sauvegarder l'état d'auth dans localStorage
function setStoredAuthState(isAuthenticated: boolean, user: User | null) {
	if (typeof window === "undefined") return;
	try {
		if (isAuthenticated && user) {
			localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated: true, user }));
		} else {
			localStorage.removeItem(AUTH_STORAGE_KEY);
		}
	} catch {
		// Ignore storage errors
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient();
	const meKey = authQueries.me().queryKey;
	const { setLanguage } = useLanguageStore();

	// État optimiste pour le rendu auth-conditionnel pendant la query pending.
	// CRITIQUE : initialiser à `false` partout (SSR et client first paint).
	// Lire `localStorage` dans l'initializer ferait diverger SSR (false) du
	// client (true si déjà loggé) → hydration mismatch React #418 sur tout
	// le rendu auth-conditionnel (boutons owner, save, menu). Le sync depuis
	// localStorage se fait en effect post-mount, après l'hydratation.
	const [optimisticAuth, setOptimisticAuth] = useState(false);

	// Gate de la query `/auth/me`. Sans gate, un visiteur non auth déclenche
	// un 401 console (Lighthouse Best Practices). Init à `false` côté SSR pour
	// éviter une divergence d'hydratation, sync depuis localStorage post-mount.
	const [hasLocalSession, setHasLocalSession] = useState(false);
	useEffect(() => {
		if (getStoredAuthState().wasAuthenticated) {
			setOptimisticAuth(true);
			setHasLocalSession(true);
		}
	}, []);

	// Query auth/me : remplace le useState + useEffect manuel. Refetch
	// silencieux selon staleTime (1 min). `retry: false` car 401 attendu si
	// non connecté. `placeholderData` plutôt qu'initialData : on n'affecte
	// pas le statut de la query (qui reste `pending` jusqu'au vrai fetch)
	// tout en exposant la dernière donnée connue.
	const query = useQuery({
		...authQueries.me(),
		enabled: hasLocalSession,
	});

	const user = query.data?.user ?? null;
	const isLoading = query.isPending;

	// Sync localStorage et la langue user dès qu'on a la data
	useEffect(() => {
		if (query.isSuccess && query.data?.user) {
			setStoredAuthState(true, query.data.user);
			setOptimisticAuth(true);
			if (query.data.user.language) {
				setLanguage(query.data.user.language as Language);
			}
		} else if (query.isError) {
			// 401 attendu si non auth — on clear le storage optimiste
			setStoredAuthState(false, null);
			setOptimisticAuth(false);
		}
	}, [query.isSuccess, query.isError, query.data, setLanguage]);

	const handleAutoLogout = useCallback(async () => {
		console.log("🚪 Auto-logout: Refresh token expired, cleaning up...");
		try {
			await auth.logout();
		} catch {
			console.log(
				"Logout API call failed (expected if tokens expired), clearing local state",
			);
		}
		// CRITIQUE : on REMOVE les queries au lieu de les invalider. Une
		// `invalidateQueries({ queryKey: ['auth', 'me'] })` déclencherait un
		// refetch immédiat → /auth/me 401 → handleAutoLogout → boucle infinie.
		// `removeQueries` vire la query du cache sans refetch.
		queryClient.removeQueries({ queryKey: ['auth', 'me'] });
		queryClient.removeQueries({
			predicate: (query) => {
				const key = query.queryKey;
				// Watchlists auth-only : 'mine' et variantes 'auth' par id.
				// Les queries publiques ('public', 'featured', 'genre', etc.) restent
				// en cache car elles n'ont pas de contexte user et sont valides quelle
				// que soit la session.
				if (key[0] === 'watchlists' && (key[1] === 'mine' || key[2] === 'auth')) return true;
				// Users auth-only : 'profile' (byUsername reste public).
				if (key[0] === 'users' && key[1] === 'profile') return true;
				return false;
			},
		});
		setStoredAuthState(false, null);
		setOptimisticAuth(false);
		setHasLocalSession(false);
	}, [queryClient]);

	useEffect(() => {
		setAuthErrorHandler(handleAutoLogout);
	}, [handleAutoLogout]);

	const login = async (email: string, password: string) => {
		const { user: loggedInUser } = await auth.login(email, password);
		queryClient.setQueryData(meKey, { user: loggedInUser });
		setStoredAuthState(true, loggedInUser);
		setOptimisticAuth(true);
		setHasLocalSession(true);
		// Invalide les queries user-scopées (mes watchlists, etc.) — elles
		// seront refetch quand un composant les lira.
		queryClient.invalidateQueries({ queryKey: ['watchlists'] });
	};

	const signup = async (email: string, password: string) => {
		const { user: signedUpUser } = await auth.signup(email, password);
		queryClient.setQueryData(meKey, { user: signedUpUser });
		setStoredAuthState(true, signedUpUser);
		setOptimisticAuth(true);
		setHasLocalSession(true);

		try {
			await mergeLocalWatchlistsToDB();
		} catch (error) {
			console.error("Failed to merge local watchlists after signup:", error);
		}
		queryClient.invalidateQueries({ queryKey: ['watchlists'] });
	};

	const logout = async () => {
		await auth.logout();
		// `removeQueries` au lieu de `invalidateQueries` pour éviter une boucle
		// avec auth.me qui refetch puis échoue avec 401.
		queryClient.removeQueries({ queryKey: ['auth', 'me'] });
		queryClient.removeQueries({
			predicate: (query) => {
				const key = query.queryKey;
				// Watchlists auth-only : 'mine' et variantes 'auth' par id.
				// Les queries publiques ('public', 'featured', 'genre', etc.) restent
				// en cache car elles n'ont pas de contexte user et sont valides quelle
				// que soit la session.
				if (key[0] === 'watchlists' && (key[1] === 'mine' || key[2] === 'auth')) return true;
				// Users auth-only : 'profile' (byUsername reste public).
				if (key[0] === 'users' && key[1] === 'profile') return true;
				return false;
			},
		});
		setStoredAuthState(false, null);
		setOptimisticAuth(false);
		setHasLocalSession(false);
	};

	const refetch = async () => {
		await query.refetch();
	};

	const updateUsername = async (username: string) => {
		const { user: updatedUser } = await auth.updateUsername(username);
		queryClient.setQueryData(meKey, { user: updatedUser });
		setStoredAuthState(true, updatedUser);
		// Le profil public (/user/<username>) peut avoir changé d'URL → invalider
		queryClient.invalidateQueries({ queryKey: ['users'] });
	};

	const changePassword = async (oldPassword: string, newPassword: string) => {
		await auth.changePassword(oldPassword, newPassword);
	};

	const deleteAccount = async (confirmation: string) => {
		await auth.deleteAccount(confirmation as "confirmer");
		queryClient.removeQueries({ queryKey: ['auth', 'me'] });
		queryClient.removeQueries({
			predicate: (query) => {
				const key = query.queryKey;
				// Watchlists auth-only : 'mine' et variantes 'auth' par id.
				// Les queries publiques ('public', 'featured', 'genre', etc.) restent
				// en cache car elles n'ont pas de contexte user et sont valides quelle
				// que soit la session.
				if (key[0] === 'watchlists' && (key[1] === 'mine' || key[2] === 'auth')) return true;
				// Users auth-only : 'profile' (byUsername reste public).
				if (key[0] === 'users' && key[1] === 'profile') return true;
				return false;
			},
		});
		setStoredAuthState(false, null);
		setOptimisticAuth(false);
		setHasLocalSession(false);
	};

	// isAuthenticated utilise l'état optimiste pendant le chargement pour éviter
	// le flicker auth. Une fois la query résolue, on utilise l'état réel.
	const isAuthenticated = isLoading ? (optimisticAuth ?? false) : !!user;

	const value: AuthContextValue = {
		user,
		isLoading,
		isAuthenticated,
		login,
		signup,
		logout,
		refetch,
		updateUsername,
		changePassword,
		deleteAccount,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
