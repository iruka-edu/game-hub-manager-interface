"use client";

/**
 * useAuth Hook
 * React Query hooks for auth operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSession, login, logout } from "../api/authApi";
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
  const query = useQuery({
    queryKey: authKeys.session(),
    queryFn: getSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
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
      // Clear all queries on logout
      queryClient.clear();
    },
  });
}
