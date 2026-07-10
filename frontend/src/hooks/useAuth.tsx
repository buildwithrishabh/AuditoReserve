/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, logout as logoutRequest } from "../api/auth";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  setUser: (user: User | null, token?: string | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [manualUser, setManualUser] = useState<User | null>(null);
  const [manualToken, setManualToken] = useState<string | null>(null);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const setUser = useCallback((user: User | null, token: string | null = null) => {
    setManualUser(user);
    setManualToken(token);
  }, []);

  const logout = useCallback(async () => {
    setManualUser(null);
    setManualToken(null);
    queryClient.setQueryData(["auth", "me"], null);
    try {
      await logoutRequest();
    } finally {
      queryClient.removeQueries({ queryKey: ["my-bookings"] });
      queryClient.removeQueries({ queryKey: ["admin"] });
    }
  }, [queryClient]);

  useEffect(() => {
    const handleExpired = () => {
      setManualUser(null);
      setManualToken(null);
      queryClient.clear();
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [queryClient]);

  useEffect(() => {
    const handleRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent<{ user: User; accessToken: string }>;
      const { user, accessToken } = customEvent.detail;
      setManualUser(user);
      setManualToken(accessToken);
      queryClient.setQueryData(["auth", "me"], { user, accessToken });
    };

    window.addEventListener("auth:refreshed", handleRefreshed);
    return () => window.removeEventListener("auth:refreshed", handleRefreshed);
  }, [queryClient]);

  const user = manualUser || (!isError ? data?.user || null : null);
  const token = manualToken || (!isError ? data?.accessToken || null : null);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      token,
      setUser,
      logout,
    }),
    [isLoading, logout, user, token, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
