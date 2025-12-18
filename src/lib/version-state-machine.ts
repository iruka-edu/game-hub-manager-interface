import type { VersionStatus, GameVersion, SelfQAChecklist } from '../models/GameVersion';
import { GameVersionRepository } from '../models/GameVersion';

/**
 * State transition definition
 */
export interface StateTransition {
  from: VersionStatus[];
  to: VersionStatus;
  requiredPermission?: string;
  validate?: (version: GameVersion) => Promise<boolean>;
}

/**
 * Valid state transitions configuration
 */
export const STATE_TRANSITIONS: Record<string, StateTransition> = {
  submit: {
    from: ['draft', 'qc_failed'],
    to: 'uploaded',
    requiredPermission: 'games:submit',
    validate: async (version: GameVersion) => {
      // Check Self-QA completion
      if (!version.selfQAChecklist) {
        return false;
      }
      const checklist = version.selfQAChecklist;
      return (
        checklist.testedDevices === true &&
        checklist.testedAudio === true &&
        checklist.gameplayComplete === true &&
        checklist.contentVerified === true
      );
    }
  },
  startReview: {
    from: ['uploaded'],
    to: 'qc_processing',
    requiredPermission: 'games:review'
  },
  pass: {
    from: ['qc_processing'],
    to: 'qc_passed',
    requiredPermission: 'games:review'
  },
  fail: {
    from: ['qc_processing'],
    to: 'qc_failed',
    requiredPermission: 'games:review'
  },
  approve: {
    from: ['qc_passed'],
    to: 'approved',
    requiredPermission: 'games:approve'
  },
  publish: {
    from: ['approved'],
    to: 'published',
    requiredPermission: 'games:publish'
  }
};

/**
 * Version State Machine service
 * Enforces valid status transitions for GameVersion
 */
export class VersionStateMachine {
  private repository: GameVersionRepository;

  constructor(repository: GameVersionRepository) {
    this.repository = repository;
  }

  /**
   * Create a VersionStateMachine instance
   */
  static async getInstance(): Promise<VersionStateMachine> {
    const repository = await GameVersionRepository.getInstance();
    return new VersionStateMachine(repository);
  }

  /**
   * Check if a transition is valid from current status
   */
  canTransition(currentStatus: VersionStatus, action: string): boolean {
    const transition = STATE_TRANSITIONS[action];
    if (!transition) {
      return false;
    }
    return transition.from.includes(currentStatus);
  }

  /**
   * Get list of valid actions from current status
   */
  getValidActions(currentStatus: VersionStatus): string[] {
    const validActions: string[] = [];
    
    for (const [action, transition] of Object.entries(STATE_TRANSITIONS)) {
      if (transition.from.includes(currentStatus)) {
        validActions.push(action);
      }
    }
    
    return validActions;
  }

  /**
   * Get the target status for an action
   */
  getTargetStatus(action: string): VersionStatus | null {
    const transition = STATE_TRANSITIONS[action];
    return transition ? transition.to : null;
  }

  /**
   * Perform a state transition
   * @param versionId - The GameVersion ID
   * @param action - The transition action (submit, startReview, pass, fail, approve, publish)
   * @param userId - The user performing the action (for permission checks)
   * @returns The updated GameVersion
   * @throws Error if transition is invalid
   */
  async transition(
    versionId: string,
    action: string,
    userId?: string
  ): Promise<GameVersion> {
    // Get the transition definition
    const transition = STATE_TRANSITIONS[action];
    if (!transition) {
      throw new Error(`Unknown action: ${action}`);
    }

    // Get current version
    const version = await this.repository.findById(versionId);
    if (!version) {
      throw new Error(`GameVersion not found: ${versionId}`);
    }

    // Check if transition is valid from current status
    if (!transition.from.includes(version.status)) {
      const validActions = this.getValidActions(version.status);
      throw new Error(
        `Invalid transition: Cannot ${action} from status "${version.status}". ` +
        `Valid actions from this status: ${validActions.join(', ') || 'none'}`
      );
    }

    // Run validation if defined
    if (transition.validate) {
      const isValid = await transition.validate(version);
      if (!isValid) {
        throw new Error(
          `Validation failed for action "${action}". ` +
          `Please ensure all requirements are met (e.g., Self-QA completion).`
        );
      }
    }

    // Perform the transition
    const updatedVersion = await this.repository.updateStatus(versionId, transition.to);
    if (!updatedVersion) {
      throw new Error(`Failed to update version status`);
    }

    return updatedVersion;
  }

  /**
   * Validate Self-QA checklist completion
   */
  validateSelfQA(checklist?: SelfQAChecklist): boolean {
    if (!checklist) {
      return false;
    }
    return (
      checklist.testedDevices === true &&
      checklist.testedAudio === true &&
      checklist.gameplayComplete === true &&
      checklist.contentVerified === true
    );
  }

  /**
   * Get human-readable error message for invalid transition
   */
  getTransitionError(currentStatus: VersionStatus, action: string): string {
    const transition = STATE_TRANSITIONS[action];
    
    if (!transition) {
      return `Unknown action: ${action}`;
    }

    if (!transition.from.includes(currentStatus)) {
      const validActions = this.getValidActions(currentStatus);
      return (
        `Cannot ${action} from status "${currentStatus}". ` +
        `Valid actions: ${validActions.join(', ') || 'none'}`
      );
    }

    return 'Transition is valid';
  }
}
