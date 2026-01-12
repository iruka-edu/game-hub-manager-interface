"use client";

/**
 * Game Store - Client State Management
 * Zustand store for UI state (filters, modal, selections)
 */

import { create } from "zustand";
import type { GameStatus } from "@/models/Game";
import type { Game, GameFilters, GameModalState } from "../types";

interface GameStoreState {
  // Filters
  filters: GameFilters;
  setSearch: (search: string) => void;
  setStatus: (status: GameStatus | "all") => void;
  setOwnerId: (ownerId: string | "all") => void;
  setSubject: (subject: string | "all") => void;
  setGrade: (grade: string | "all") => void;
  setIsDeleted: (isDeleted: boolean) => void;
  resetFilters: () => void;

  // Modal state
  modal: GameModalState;
  openViewModal: (game: Game) => void;
  openEditModal: (game: Game) => void;
  openUploadModal: (game: Game) => void;
  openQCModal: (game: Game) => void;
  closeModal: () => void;

  // Selection state (for bulk operations)
  selectedGameIds: string[];
  toggleGameSelection: (gameId: string) => void;
  selectAllGames: (gameIds: string[]) => void;
  clearSelection: () => void;
}

const initialFilters: GameFilters = {
  search: "",
  status: "all",
  ownerId: "all",
  subject: "all",
  grade: "all",
  isDeleted: false,
};

const initialModal: GameModalState = {
  isOpen: false,
  mode: "view",
  selectedGame: null,
};

export const useGameStore = create<GameStoreState>((set) => ({
  // Filters
  filters: initialFilters,

  setSearch: (search) =>
    set((state) => ({
      filters: { ...state.filters, search },
    })),

  setStatus: (status) =>
    set((state) => ({
      filters: { ...state.filters, status },
    })),

  setOwnerId: (ownerId) =>
    set((state) => ({
      filters: { ...state.filters, ownerId },
    })),

  setSubject: (subject) =>
    set((state) => ({
      filters: { ...state.filters, subject },
    })),

  setGrade: (grade) =>
    set((state) => ({
      filters: { ...state.filters, grade },
    })),

  setIsDeleted: (isDeleted) =>
    set((state) => ({
      filters: { ...state.filters, isDeleted },
    })),

  resetFilters: () =>
    set(() => ({
      filters: initialFilters,
    })),

  // Modal state
  modal: initialModal,

  openViewModal: (game) =>
    set(() => ({
      modal: { isOpen: true, mode: "view", selectedGame: game },
    })),

  openEditModal: (game) =>
    set(() => ({
      modal: { isOpen: true, mode: "edit", selectedGame: game },
    })),

  openUploadModal: (game) =>
    set(() => ({
      modal: { isOpen: true, mode: "upload", selectedGame: game },
    })),

  openQCModal: (game) =>
    set(() => ({
      modal: { isOpen: true, mode: "qc", selectedGame: game },
    })),

  closeModal: () =>
    set(() => ({
      modal: initialModal,
    })),

  // Selection state
  selectedGameIds: [],

  toggleGameSelection: (gameId) =>
    set((state) => ({
      selectedGameIds: state.selectedGameIds.includes(gameId)
        ? state.selectedGameIds.filter((id) => id !== gameId)
        : [...state.selectedGameIds, gameId],
    })),

  selectAllGames: (gameIds) =>
    set(() => ({
      selectedGameIds: gameIds,
    })),

  clearSelection: () =>
    set(() => ({
      selectedGameIds: [],
    })),
}));

/**
 * Selectors for optimized re-renders
 */
export const useGameFilters = () => useGameStore((state) => state.filters);
export const useGameModal = () => useGameStore((state) => state.modal);
export const useSelectedGameIds = () =>
  useGameStore((state) => state.selectedGameIds);

export const useGameModalActions = () =>
  useGameStore((state) => ({
    openViewModal: state.openViewModal,
    openEditModal: state.openEditModal,
    openUploadModal: state.openUploadModal,
    openQCModal: state.openQCModal,
    closeModal: state.closeModal,
  }));

export const useGameFilterActions = () =>
  useGameStore((state) => ({
    setSearch: state.setSearch,
    setStatus: state.setStatus,
    setOwnerId: state.setOwnerId,
    setSubject: state.setSubject,
    setGrade: state.setGrade,
    setIsDeleted: state.setIsDeleted,
    resetFilters: state.resetFilters,
  }));

export const useGameSelectionActions = () =>
  useGameStore((state) => ({
    toggleGameSelection: state.toggleGameSelection,
    selectAllGames: state.selectAllGames,
    clearSelection: state.clearSelection,
  }));
