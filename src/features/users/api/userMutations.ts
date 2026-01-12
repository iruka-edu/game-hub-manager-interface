/**
 * User Mutation API Functions
 * API functions for create, update, delete users
 */

import { apiPost, apiPut, apiDelete } from "@/lib/api-fetch";
import type {
  UserResponse,
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
} from "../types";

/**
 * Create a new user
 * POST /api/users
 */
export async function createUser(
  payload: CreateUserPayload
): Promise<UserResponse> {
  return apiPost<UserResponse>("/api/users", payload);
}

/**
 * Update user information
 * PUT /api/users/:id
 */
export async function updateUser(
  userId: string,
  payload: UpdateUserPayload
): Promise<UserResponse> {
  return apiPut<UserResponse>(`/api/users/${userId}`, payload);
}

/**
 * Update user active status
 * PUT /api/users/:id/status
 */
export async function updateUserStatus(
  userId: string,
  payload: UpdateUserStatusPayload
): Promise<UserResponse> {
  return apiPut<UserResponse>(`/api/users/${userId}/status`, payload);
}

/**
 * Delete a user
 * DELETE /api/users/:id
 */
export async function deleteUser(
  userId: string
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/api/users/${userId}`);
}
