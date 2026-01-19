/**
 * Game Lessons API Functions
 * Fetch educational metadata using the game-lessons API
 */

import { gameLessonsApiGet } from "./gameLessonsClient";
import type {
  AgeBandsResponse,
  SubjectsResponse,
  CoursesResponse,
  LevelsResponse,
  UnitsResponse,
  LessonsResponse,
  SkillsResponse,
  ThemesResponse,
  TracksResponse,
} from "../types";

/**
 * Fetch subjects
 * GET /api/v1/game-lessons/subjects
 */
export async function getSubjects(): Promise<SubjectsResponse> {
  return gameLessonsApiGet<SubjectsResponse>("/api/v1/game-lessons/subjects");
}

/**
 * Fetch age bands
 * GET /api/v1/game-lessons/age-bands
 */
export async function getAgeBands(): Promise<AgeBandsResponse> {
  return gameLessonsApiGet<AgeBandsResponse>("/api/v1/game-lessons/age-bands");
}

/**
 * Fetch courses by subject and age band
 * GET /api/v1/game-lessons/courses/{subject_id}/{age_band_id}
 */
export async function getCourses(
  subjectId: string,
  ageBandId: string,
): Promise<CoursesResponse> {
  return gameLessonsApiGet<CoursesResponse>(
    `/api/v1/game-lessons/courses/${subjectId}/${ageBandId}`,
  );
}

/**
 * Fetch tracks by subject and age band (query params)
 * GET /api/v1/game-lessons/tracks?subject_id={subject_id}&age_band_id={age_band_id}
 */
export async function getTracksBySubjectAndAgeBand(
  subjectId: string,
  ageBandId: string,
): Promise<TracksResponse> {
  return gameLessonsApiGet<TracksResponse>(
    `/api/v1/game-lessons/tracks?subject_id=${subjectId}&age_band_id=${ageBandId}`,
  );
}

/**
 * Fetch tracks by course
 * GET /api/v1/game-lessons/tracks/{course_id}
 */
export async function getTracksByCourse(
  courseId: string,
): Promise<TracksResponse> {
  return gameLessonsApiGet<TracksResponse>(
    `/api/v1/game-lessons/tracks/${courseId}`,
  );
}

/**
 * Fetch units by track
 * GET /api/v1/game-lessons/units/{track_id}
 */
export async function getUnits(trackId: string): Promise<UnitsResponse> {
  return gameLessonsApiGet<UnitsResponse>(
    `/api/v1/game-lessons/units/${trackId}`,
  );
}

/**
 * Fetch lessons by track (query params)
 * GET /api/v1/game-lessons/lessons?track_id={track_id}
 */
export async function getLessonsByTrack(
  trackId: string,
): Promise<LessonsResponse> {
  return gameLessonsApiGet<LessonsResponse>(
    `/api/v1/game-lessons/lessons?track_id=${trackId}`,
  );
}

/**
 * Fetch lessons by unit
 * GET /api/v1/game-lessons/lessons/{unit_id}
 */
export async function getLessonsByUnit(
  unitId: string,
): Promise<LessonsResponse> {
  return gameLessonsApiGet<LessonsResponse>(
    `/api/v1/game-lessons/lessons/${unitId}`,
  );
}

/**
 * Fetch all skills
 * GET /api/v1/game-lessons/skills
 */
export async function getSkills(): Promise<SkillsResponse> {
  return gameLessonsApiGet<SkillsResponse>("/api/v1/game-lessons/skills");
}

/**
 * Fetch skills filtered by age band and subject
 * GET /api/v1/game-lessons/skills/filter?age_band_id={age_band_id}&subject_id={subject_id}
 */
export async function getSkillsByAgeBandAndSubject(
  ageBandId: string,
  subjectId: string,
): Promise<SkillsResponse> {
  return gameLessonsApiGet<SkillsResponse>(
    `/api/v1/game-lessons/skills/filter?age_band_id=${ageBandId}&subject_id=${subjectId}`,
  );
}

/**
 * Fetch levels
 * GET /api/v1/game-lessons/levels
 */
export async function getLevels(): Promise<LevelsResponse> {
  return gameLessonsApiGet<LevelsResponse>("/api/v1/game-lessons/levels");
}

/**
 * Fetch themes
 * GET /api/v1/game-lessons/themes
 */
export async function getThemes(): Promise<ThemesResponse> {
  return gameLessonsApiGet<ThemesResponse>("/api/v1/game-lessons/themes");
}
