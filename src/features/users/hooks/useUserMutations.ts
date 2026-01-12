"use client";

/**
 * useUserMutations Hook
 * React Query mutations for user CRUD operations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
} from "../api/userMutations";
import { usersKeys } from "./useUsers";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
} from "../types";

/**
 * Hook for creating a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

/**
 * Hook for updating user information
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateUserPayload;
    }) => updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

/**
 * Hook for updating user status (activate/deactivate)
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateUserStatusPayload;
    }) => updateUserStatus(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

/**
 * Hook for deleting a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
