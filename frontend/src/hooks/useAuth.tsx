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
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [manualUser, setManualUser] = useState<User | null>(null);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const logout = useCallback(async () => {
    setManualUser(null);
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
      queryClient.clear();
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [queryClient]);

  const user = manualUser || (!isError ? data || null : null);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      setUser: setManualUser,
      logout,
    }),
    [isLoading, logout, user],
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
