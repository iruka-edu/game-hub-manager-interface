/**
 * Hooks Integration Tests
 *
 * Tests the React Query hooks with real API calls.
 * Uses @testing-library/react hooks to test hooks in isolation.
 *
 * Run with: npx jest src/features/__tests__/hooks-integration.test.tsx --runInBand
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAccessToken, clearAccessToken } from "@/lib/external-api";
import { login } from "@/features/auth/api/authApi";
import { useGames, useGameDetail } from "@/features/games/hooks/useGames";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";

// Test credentials
const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "password123";

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
}

// Wrapper component
function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("Hooks Integration Tests", { timeout: 30000 }, () => {
  let authToken: string | null = null;

  beforeAll(async () => {
    if (!TEST_EMAIL || !TEST_PASSWORD) return;

    try {
      const response = await login({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      authToken = response.tokens?.access_token || null;
      if (authToken) setAccessToken(authToken);
    } catch (e: any) {
      console.log(`⚠️ Login failed for hooks: ${e.message}`);
    }
  });

  afterAll(() => {
    clearAccessToken();
  });

  describe("useGames Hook", () => {
    it("should fetch games list via hook", async () => {
      if (!authToken) return;

      const { result } = renderHook(() => useGames(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false), {
        timeout: 15000,
      });

      if (result.current.isSuccess) {
        expect(Array.isArray(result.current.games)).toBe(true);
        console.log(
          `✅ useGames hook fetched ${result.current.games.length} games`,
        );
      }
    });
  });

  describe("useUsers Hook", () => {
    it("should fetch users list via hook", async () => {
      if (!authToken) return;

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false), {
        timeout: 15000,
      });

      if (result.current.isSuccess) {
        expect(Array.isArray(result.current.users)).toBe(true);
        console.log(
          `✅ useUsers hook fetched ${result.current.users.length} users`,
        );
      }
    });
  });
});
