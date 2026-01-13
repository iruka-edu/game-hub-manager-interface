/**
 * Backend API Client - Proxy to Vũ's backend API
 * Based on docs/interface/BE_vu.json
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api-fetch';

const BACKEND_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

// Helper function to create full URL
function createBackendUrl(endpoint: string): string {
  return `${BACKEND_BASE_URL}${endpoint}`;
}

// ============================================
// TYPES - Based on BE_vu.json schemas
// ============================================

export interface SubjectBase {
  id: string;
  name: string;
  code?: string;
}

export interface AgeBandOut {
  id: string;
  name: string;
  min_age?: number;
  max_age?: number;
}

export interface CourseOut {
  id: string;
  name: string;
  subject_id: string;
  age_band_id: string;
}

export interface TrackOut {
  id: string;
  name: string;
  course_id?: string;
  subject_id?: string;
  age_band_id?: string;
  order?: number;
}

export interface UnitOut {
  id: string;
  name: string;
  track_id: string;
  order?: number;
}

export interface LessonTrackOut {
  id: string;
  name: string;
  unit_id?: string;
  track_id?: string;
  order?: number;
}

export interface SkillOut {
  id: string;
  code: string;
  name: string;
  group?: string;
  age_band_id?: string;
  subject_id?: string;
}

export interface LevelOut {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface ThemeOut {
  id: string;
  code: string;
  name: string;
  group?: string;
}

export interface GameResponse {
  id: string;
  game_id: string;
  title: string;
  description?: string;
  lesson_ids?: string[];
  skill_ids?: string[];
  theme_ids?: string[];
  level_id?: string;
  version?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GameCreate {
  game_id: string;
  title: string;
  description?: string;
  lesson_ids?: string[];
  skill_ids?: string[];
  theme_ids?: string[];
  level_id?: string;
}

export interface GameUpdate {
  title?: string;
  description?: string;
  lesson_ids?: string[];
  skill_ids?: string[];
  theme_ids?: string[];
  level_id?: string;
}

export interface GameVersionCreate {
  version: string;
  entry_url?: string;
  build_size?: number;
}

export interface GameVersionUpdate {
  entry_url?: string;
  build_size?: number;
  status?: string;
}

export interface GameVersionResponse {
  id: string;
  game_id: string;
  version: string;
  entry_url?: string;
  build_size?: number;
  status?: string;
  created_at?: string;
}

// ============================================
// GAME LESSONS API
// ============================================

export const gameLessonsApi = {
  /** GET /api/v1/game-lessons/subjects */
  getSubjects: () => apiGet<SubjectBase[]>(createBackendUrl('/api/v1/game-lessons/subjects')),
  
  /** GET /api/v1/game-lessons/age-bands */
  getAgeBands: () => apiGet<AgeBandOut[]>(createBackendUrl('/api/v1/game-lessons/age-bands')),
  
  /** GET /api/v1/game-lessons/courses/{subject_id}/{age_band_id} */
  getCourses: (subjectId: string, ageBandId: string) => 
    apiGet<CourseOut[]>(createBackendUrl(`/api/v1/game-lessons/courses/${subjectId}/${ageBandId}`)),
  
  /** GET /api/v1/game-lessons/tracks?subject_id={}&age_band_id={} */
  getTracksBySubjectAndAgeBand: (subjectId: string, ageBandId: string) =>
    apiGet<TrackOut[]>(createBackendUrl('/api/v1/game-lessons/tracks'), { subject_id: subjectId, age_band_id: ageBandId }),
  
  /** GET /api/v1/game-lessons/tracks/{course_id} */
  getTracksByCourse: (courseId: string) =>
    apiGet<TrackOut[]>(createBackendUrl(`/api/v1/game-lessons/tracks/${courseId}`)),
  
  /** GET /api/v1/game-lessons/units/{track_id} */
  getUnits: (trackId: string) =>
    apiGet<UnitOut[]>(createBackendUrl(`/api/v1/game-lessons/units/${trackId}`)),
  
  /** GET /api/v1/game-lessons/lessons?track_id={} */
  getLessonsByTrack: (trackId: string) =>
    apiGet<LessonTrackOut[]>(createBackendUrl('/api/v1/game-lessons/lessons'), { track_id: trackId }),
  
  /** GET /api/v1/game-lessons/lessons/{unit_id} */
  getLessonsByUnit: (unitId: string) =>
    apiGet<LessonTrackOut[]>(createBackendUrl(`/api/v1/game-lessons/lessons/${unitId}`)),
  
  /** GET /api/v1/game-lessons/skills */
  getSkills: () => apiGet<SkillOut[]>(createBackendUrl('/api/v1/game-lessons/skills')),
  
  /** GET /api/v1/game-lessons/skills/filter?age_band_id={}&subject_id={} */
  getSkillsFiltered: (ageBandId: string, subjectId: string) =>
    apiGet<SkillOut[]>(createBackendUrl('/api/v1/game-lessons/skills/filter'), { age_band_id: ageBandId, subject_id: subjectId }),
  
  /** GET /api/v1/game-lessons/levels */
  getLevels: () => apiGet<LevelOut[]>(createBackendUrl('/api/v1/game-lessons/levels')),
  
  /** GET /api/v1/game-lessons/themes */
  getThemes: () => apiGet<ThemeOut[]>(createBackendUrl('/api/v1/game-lessons/themes')),
};

// ============================================
// GAMES API
// ============================================

export const gamesApi = {
  /** GET /api/v1/games/ */
  listGames: () => apiGet<GameResponse[]>(createBackendUrl('/api/v1/games/')),
  
  /** POST /api/v1/games/ */
  createGame: (data: GameCreate) => 
    apiPost<GameResponse>(createBackendUrl('/api/v1/games/'), data),
  
  /** GET /api/v1/games/{game_id} */
  getGame: (gameId: string) => 
    apiGet<GameResponse>(createBackendUrl(`/api/v1/games/${gameId}`)),
  
  /** PUT /api/v1/games/{game_id} */
  updateGame: (gameId: string, data: GameUpdate) =>
    apiPut<GameResponse>(createBackendUrl(`/api/v1/games/${gameId}`), data),
  
  /** DELETE /api/v1/games/{game_id} */
  deleteGame: (gameId: string, deletedBy?: string, reason?: string) => {
    const params: Record<string, string> = {};
    if (deletedBy) params.deleted_by = deletedBy;
    if (reason) params.reason = reason;
    return apiDelete<GameResponse>(createBackendUrl(`/api/v1/games/${gameId}`), params);
  },
  
  /** GET /api/v1/games/by_lesson/{lesson_id} */
  getGamesByLesson: (lessonId: string) =>
    apiGet<GameResponse[]>(createBackendUrl(`/api/v1/games/by_lesson/${lessonId}`)),
  
  /** POST /api/v1/games/{game_id}/versions */
  createGameVersion: (gameId: string, data: GameVersionCreate) =>
    apiPost<GameVersionResponse>(createBackendUrl(`/api/v1/games/${gameId}/versions`), data),
  
  /** PUT /api/v1/games/{game_id}/versions/{version} */
  updateGameVersion: (gameId: string, version: string, data: GameVersionUpdate) =>
    apiPut<GameVersionResponse>(createBackendUrl(`/api/v1/games/${gameId}/versions/${version}`), data),
  
  /** DELETE /api/v1/games/{game_id}/versions/{version} */
  deleteGameVersion: (gameId: string, version: string) =>
    apiDelete<GameVersionResponse>(createBackendUrl(`/api/v1/games/${gameId}/versions/${version}`)),
};

export default { gameLessonsApi, gamesApi };
