/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, logout as logoutRequest } from "../api/auth";
import { setApiAccessToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [manualUser, setManualUser] = useState(null);
  const [manualToken, setManualToken] = useState(null);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const setUser = useCallback((user, token = null) => {
    setManualUser(user);
    setManualToken(token);
    setApiAccessToken(token);
  }, []);

  const logout = useCallback(async () => {
    setManualUser(null);
    setManualToken(null);
    setApiAccessToken(null);
    queryClient.setQueryData(["auth", "me"], null);
    try {
      await logoutRequest();
    } finally {
      queryClient.removeQueries({ queryKey: ["my-bookings"] });
      queryClient.removeQueries({ queryKey: ["admin"] });
    }
  }, [queryClient]);

  useEffect(() => {
    if (data?.accessToken) {
      setApiAccessToken(data.accessToken);
    }
  }, [data?.accessToken]);

  useEffect(() => {
    const handleExpired = () => {
      setManualUser(null);
      setManualToken(null);
      setApiAccessToken(null);
      queryClient.clear();
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [queryClient]);

  useEffect(() => {
    const handleRefreshed = (e) => {
      const { user, accessToken } = e.detail;
      setManualUser(user);
      setManualToken(accessToken);
      setApiAccessToken(accessToken);
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
