/**
 * Game Lessons API Functions
 * Fetch educational metadata (subjects, courses, units, etc.)
 */

import { apiGet } from "@/lib/api-fetch";
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
 * Fetch age bands
 */
export async function getAgeBands(): Promise<AgeBandsResponse> {
  return apiGet<AgeBandsResponse>("/api/game-lessons/age-bands");
}

/**
 * Fetch subjects
 */
export async function getSubjects(): Promise<SubjectsResponse> {
  return apiGet<SubjectsResponse>("/api/game-lessons/subjects");
}

/**
 * Fetch courses
 */
export async function getCourses(subjectId?: string): Promise<CoursesResponse> {
  return apiGet<CoursesResponse>("/api/game-lessons/courses", { subjectId });
}

/**
 * Fetch levels
 */
export async function getLevels(): Promise<LevelsResponse> {
  return apiGet<LevelsResponse>("/api/game-lessons/levels");
}

/**
 * Fetch units
 */
export async function getUnits(courseId?: string): Promise<UnitsResponse> {
  return apiGet<UnitsResponse>("/api/game-lessons/units", { courseId });
}

/**
 * Fetch lessons
 */
export async function getLessons(unitId?: string): Promise<LessonsResponse> {
  return apiGet<LessonsResponse>("/api/game-lessons/lessons", { unitId });
}

/**
 * Fetch skills
 */
export async function getSkills(): Promise<SkillsResponse> {
  return apiGet<SkillsResponse>("/api/game-lessons/skills");
}

/**
 * Fetch themes
 */
export async function getThemes(): Promise<ThemesResponse> {
  return apiGet<ThemesResponse>("/api/game-lessons/themes");
}

/**
 * Fetch tracks
 */
export async function getTracks(ageBandId?: string): Promise<TracksResponse> {
  return apiGet<TracksResponse>("/api/game-lessons/tracks", { ageBandId });
}
