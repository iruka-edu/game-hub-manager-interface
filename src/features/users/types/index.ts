/**
 * User Feature Types
 * Matching BE_vu_v2.json API schemas (snake_case)
 */

import type { Role } from "@/types/user-types";

/**
 * User entity from API
 * Matches UserResponse schema
 */
export interface User {
  id: string;
  email: string;
  full_name: string;
  roles: Role[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Response from GET /api/v1/users/
 * Returns array of UserResponse
 */
export type UsersListResponse = User[];

/**
 * Single user operation response
 */
export interface UserResponse {
  success?: boolean;
  user?: User;
}

/**
 * Payload for creating a new user
 * Matches UserCreate schema
 */
export interface CreateUserPayload extends Omit<
  User,
  "id" | "created_at" | "updated_at" | "is_active"
> {
  password: string;
}

/**
 * Payload for updating an existing user
 * (If needed - API doesn't show explicit update endpoint)
 */
export interface UpdateUserPayload extends Omit<
  User,
  "id" | "created_at" | "updated_at" | "is_active"
> {}

/**
 * Payload for updating user status
 * Matches UserStatusUpdate schema
 */
export interface UpdateUserStatusPayload {
  is_active: boolean;
}

/**
 * Payload for resetting user password
 * Matches UserPasswordReset schema
 */
export interface ResetUserPasswordPayload {
  new_password: string;
}

/**
 * UI Filter state for users list
 */
export interface UserFilters {
  search: string;
  roleFilter: Role | "all";
  statusFilter: "all" | "active" | "inactive";
}

/**
 * Modal state for user form
 */
export interface UserModalState {
  isOpen: boolean;
  mode: "add" | "edit";
  selectedUser: User | null;
}
