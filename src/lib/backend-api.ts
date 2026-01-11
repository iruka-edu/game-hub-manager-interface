/**
 * Backend API Client - Proxy to Vũ's backend API
 * Based on docs/interface/BE_vu.json
 */

const BACKEND_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

async function fetchBackend<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  
  const url = `${BACKEND_BASE_URL}${endpoint}`;
  
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  
  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Backend API error: ${response.status} - ${error}`);
  }
  
  return response.json();
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
  getSubjects: () => fetchBackend<SubjectBase[]>('/api/v1/game-lessons/subjects'),
  
  /** GET /api/v1/game-lessons/age-bands */
  getAgeBands: () => fetchBackend<AgeBandOut[]>('/api/v1/game-lessons/age-bands'),
  
  /** GET /api/v1/game-lessons/courses/{subject_id}/{age_band_id} */
  getCourses: (subjectId: string, ageBandId: string) => 
    fetchBackend<CourseOut[]>(`/api/v1/game-lessons/courses/${subjectId}/${ageBandId}`),
  
  /** GET /api/v1/game-lessons/tracks?subject_id={}&age_band_id={} */
  getTracksBySubjectAndAgeBand: (subjectId: string, ageBandId: string) =>
    fetchBackend<TrackOut[]>(`/api/v1/game-lessons/tracks?subject_id=${subjectId}&age_band_id=${ageBandId}`),
  
  /** GET /api/v1/game-lessons/tracks/{course_id} */
  getTracksByCourse: (courseId: string) =>
    fetchBackend<TrackOut[]>(`/api/v1/game-lessons/tracks/${courseId}`),
  
  /** GET /api/v1/game-lessons/units/{track_id} */
  getUnits: (trackId: string) =>
    fetchBackend<UnitOut[]>(`/api/v1/game-lessons/units/${trackId}`),
  
  /** GET /api/v1/game-lessons/lessons?track_id={} */
  getLessonsByTrack: (trackId: string) =>
    fetchBackend<LessonTrackOut[]>(`/api/v1/game-lessons/lessons?track_id=${trackId}`),
  
  /** GET /api/v1/game-lessons/lessons/{unit_id} */
  getLessonsByUnit: (unitId: string) =>
    fetchBackend<LessonTrackOut[]>(`/api/v1/game-lessons/lessons/${unitId}`),
  
  /** GET /api/v1/game-lessons/skills */
  getSkills: () => fetchBackend<SkillOut[]>('/api/v1/game-lessons/skills'),
  
  /** GET /api/v1/game-lessons/skills/filter?age_band_id={}&subject_id={} */
  getSkillsFiltered: (ageBandId: string, subjectId: string) =>
    fetchBackend<SkillOut[]>(`/api/v1/game-lessons/skills/filter?age_band_id=${ageBandId}&subject_id=${subjectId}`),
  
  /** GET /api/v1/game-lessons/levels */
  getLevels: () => fetchBackend<LevelOut[]>('/api/v1/game-lessons/levels'),
  
  /** GET /api/v1/game-lessons/themes */
  getThemes: () => fetchBackend<ThemeOut[]>('/api/v1/game-lessons/themes'),
};

// ============================================
// GAMES API
// ============================================

export const gamesApi = {
  /** GET /api/v1/games/ */
  listGames: () => fetchBackend<GameResponse[]>('/api/v1/games/'),
  
  /** POST /api/v1/games/ */
  createGame: (data: GameCreate) => 
    fetchBackend<GameResponse>('/api/v1/games/', { method: 'POST', body: data }),
  
  /** GET /api/v1/games/{game_id} */
  getGame: (gameId: string) => 
    fetchBackend<GameResponse>(`/api/v1/games/${gameId}`),
  
  /** PUT /api/v1/games/{game_id} */
  updateGame: (gameId: string, data: GameUpdate) =>
    fetchBackend<GameResponse>(`/api/v1/games/${gameId}`, { method: 'PUT', body: data }),
  
  /** DELETE /api/v1/games/{game_id} */
  deleteGame: (gameId: string, deletedBy?: string, reason?: string) => {
    const params = new URLSearchParams();
    if (deletedBy) params.append('deleted_by', deletedBy);
    if (reason) params.append('reason', reason);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchBackend<GameResponse>(`/api/v1/games/${gameId}${query}`, { method: 'DELETE' });
  },
  
  /** GET /api/v1/games/by_lesson/{lesson_id} */
  getGamesByLesson: (lessonId: string) =>
    fetchBackend<GameResponse[]>(`/api/v1/games/by_lesson/${lessonId}`),
  
  /** POST /api/v1/games/{game_id}/versions */
  createGameVersion: (gameId: string, data: GameVersionCreate) =>
    fetchBackend<GameVersionResponse>(`/api/v1/games/${gameId}/versions`, { method: 'POST', body: data }),
  
  /** PUT /api/v1/games/{game_id}/versions/{version} */
  updateGameVersion: (gameId: string, version: string, data: GameVersionUpdate) =>
    fetchBackend<GameVersionResponse>(`/api/v1/games/${gameId}/versions/${version}`, { method: 'PUT', body: data }),
  
  /** DELETE /api/v1/games/{game_id}/versions/{version} */
  deleteGameVersion: (gameId: string, version: string) =>
    fetchBackend<GameVersionResponse>(`/api/v1/games/${gameId}/versions/${version}`, { method: 'DELETE' }),
};

export default { gameLessonsApi, gamesApi };
