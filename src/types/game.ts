// Game-related TypeScript types

export interface SerializedGame {
  _id: string;
  gameId: string;
  title: string;
  description?: string;
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
  ownerId: string;
  teamId?: string;
  latestVersionId?: string;
  liveVersionId?: string;
  subject?: string;
  grade?: string;
  unit?: string;
  gameType?: string;
  priority?: string;
  tags?: string[];
  lesson?: string;
  level?: string;
  skills?: string[];
  themes?: string[];
  linkGithub?: string;
  disabled?: boolean;
  rolloutPercentage?: number;
  publishedAt?: string;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SerializedVersion {
  _id: string;
  gameId?: string;
  version: string;
  storagePath?: string;
  entryFile?: string;
  buildSize?: number;
  status: string;
  isDeleted: boolean;
  selfQAChecklist?: any;
  releaseNote?: string;
  submittedBy?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop';