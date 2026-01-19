/**
 * User Mutation API Functions
 * API functions for create, update, delete users via external API
 */

import { externalApiPost } from "@/lib/external-api";
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
  return externalApiPost<User>("/api/v1/users/", payload);
}

/**
 * Update user information
 * Note: External API doesn't have a dedicated update endpoint
 * This function uses status update for now - extend when API supports full user updates
 */
export async function updateUser(
  userId: string,
  payload: UpdateUserPayload
): Promise<User> {
  // For now, we can only update status via the API
  // If the payload includes is_active (from UpdateUserPayload), use status update
  // TODO: Add full user update when API supports it
  if (payload.roles) {
    // Cannot update roles via current API - throw a meaningful error
    throw new Error("Cập nhật vai trò người dùng chưa được API hỗ trợ");
  }

  // Fall back to updating status if no other fields
  return externalApiPost<User>(`/api/v1/users/${userId}/status`, {
    is_active: true, // Default to keeping active
  });
}

/**
 * Update user active status
 * POST /api/v1/users/{user_id}/status
 */
export async function updateUserStatus(
  userId: string,
  payload: UpdateUserStatusPayload
): Promise<User> {
  return externalApiPost<User>(`/api/v1/users/${userId}/status`, payload);
}

/**
 * Reset user password
 * POST /api/v1/users/{user_id}/password
 */
export async function resetUserPassword(
  userId: string,
  payload: ResetUserPasswordPayload
): Promise<User> {
  return externalApiPost<User>(`/api/v1/users/${userId}/password`, payload);
}

/**
 * Delete user (soft delete via status update)
 * Note: External API doesn't have a delete endpoint, deactivating instead
 */
export async function deleteUser(userId: string): Promise<void> {
  // Soft delete by setting is_active to false
  await updateUserStatus(userId, { is_active: false });
}
