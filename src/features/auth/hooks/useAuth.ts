"use client";

/**
 * useAuth Hook
 * React Query hooks for auth operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getSession, login, logout } from "../api/authApi";
import { tokenStorage } from "@/lib/token-storage";
import { isTokenExpired } from "@/lib/jwt";
import type { LoginPayload } from "../types";

/**
 * Query key factory for auth
 */
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
};

/**
 * Hook to get current session
 */
export function useSession() {
  const queryClient = useQueryClient();

  // Strict Entry Check: Prevent Zombie Sessions
  useEffect(() => {
    const checkTokenValidity = () => {
      const refreshToken = tokenStorage.getRefreshToken();

      // If refresh token exists but is expired -> Force logout immediately
      if (!refreshToken) {
        // remove isTokenExpired(refreshToken) to test
        console.warn(
          "[Auth] Refresh token expired - forcing logout (zombie session prevention)",
        );

        // Clear tokens
        tokenStorage.clearTokens();

        // Clear React Query cache
        queryClient.setQueryData(authKeys.session(), {
          user: null,
          isAuthenticated: false,
        });

        // Hard redirect to login (clears all state)
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    };

    checkTokenValidity();
  }, [queryClient]);

  const query = useQuery({
    queryKey: authKeys.session(),
    queryFn: getSession,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent refetch if data is fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: false,
  });

  return {
    ...query,
    user: query.data?.user ?? null,
    isAuthenticated: query.data?.isAuthenticated ?? false,
  };
}

/**
 * Hook for login
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data) => {
      // Set query data directly instead of invalidating to prevent extra fetch
      if (data.success && data.user) {
        queryClient.setQueryData(authKeys.session(), {
          user: data.user,
          isAuthenticated: true,
        });
      }
    },
  });
}

/**
 * Hook for logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      // Set unauthenticated state directly
      queryClient.setQueryData(authKeys.session(), {
        user: null,
        isAuthenticated: false,
      });
      // Clear other queries but keep session
      queryClient.removeQueries({
        predicate: (query) => !query.queryKey.includes("session"),
      });
    },
  });
}
