import type { User, Role } from '../models/User';
import type { Game, GameStatus } from '../models/Game';

/**
 * Permission check can be a boolean or a function that evaluates based on user and resource
 */
type PermissionCheck<T> = boolean | ((user: User, data: T) => boolean);

/**
 * Game-specific permissions
 */
type GamePermissions = {
  view: PermissionCheck<Game>;
  create: PermissionCheck<Game>;
  update: PermissionCheck<Game>;
  submit: PermissionCheck<Game>;
  review: PermissionCheck<Game>;
  approve: PermissionCheck<Game>;
  publish: PermissionCheck<Game>;
};

/**
 * Role-based permissions with ABAC rules
 */
type RolePermissions = {
  games: Partial<GamePermissions>;
};

/**
 * Statuses where dev can update their own game
 */
const DEV_UPDATABLE_STATUSES: GameStatus[] = ['draft', 'uploaded', 'qc_failed'];

/**
 * Check if user owns the game
 */
const isOwner = (user: User, game: Game): boolean => {
  return game.ownerId === user._id.toString();
};

/**
 * Check if game has specific status
 */
const hasStatus = (game: Game, statuses: GameStatus[]): boolean => {
  return statuses.includes(game.status);
};

/**
 * ROLES configuration with ABAC rules
 */
export const ROLES: Record<Role, RolePermissions> = {
  dev: {
    games: {
      view: (user, game) => isOwner(user, game),
      create: true,
      update: (user, game) => isOwner(user, game) && hasStatus(game, DEV_UPDATABLE_STATUSES),
      submit: (user, game) => isOwner(user, game) && hasStatus(game, ['draft', 'qc_failed']),
      review: false,
      approve: false,
      publish: false,
    },
  },

  qc: {
    games: {
      view: (_, game) => hasStatus(game, ['uploaded']),
      create: false,
      update: false,
      submit: false,
      review: (_, game) => hasStatus(game, ['uploaded']),
      approve: false,
      publish: false,
    },
  },
  cto: {
    games: {
      view: (_, game) => hasStatus(game, ['qc_passed']),
      create: false,
      update: false,
      submit: false,
      review: false,
      approve: (_, game) => hasStatus(game, ['qc_passed']),
      publish: false,
    },
  },
  ceo: {
    games: {
      view: (_, game) => hasStatus(game, ['qc_passed']),
      create: false,
      update: false,
      submit: false,
      review: false,
      approve: (_, game) => hasStatus(game, ['qc_passed']),
      publish: false,
    },
  },
  admin: {
    games: {
      view: true,
      create: true,
      update: true,
      submit: true,
      review: true,
      approve: true,
      publish: (_, game) => hasStatus(game, ['approved']),
    },
  },
};

/**
 * Check if a user has permission to perform an action on a resource
 * 
 * @param user - The user to check permissions for
 * @param resource - The resource type (currently only 'games')
 * @param action - The action to check
 * @param data - Optional resource data for ABAC checks
 * @returns boolean indicating if the user has permission
 */
export function hasPermission(
  user: User,
  resource: 'games',
  action: keyof GamePermissions,
  data?: Game
): boolean {
  // Check each role the user has
  for (const role of user.roles) {
    const rolePermissions = ROLES[role];
    if (!rolePermissions) continue;

    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions) continue;

    const permission = resourcePermissions[action];
    if (permission === undefined) continue;

    // If permission is a boolean
    if (typeof permission === 'boolean') {
      if (permission) return true;
      continue;
    }

    // If permission is a function, evaluate it
    if (typeof permission === 'function' && data) {
      if (permission(user, data)) return true;
    }
  }

  return false;
}

/**
 * Get all actions a user can perform on a specific game
 */
export function getPermittedActions(user: User, game: Game): (keyof GamePermissions)[] {
  const actions: (keyof GamePermissions)[] = ['view', 'create', 'update', 'submit', 'review', 'approve', 'publish'];
  return actions.filter(action => hasPermission(user, 'games', action, game));
}
