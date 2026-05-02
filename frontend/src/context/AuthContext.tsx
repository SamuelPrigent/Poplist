import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { mergeLocalWatchlistsToDB } from "@/features/watchlists/localStorage";
import { auth, setAuthErrorHandler } from "@/api";
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

// Lazy initializer - lit localStorage immédiatement côté client
function getInitialAuthState() {
	if (typeof window === "undefined") {
		// SSR: pas de localStorage
		return { user: null, optimisticAuth: false, isLoading: true };
	}
	// Client: lire localStorage immédiatement
	const { wasAuthenticated, cachedUser } = getStoredAuthState();
	return {
		user: cachedUser,
		optimisticAuth: wasAuthenticated,
		isLoading: false,
	};
}

export function AuthProvider({ children }: { children: ReactNode }) {
	// Lire localStorage dès le premier render côté client
	const initial = getInitialAuthState();
	const [user, setUser] = useState<User | null>(initial.user);
	const [isLoading, setIsLoading] = useState(initial.isLoading);
	const [optimisticAuth, setOptimisticAuth] = useState(initial.optimisticAuth);
	const { setLanguage } = useLanguageStore();

	const fetchUser = useCallback(async () => {
		try {
			const { user: fetchedUser } = await auth.me();
			setUser(fetchedUser);
			setOptimisticAuth(true);
			setStoredAuthState(true, fetchedUser);

			// Set language from user profile if available
			if (fetchedUser.language) {
				setLanguage(fetchedUser.language as Language);
			}
		} catch {
			// 401 is expected when user is not authenticated - silent fail
			setUser(null);
			setOptimisticAuth(false);
			setStoredAuthState(false, null);
		}
	}, [setLanguage]);

	const handleAutoLogout = useCallback(async () => {
		console.log("🚪 Auto-logout: Refresh token expired, cleaning up...");
		// Call the real logout to clean cookies on backend
		try {
			await auth.logout();
		} catch {
			// Ignore errors - just clean up local state
			console.log(
				"Logout API call failed (expected if tokens expired), clearing local state",
			);
		}
		setUser(null);
		setOptimisticAuth(false);
		setStoredAuthState(false, null);
	}, []);

	useEffect(() => {
		fetchUser();

		// Register the auth error handler for automatic logout when refresh fails
		setAuthErrorHandler(handleAutoLogout);
	}, [fetchUser, handleAutoLogout]);

	const login = async (email: string, password: string) => {
		const { user: loggedInUser } = await auth.login(email, password);
		setUser(loggedInUser);
		setOptimisticAuth(true);
		setStoredAuthState(true, loggedInUser);
	};

	const signup = async (email: string, password: string) => {
		const { user: signedUpUser } = await auth.signup(email, password);
		setUser(signedUpUser);
		setOptimisticAuth(true);
		setStoredAuthState(true, signedUpUser);

		// Merge local watchlists to database after successful signup
		try {
			await mergeLocalWatchlistsToDB();
		} catch (error) {
			console.error("Failed to merge local watchlists after signup:", error);
			// Don't throw - signup was successful, just log the error
		}
	};

	const logout = async () => {
		await auth.logout();
		setUser(null);
		setOptimisticAuth(false);
		setStoredAuthState(false, null);
	};

	const refetch = async () => {
		await fetchUser();
	};

	const updateUsername = async (username: string) => {
		const { user: updatedUser } = await auth.updateUsername(username);
		setUser(updatedUser);
	};

	const changePassword = async (oldPassword: string, newPassword: string) => {
		await auth.changePassword(oldPassword, newPassword);
	};

	const deleteAccount = async (confirmation: string) => {
		await auth.deleteAccount(confirmation as "confirmer");
		setUser(null);
	};

	// isAuthenticated utilise l'état optimiste pendant le chargement pour éviter le flicker
	// Une fois le chargement terminé, on utilise l'état réel
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
