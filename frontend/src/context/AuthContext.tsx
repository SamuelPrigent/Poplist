import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { authAPI } from "@/lib/api-client";
import { AuthContext, type AuthContextValue, type User } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await authAPI.me();
      setUser((response as { user: User }).user);
    } catch (error) {
      // 401 is expected when user is not authenticated
      setUser(null);
      return error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
