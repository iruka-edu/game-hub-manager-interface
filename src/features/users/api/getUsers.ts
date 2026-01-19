/**
 * Users API Functions
 * Calling backend API at NEXT_PUBLIC_BASE_API_URL
 */

import { apiGet } from "@/lib/api-fetch";
import type { UsersListResponse } from "../types";

/**
 * Fetch all users
 * GET /api/v1/users/
 */
export async function getUsers(): Promise<UsersListResponse> {
  return apiGet<UsersListResponse>("/api/v1/users/");
}
