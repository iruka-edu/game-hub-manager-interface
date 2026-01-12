"use client";

/**
 * useGameLessons Hooks
 * React Query hooks for educational metadata
 */

import { useQuery } from "@tanstack/react-query";
import {
  getAgeBands,
  getSubjects,
  getCourses,
  getLevels,
  getUnits,
  getLessons,
  getSkills,
  getThemes,
  getTracks,
} from "../api/getLessonsMetadata";

/**
 * Query key factory for game lessons metadata
 */
export const gameLessonsKeys = {
  all: ["gameLessons"] as const,
  ageBands: () => [...gameLessonsKeys.all, "ageBands"] as const,
  subjects: () => [...gameLessonsKeys.all, "subjects"] as const,
  courses: (subjectId?: string) =>
    [...gameLessonsKeys.all, "courses", subjectId] as const,
  levels: () => [...gameLessonsKeys.all, "levels"] as const,
  units: (courseId?: string) =>
    [...gameLessonsKeys.all, "units", courseId] as const,
  lessons: (unitId?: string) =>
    [...gameLessonsKeys.all, "lessons", unitId] as const,
  skills: () => [...gameLessonsKeys.all, "skills"] as const,
  themes: () => [...gameLessonsKeys.all, "themes"] as const,
  tracks: (ageBandId?: string) =>
    [...gameLessonsKeys.all, "tracks", ageBandId] as const,
};

// These are reference data - cache for a long time
const REFERENCE_DATA_STALE_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * Hook for age bands
 */
export function useAgeBands() {
  return useQuery({
    queryKey: gameLessonsKeys.ageBands(),
    queryFn: getAgeBands,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for subjects
 */
export function useSubjects() {
  return useQuery({
    queryKey: gameLessonsKeys.subjects(),
    queryFn: getSubjects,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for courses (optionally filtered by subject)
 */
export function useCourses(subjectId?: string) {
  return useQuery({
    queryKey: gameLessonsKeys.courses(subjectId),
    queryFn: () => getCourses(subjectId),
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for levels
 */
export function useLevels() {
  return useQuery({
    queryKey: gameLessonsKeys.levels(),
    queryFn: getLevels,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for units (optionally filtered by course)
 */
export function useUnits(courseId?: string) {
  return useQuery({
    queryKey: gameLessonsKeys.units(courseId),
    queryFn: () => getUnits(courseId),
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for lessons (optionally filtered by unit)
 */
export function useLessons(unitId?: string) {
  return useQuery({
    queryKey: gameLessonsKeys.lessons(unitId),
    queryFn: () => getLessons(unitId),
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for skills
 */
export function useSkills() {
  return useQuery({
    queryKey: gameLessonsKeys.skills(),
    queryFn: getSkills,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for themes
 */
export function useThemes() {
  return useQuery({
    queryKey: gameLessonsKeys.themes(),
    queryFn: getThemes,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for tracks (optionally filtered by age band)
 */
export function useTracks(ageBandId?: string) {
  return useQuery({
    queryKey: gameLessonsKeys.tracks(ageBandId),
    queryFn: () => getTracks(ageBandId),
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}
