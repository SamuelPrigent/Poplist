import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { authAPI, setAuthErrorHandler } from "@/lib/api-client";
import { AuthContext, type AuthContextValue, type User } from "./auth-context";
import { useLanguageStore, type Language } from "@/store/language";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setLanguage } = useLanguageStore();

  const fetchUser = useCallback(async () => {
    try {
      const response = await authAPI.me();
      const fetchedUser = (response as { user: User }).user;
      setUser(fetchedUser);

      // Set language from user profile if available
      if (fetchedUser.language) {
        setLanguage(fetchedUser.language as Language);
      }
    } catch {
      // 401 is expected when user is not authenticated - silent fail
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [setLanguage]);

  const handleAutoLogout = useCallback(async () => {
    console.log("🚪 Auto-logout: Refresh token expired, cleaning up...");
    // Call the real logout to clean cookies on backend
    try {
      await authAPI.logout();
    } catch {
      // Ignore errors - just clean up local state
      console.log(
        "Logout API call failed (expected if tokens expired), clearing local state",
      );
    }
    setUser(null);
  }, []);

  useEffect(() => {
    fetchUser();

    // Register the auth error handler for automatic logout when refresh fails
    setAuthErrorHandler(handleAutoLogout);
  }, [fetchUser, handleAutoLogout]);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    setUser((response as { user: User }).user);
  };

  const signup = async (email: string, password: string) => {
    const response = await authAPI.signup(email, password);
    setUser((response as { user: User }).user);
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const refetch = async () => {
    await fetchUser();
  };

  const updateUsername = async (username: string) => {
    const response = await authAPI.updateUsername(username);
    setUser((response as { user: User }).user);
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    await authAPI.changePassword(oldPassword, newPassword);
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refetch,
    updateUsername,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
