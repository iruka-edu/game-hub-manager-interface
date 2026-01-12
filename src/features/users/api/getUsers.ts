/**
 * Users API Functions
 * Pure functions for fetching users data
 */

import { apiGet } from "@/lib/api-fetch";
import type { UsersListResponse } from "../types";

/**
 * Fetch all users
 * GET /api/users
 */
export async function getUsers(): Promise<UsersListResponse> {
  return apiGet<UsersListResponse>("/api/users");
}
