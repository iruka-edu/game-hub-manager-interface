/**
 * Users API Functions
 * Pure functions for fetching users data from external API
 */

import { externalApiGet } from "@/lib/external-api";
import type { UsersListResponse } from "../types";

/**
 * Fetch all users
 * GET /api/v1/users/
 */
export async function getUsers(): Promise<UsersListResponse> {
  return externalApiGet<UsersListResponse>("/api/v1/users/");
}
