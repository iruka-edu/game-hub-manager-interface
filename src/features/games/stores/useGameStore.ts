"use client";

/**
 * Game Store - Client State Management
 * Zustand store for UI state (filters, modal, selections)
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { GameStatus } from "@/models/Game";
import type {
  Game,
  GameFilters,
  GameModalState,
  FilterStatus,
  FilterPublishState,
} from "../types";

// GameFilters is imported from ../types

interface GameStoreState {
  // Filters
  filters: GameFilters;
  setSearch: (search: string) => void;
  setStatus: (status: FilterStatus) => void;
  setPublishState: (state: FilterPublishState) => void;
  setOwnerId: (ownerId: string | "all") => void;
  setSubject: (subject: string | "all") => void;
  setGrade: (grade: string | "all") => void;
  setLevel: (level: string | "all") => void; // New
  setSkills: (skills: string[] | "all") => void; // New
  setThemes: (themes: string[] | "all") => void; // New
  setIncludeDeleted: (includeDeleted: boolean) => void;
  setMine: (mine: boolean) => void;
  setSortBy: (sortBy: "created_at" | "updated_at" | "title") => void;
  setSortOrder: (sortOrder: "asc" | "desc") => void;
  setCreatedFrom: (date: Date | null) => void;
  setCreatedTo: (date: Date | null) => void;
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
  publishState: "all",
  ownerId: "all",
  subject: "all",
  grade: "all",
  level: "all",
  skills: "all",
  themes: "all",
  includeDeleted: false,
  mine: true,
  sortBy: "updated_at",
  sortOrder: "desc",
  createdFrom: null,
  createdTo: null,
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

  setPublishState: (publishState) =>
    set((state) => ({
      filters: { ...state.filters, publishState },
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

  setLevel: (level) =>
    set((state) => ({
      filters: { ...state.filters, level },
    })),

  setSkills: (skills) =>
    set((state) => ({
      filters: { ...state.filters, skills },
    })),

  setThemes: (themes) =>
    set((state) => ({
      filters: { ...state.filters, themes },
    })),

  setIncludeDeleted: (includeDeleted) =>
    set((state) => ({
      filters: { ...state.filters, includeDeleted },
    })),

  setMine: (mine) =>
    set((state) => ({
      filters: { ...state.filters, mine },
    })),

  setSortBy: (sortBy) =>
    set((state) => ({
      filters: { ...state.filters, sortBy },
    })),

  setSortOrder: (sortOrder) =>
    set((state) => ({
      filters: { ...state.filters, sortOrder },
    })),

  setCreatedFrom: (createdFrom) =>
    set((state) => ({
      filters: { ...state.filters, createdFrom },
    })),

  setCreatedTo: (createdTo) =>
    set((state) => ({
      filters: { ...state.filters, createdTo },
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
  useGameStore(
    useShallow((state) => ({
      openViewModal: state.openViewModal,
      openEditModal: state.openEditModal,
      openUploadModal: state.openUploadModal,
      openQCModal: state.openQCModal,
      closeModal: state.closeModal,
    })),
  );

export const useGameFilterActions = () =>
  useGameStore(
    useShallow((state) => ({
      setSearch: state.setSearch,
      setStatus: state.setStatus,
      setPublishState: state.setPublishState,
      setOwnerId: state.setOwnerId,
      setSubject: state.setSubject,
      setGrade: state.setGrade,
      setLevel: state.setLevel,
      setSkills: state.setSkills,
      setThemes: state.setThemes,
      setIncludeDeleted: state.setIncludeDeleted,
      setMine: state.setMine,
      setSortBy: state.setSortBy,
      setSortOrder: state.setSortOrder,
      setCreatedFrom: state.setCreatedFrom,
      setCreatedTo: state.setCreatedTo,
      resetFilters: state.resetFilters,
    })),
  );

export const useGameSelectionActions = () =>
  useGameStore(
    useShallow((state) => ({
      toggleGameSelection: state.toggleGameSelection,
      selectAllGames: state.selectAllGames,
      clearSelection: state.clearSelection,
    })),
  );
