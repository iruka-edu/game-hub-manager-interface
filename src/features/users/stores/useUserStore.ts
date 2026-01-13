"use client";

/**
 * User Store - Client State Management
 * Zustand store for UI state (filters, modal, selections)
 */

import { create } from "zustand";
import type { Role } from "@/types/user-types";
import type { User, UserFilters, UserModalState } from "../types";

interface UserStoreState {
  // Filters
  filters: UserFilters;
  setSearch: (search: string) => void;
  setRoleFilter: (role: Role | "all") => void;
  setStatusFilter: (status: "all" | "active" | "inactive") => void;
  resetFilters: () => void;

  // Modal state
  modal: UserModalState;
  openAddModal: () => void;
  openEditModal: (user: User) => void;
  closeModal: () => void;
}

const initialFilters: UserFilters = {
  search: "",
  roleFilter: "all",
  statusFilter: "all",
};

const initialModal: UserModalState = {
  isOpen: false,
  mode: "add",
  selectedUser: null,
};

export const useUserStore = create<UserStoreState>((set) => ({
  // Filters
  filters: initialFilters,

  setSearch: (search) =>
    set((state) => ({
      filters: { ...state.filters, search },
    })),

  setRoleFilter: (roleFilter) =>
    set((state) => ({
      filters: { ...state.filters, roleFilter },
    })),

  setStatusFilter: (statusFilter) =>
    set((state) => ({
      filters: { ...state.filters, statusFilter },
    })),

  resetFilters: () =>
    set(() => ({
      filters: initialFilters,
    })),

  // Modal state
  modal: initialModal,

  openAddModal: () =>
    set(() => ({
      modal: {
        isOpen: true,
        mode: "add",
        selectedUser: null,
      },
    })),

  openEditModal: (user) =>
    set(() => ({
      modal: {
        isOpen: true,
        mode: "edit",
        selectedUser: user,
      },
    })),

  closeModal: () =>
    set(() => ({
      modal: initialModal,
    })),
}));

/**
 * Selectors for optimized re-renders
 */
export const useUserFilters = () => useUserStore((state) => state.filters);
export const useUserModal = () => useUserStore((state) => state.modal);

// Individual action selectors to prevent infinite loops
export const useOpenAddModal = () =>
  useUserStore((state) => state.openAddModal);
export const useOpenEditModal = () =>
  useUserStore((state) => state.openEditModal);
export const useCloseModal = () => useUserStore((state) => state.closeModal);

export const useSetSearch = () => useUserStore((state) => state.setSearch);
export const useSetRoleFilter = () =>
  useUserStore((state) => state.setRoleFilter);
export const useSetStatusFilter = () =>
  useUserStore((state) => state.setStatusFilter);
export const useResetFilters = () =>
  useUserStore((state) => state.resetFilters);

export const useUserModalActions = () => {
  const openAddModal = useUserStore((state) => state.openAddModal);
  const openEditModal = useUserStore((state) => state.openEditModal);
  const closeModal = useUserStore((state) => state.closeModal);
  return { openAddModal, openEditModal, closeModal };
};

export const useUserFilterActions = () => {
  const setSearch = useUserStore((state) => state.setSearch);
  const setRoleFilter = useUserStore((state) => state.setRoleFilter);
  const setStatusFilter = useUserStore((state) => state.setStatusFilter);
  const resetFilters = useUserStore((state) => state.resetFilters);
  return { setSearch, setRoleFilter, setStatusFilter, resetFilters };
};
