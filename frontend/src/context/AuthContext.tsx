import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { mergeLocalWatchlistsToDB } from "@/features/watchlists/localStorage";
import { client, setAuthErrorHandler } from "@/api";
import { type Language, useLanguageStore } from "@/store/language";
import { AuthContext, type AuthContextValue, type User } from "./auth-context";

async function jsonOrThrow<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const err = await res
			.json()
			.catch(() => ({ error: `Request failed: ${res.status}` }));
		throw new Error(
			(err as { error?: string }).error || `Request failed: ${res.status}`,
		);
	}
	return res.json() as Promise<T>;
}

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
			const res = await client.auth.me.$get();
			if (!res.ok) {
				throw new Error("Unauthenticated");
			}
			const { user: fetchedUser } = await res.json();
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
			await client.auth.logout.$post();
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
		const res = await client.auth.login.$post({ json: { email, password } });
		const { user: loggedInUser } = await jsonOrThrow<{ user: User }>(res);
		setUser(loggedInUser);
		setOptimisticAuth(true);
		setStoredAuthState(true, loggedInUser);
	};

	const signup = async (email: string, password: string) => {
		const res = await client.auth.signup.$post({ json: { email, password } });
		const { user: signedUpUser } = await jsonOrThrow<{ user: User }>(res);
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
		await client.auth.logout.$post();
		setUser(null);
		setOptimisticAuth(false);
		setStoredAuthState(false, null);
	};

	const refetch = async () => {
		await fetchUser();
	};

	const updateUsername = async (username: string) => {
		const res = await client.auth.profile.username.$put({ json: { username } });
		const { user: updatedUser } = await jsonOrThrow<{ user: User }>(res);
		setUser(updatedUser);
	};

	const changePassword = async (oldPassword: string, newPassword: string) => {
		const res = await client.auth.profile.password.$put({
			json: { oldPassword, newPassword },
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({ error: "Failed to change password" }));
			throw new Error((err as { error?: string }).error || "Failed to change password");
		}
	};

	const deleteAccount = async (confirmation: string) => {
		const res = await client.auth.profile.account.$delete({
			json: { confirmation: confirmation as "confirmer" },
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({ error: "Failed to delete account" }));
			throw new Error((err as { error?: string }).error || "Failed to delete account");
		}
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
