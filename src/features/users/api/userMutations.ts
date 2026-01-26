/**
 * User Mutation API Functions
 * Calling backend API at NEXT_PUBLIC_BASE_API_URL
 */

import { apiPost, apiPut } from "@/lib/api-fetch";
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
  ResetUserPasswordPayload,
} from "../types";

/**
 * Create a new user
 * POST /api/v1/users/
 */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  return apiPost<User>("/api/v1/users/", payload);
}

/**
 * Update user information
 * PUT /api/v1/users/{user_id}
 */
export async function updateUser(
  userId: string,
  payload: UpdateUserPayload,
): Promise<User> {
  return apiPut<User>(`/api/v1/users/${userId}`, payload);
}

/**
 * Update user active status
 * POST /api/v1/users/{user_id}/status
 */
export async function updateUserStatus(
  userId: string,
  payload: UpdateUserStatusPayload,
): Promise<User> {
  return apiPost<User>(`/api/v1/users/${userId}/status`, payload);
}

/**
 * Reset user password
 * POST /api/v1/users/{user_id}/password
 */
export async function resetUserPassword(
  userId: string,
  payload: ResetUserPasswordPayload,
): Promise<User> {
  return apiPost<User>(`/api/v1/users/${userId}/password`, payload);
}

/**
 * Delete user (soft delete via status update)
 * Note: API doesn't have a delete endpoint, deactivating instead
 */
export async function deleteUser(userId: string): Promise<void> {
  // Soft delete by setting is_active to false
  await updateUserStatus(userId, { is_active: false });
}
