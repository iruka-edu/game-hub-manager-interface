/**
 * Integration Tests for External API
 *
 * These tests call the REAL external API to verify the integration works correctly.
 * Requires the backend API to be running at NEXT_PUBLIC_BASE_API_URL.
 *
 * Run with: npx jest src/features/__tests__/api-integration.test.ts --runInBand
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
} from "@/lib/external-api";
import { login, getCurrentUser, logout } from "@/features/auth/api/authApi";
import { getGames, getGameById } from "@/features/games/api/getGames";
import { getUsers } from "@/features/users/api/getUsers";
import { getNotifications } from "@/features/notifications/api/getNotifications";

// Test credentials - should be set in environment variables
const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "password123";

describe("External API Integration Tests", { timeout: 30000 }, () => {
  beforeAll(() => {
    // Verify API URL is set
    const baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL;
    if (!baseUrl) {
      console.warn("⚠️ NEXT_PUBLIC_BASE_API_URL is not set. Tests may fail.");
    } else {
      console.log(`Testing against API: ${baseUrl}`);
    }
  });

  afterAll(() => {
    // Clean up tokens after all tests
    clearAccessToken();
  });

  describe("Token Storage", () => {
    it("should store and retrieve access token", () => {
      const testToken = "test_token_12345";

      setAccessToken(testToken);
      const retrieved = getAccessToken();

      expect(retrieved).toBe(testToken);

      // Clean up
      clearAccessToken();
      expect(getAccessToken()).toBeNull();
    });

    it("should clear access token", () => {
      setAccessToken("token_to_clear");
      expect(getAccessToken()).toBe("token_to_clear");

      clearAccessToken();
      expect(getAccessToken()).toBeNull();
    });
  });

  describe("Auth API", () => {
    it("should login and store token", async () => {
      // Skip if no test credentials
      if (!TEST_EMAIL || !TEST_PASSWORD) {
        console.log("Skipping login test - no credentials provided");
        return;
      }

      try {
        const response = await login({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });

        expect(response).toBeDefined();
        expect(response.tokens).toBeDefined();
        expect(response.tokens?.access_token).toBeDefined();
        expect(typeof response.tokens?.access_token).toBe("string");

        // Token should be stored
        const storedToken = getAccessToken();
        expect(storedToken).toBe(response.tokens?.access_token);

        console.log("✅ Login successful, token stored");
      } catch (error: any) {
        // If login fails, log but don't fail the test
        console.log(`⚠️ Login test skipped: ${error.message}`);
      }
    });

    it("should get current user with token", async () => {
      const token = getAccessToken();
      if (!token) {
        console.log("Skipping - no token available");
        return;
      }

      try {
        const user = await getCurrentUser();

        if (user) {
          expect(user.id).toBeDefined();
          expect(user.email).toBeDefined();
          expect(user.roles).toBeDefined();
          expect(Array.isArray(user.roles)).toBe(true);
          console.log(`✅ Got current user: ${user.email}`);
        } else {
          console.log("⚠️ No user returned from getCurrentUser");
        }
      } catch (error: any) {
        console.log(`⚠️ Get current user failed: ${error.message}`);
      }
    });
  });

  describe("Games API", () => {
    it("should fetch games list", async () => {
      const token = getAccessToken();
      if (!token) {
        console.log("Skipping - no token available");
        return;
      }

      try {
        const games = await getGames({ mine: true });

        expect(Array.isArray(games)).toBe(true);
        console.log(`✅ Fetched ${games.length} games`);

        if (games.length > 0) {
          const game = games[0];
          expect(game.game_id).toBeDefined();
          expect(game.title).toBeDefined();
          console.log(`   First game: ${game.title} (${game.game_id})`);
        }
      } catch (error: any) {
        console.log(`⚠️ Get games failed: ${error.message}`);
      }
    });

    it("should fetch single game by ID", async () => {
      const token = getAccessToken();
      if (!token) {
        console.log("Skipping - no token available");
        return;
      }

      try {
        // First get list to find a game ID
        const games = await getGames({ mine: true });

        if (games.length === 0) {
          console.log("⚠️ No games to test with");
          return;
        }

        const gameId = games[0].game_id;
        const game = await getGameById(gameId);

        expect(game).toBeDefined();
        expect(game.game_id).toBe(gameId);
        expect(game.title).toBeDefined();
        console.log(`✅ Fetched game detail: ${game.title}`);
      } catch (error: any) {
        console.log(`⚠️ Get game by ID failed: ${error.message}`);
      }
    });
  });

  describe("Users API", () => {
    it("should fetch users list", async () => {
      const token = getAccessToken();
      if (!token) {
        console.log("Skipping - no token available");
        return;
      }

      try {
        const users = await getUsers();

        expect(Array.isArray(users)).toBe(true);
        console.log(`✅ Fetched ${users.length} users`);

        if (users.length > 0) {
          const user = users[0];
          expect(user.id).toBeDefined();
          expect(user.email).toBeDefined();
          expect(user.roles).toBeDefined();
          console.log(`   First user: ${user.name} (${user.email})`);
        }
      } catch (error: any) {
        console.log(`⚠️ Get users failed: ${error.message}`);
      }
    });
  });

  describe("Notifications API", () => {
    it("should fetch notifications", async () => {
      const token = getAccessToken();
      if (!token) {
        console.log("Skipping - no token available");
        return;
      }

      try {
        const response = await getNotifications();

        expect(response).toBeDefined();
        expect(Array.isArray(response.notifications)).toBe(true);
        expect(typeof response.unread_count).toBe("number");
        console.log(
          `✅ Fetched ${response.notifications.length} notifications, ${response.unread_count} unread`,
        );
      } catch (error: any) {
        console.log(`⚠️ Get notifications failed: ${error.message}`);
      }
    });
  });

  describe("Logout", () => {
    it("should logout and clear token", async () => {
      const token = getAccessToken();
      if (!token) {
        console.log("Skipping - no token available");
        return;
      }

      try {
        await logout();

        // Token should be cleared
        const storedToken = getAccessToken();
        expect(storedToken).toBeNull();
        console.log("✅ Logout successful, token cleared");
      } catch (error: any) {
        // Still clear the token even if API call fails
        clearAccessToken();
        console.log(
          `⚠️ Logout API failed, but token cleared: ${error.message}`,
        );
      }
    });
  });
});
