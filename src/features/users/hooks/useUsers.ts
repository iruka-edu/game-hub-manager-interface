"use client";

/**
 * useUsers Hook
 * React Query hook for fetching users list
 */

import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../api/getUsers";
import { useUserFilters } from "../stores/useUserStore";
import type { User } from "../types";

/**
 * Query key factory for users
 */
export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...usersKeys.lists(), filters] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};

/**
 * Hook to fetch and filter users
 */
export function useUsers() {
  const filters = useUserFilters();

  const query = useQuery({
    queryKey: usersKeys.lists(),
    queryFn: getUsers,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // API returns User[] directly (UsersListResponse)
  const users = query.data ?? [];

  // Client-side filtering (since API doesn't support filtering params)
  const filteredUsers = users.filter((user: User) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        user.full_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Role filter
    if (filters.roleFilter !== "all") {
      if (!user.roles.includes(filters.roleFilter)) return false;
    }

    // Status filter - use snake_case is_active
    if (filters.statusFilter !== "all") {
      const isActive = filters.statusFilter === "active";
      if (user.is_active !== isActive) return false;
    }

    return true;
  });

  return {
    ...query,
    users: filteredUsers,
    allUsers: users,
  };
}
