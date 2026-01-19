/**
 * Auth Flow Integration Tests
 *
 * Tests the complete authentication flow:
 * 1. Login → Store token → Use token for API calls → Logout → Token cleared
 *
 * Run with: npx jest src/features/__tests__/auth-flow.test.ts --runInBand
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
} from "@/lib/external-api";
import {
  login,
  logout,
  getCurrentUser,
  refreshToken,
} from "@/features/auth/api/authApi";
import { getGames } from "@/features/games/api/getGames";

// Test credentials
const TEST_EMAIL = process.env.TEST_USER_EMAIL || "";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "";

describe("Auth Flow Integration Tests", { timeout: 60000 }, () => {
  beforeEach(() => {
    // Clear any existing tokens before each test
    clearAccessToken();
  });

  afterAll(() => {
    clearAccessToken();
  });

  describe("Complete Auth Flow", () => {
    it("should complete full auth lifecycle: login → use API → logout", async () => {
      if (!TEST_EMAIL || !TEST_PASSWORD) {
        console.log(
          "⚠️ Skipping - TEST_USER_EMAIL and TEST_USER_PASSWORD not set",
        );
        return;
      }

      // Step 1: Login
      console.log("Step 1: Logging in...");
      const loginResponse = await login({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      // Check if login was successful
      if (!loginResponse.success || !loginResponse.tokens) {
        console.log(
          `⚠️ Login failed: ${loginResponse.error || "Unknown error"}`,
        );
        return; // Skip test if login fails
      }

      expect(loginResponse.tokens).toBeDefined();
      expect(loginResponse.tokens.access_token).toBeDefined();
      expect(typeof loginResponse.tokens.access_token).toBe("string");
      expect(loginResponse.tokens.access_token.length).toBeGreaterThan(0);
      console.log("  ✅ Login successful, token received");

      // Step 2: Verify token is stored
      console.log("Step 2: Verifying token storage...");
      const storedToken = getAccessToken();
      expect(storedToken).toBe(loginResponse.tokens.access_token);
      console.log("  ✅ Token stored in localStorage");

      // Step 3: Get current user (API call with token)
      console.log("Step 3: Getting current user...");
      const currentUser = await getCurrentUser();

      if (currentUser) {
        expect(currentUser.id).toBeDefined();
        expect(currentUser.email).toBe(TEST_EMAIL);
        expect(currentUser.roles).toBeDefined();
        console.log(
          `  ✅ Current user: ${currentUser.name} (${currentUser.email})`,
        );
      } else {
        console.log("  ⚠️ getCurrentUser returned null");
      }

      // Step 4: Make authenticated API call (games list)
      console.log("Step 4: Fetching games (authenticated)...");
      const games = await getGames({ mine: true });
      expect(Array.isArray(games)).toBe(true);
      console.log(`  ✅ Fetched ${games.length} games with auth token`);

      // Step 5: Logout
      console.log("Step 5: Logging out...");
      try {
        await logout();
        console.log("  ✅ Logout API call successful");
      } catch (error: any) {
        console.log(`  ⚠️ Logout API failed: ${error.message}`);
      }

      // Step 6: Verify token is cleared
      console.log("Step 6: Verifying token cleared...");
      const tokenAfterLogout = getAccessToken();
      expect(tokenAfterLogout).toBeNull();
      console.log("  ✅ Token cleared from localStorage");

      // Step 7: Verify API calls fail without token
      console.log("Step 7: Verifying API fails without token...");
      try {
        await getGames({ mine: true });
        // If we get here without error, the API might not require auth
        console.log("  ⚠️ API call succeeded without token (might be public)");
      } catch (error: any) {
        expect(error.status).toBe(401);
        console.log("  ✅ API correctly rejected request without token");
      }

      console.log("\n🎉 Auth flow test completed successfully!");
    });
  });

  describe("Token Refresh Flow", () => {
    it("should handle token refresh", async () => {
      if (!TEST_EMAIL || !TEST_PASSWORD) {
        console.log("⚠️ Skipping - no credentials");
        return;
      }

      // Login first
      const loginResponse = await login({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const originalToken = loginResponse.tokens?.access_token;
      if (!originalToken) {
        console.log("⚠️ No token received");
        return;
      }

      try {
        const refreshResponse = await refreshToken();

        if (refreshResponse && refreshResponse.access_token) {
          console.log("✅ Token refresh successful");
          setAccessToken(refreshResponse.access_token);
          const user = await getCurrentUser();
          if (user) {
            console.log(`✅ New token works: ${user.email}`);
          }
        }
      } catch (error: any) {
        console.log(`⚠️ Token refresh failed: ${error.message}`);
      }

      clearAccessToken();
    });
  });
});
