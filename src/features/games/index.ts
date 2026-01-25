/**
 * Games Feature - Public API
 * Export only what other modules are allowed to use
 */

// Types
export * from "./types";

// Hooks (for components)
export {
  useGames,
  useGameDetail,
  useGameHistory,
  gamesKeys,
} from "./hooks/useGames";
export {
  useUpdateGame,
  useDeleteGame,
  useSubmitToQC,
  useUpdateSelfQA,
  useApproveGame,
  useRejectGame,
  usePublishGame,
  useUnpublishGame,
  useUploadBuild,
  useUploadThumbnail,
  useQCPass,
  useQCFail,
} from "./hooks/useGameMutations";

// Store selectors (UI state)
export {
  useGameStore,
  useGameFilters,
  useGameModal,
  useSelectedGameIds,
  useGameModalActions,
  useGameFilterActions,
  useGameSelectionActions,
} from "./stores/useGameStore";

// Components are re-exported individually as needed
// export { GameList } from "./components/GameList";
