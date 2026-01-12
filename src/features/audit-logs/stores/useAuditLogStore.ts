"use client";

/**
 * Audit Logs Store - Client State Management
 */

import { create } from "zustand";
import type { ActionType } from "@/lib/audit-types";
import type { AuditLogFilters } from "../types";

interface AuditLogStoreState {
  filters: AuditLogFilters;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setUserId: (userId: string) => void;
  setAction: (action: ActionType | "") => void;
  setTargetId: (targetId: string) => void;
  resetFilters: () => void;
}

const initialFilters: AuditLogFilters = {
  page: 1,
  limit: 50,
  userId: "",
  action: "",
  targetId: "",
};

export const useAuditLogStore = create<AuditLogStoreState>((set) => ({
  filters: initialFilters,

  setPage: (page) =>
    set((state) => ({
      filters: { ...state.filters, page },
    })),

  setLimit: (limit) =>
    set((state) => ({
      filters: { ...state.filters, limit, page: 1 }, // Reset page when limit changes
    })),

  setUserId: (userId) =>
    set((state) => ({
      filters: { ...state.filters, userId, page: 1 },
    })),

  setAction: (action) =>
    set((state) => ({
      filters: { ...state.filters, action, page: 1 },
    })),

  setTargetId: (targetId) =>
    set((state) => ({
      filters: { ...state.filters, targetId, page: 1 },
    })),

  resetFilters: () =>
    set(() => ({
      filters: initialFilters,
    })),
}));

/**
 * Selectors
 */
export const useAuditLogFilters = () =>
  useAuditLogStore((state) => state.filters);

export const useAuditLogFilterActions = () =>
  useAuditLogStore((state) => ({
    setPage: state.setPage,
    setLimit: state.setLimit,
    setUserId: state.setUserId,
    setAction: state.setAction,
    setTargetId: state.setTargetId,
    resetFilters: state.resetFilters,
  }));
