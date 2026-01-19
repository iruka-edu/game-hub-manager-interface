/**
 * Auth Provider
 * Client component that hydrates auth state from cookies on app initialization
 * Wraps the app to provide authentication context
 */

"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tokenStorage } from "@/lib/token-storage";
import { authKeys } from "@/features/auth/hooks/useAuth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  useEffect(() => {
    // Only run once on initial mount
    if (initialized.current) return;
    initialized.current = true;

    // Check if token exists in cookies
    const token = tokenStorage.getToken();

    if (!token) {
      // No token - set unauthenticated state immediately (no API call needed)
      queryClient.setQueryData(authKeys.session(), {
        user: null,
        isAuthenticated: false,
      });
    }
    // If token exists, let useSession hook fetch user data naturally
    // Don't invalidate here to avoid duplicate requests
  }, [queryClient]);

  return <>{children}</>;
}

export default AuthProvider;
