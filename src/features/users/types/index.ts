/**
 * User Feature Types
 * TypeScript interfaces for User management
 */

import type { Role } from "@/types/user-types";

/**
 * User entity - client-side representation
 */
export interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Response from GET /api/users
 */
export interface UsersListResponse {
  users: User[];
}

/**
 * Response from single user operations
 */
export interface UserResponse {
  success: boolean;
  user: User;
}

/**
 * Payload for creating a new user
 */
export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  roles: Role[];
}

/**
 * Payload for updating an existing user
 */
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  roles?: Role[];
}

/**
 * Payload for updating user status
 */
export interface UpdateUserStatusPayload {
  isActive: boolean;
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
