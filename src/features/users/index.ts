/**
 * Users Feature - Public API
 * Export only what other modules are allowed to use
 */

// Types
export * from "./types";

// Hooks (for components)
export { useUsers, usersKeys } from "./hooks/useUsers";
export {
  useCreateUser,
  useUpdateUser,
  useUpdateUserStatus,
  useDeleteUser,
} from "./hooks/useUserMutations";

// Store selectors (UI state)
export {
  useUserStore,
  useUserFilters,
  useUserModal,
  useUserModalActions,
  useUserFilterActions,
} from "./stores/useUserStore";

// Components
export { UserManagement } from "./components/UserManagement";
