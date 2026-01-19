"use client";

/**
 * useGameLessons Hooks
 * React Query hooks for educational metadata using game-lessons API
 */

import { useQuery } from "@tanstack/react-query";
import {
  getSubjects,
  getAgeBands,
  getCourses,
  getTracksBySubjectAndAgeBand,
  getTracksByCourse,
  getUnits,
  getLessonsByTrack,
  getLessonsByUnit,
  getSkills,
  getSkillsByAgeBandAndSubject,
  getLevels,
  getThemes,
} from "../api/getLessonsMetadata";

/**
 * Query key factory for game lessons metadata
 */
export const gameLessonsKeys = {
  all: ["gameLessons"] as const,
  subjects: () => [...gameLessonsKeys.all, "subjects"] as const,
  ageBands: () => [...gameLessonsKeys.all, "ageBands"] as const,
  courses: (subjectId: string, ageBandId: string) =>
    [...gameLessonsKeys.all, "courses", subjectId, ageBandId] as const,
  tracksBySubjectAndAgeBand: (subjectId: string, ageBandId: string) =>
    [...gameLessonsKeys.all, "tracks", "bySubjectAndAgeBand", subjectId, ageBandId] as const,
  tracksByCourse: (courseId: string) =>
    [...gameLessonsKeys.all, "tracks", "byCourse", courseId] as const,
  units: (trackId: string) =>
    [...gameLessonsKeys.all, "units", trackId] as const,
  lessonsByTrack: (trackId: string) =>
    [...gameLessonsKeys.all, "lessons", "byTrack", trackId] as const,
  lessonsByUnit: (unitId: string) =>
    [...gameLessonsKeys.all, "lessons", "byUnit", unitId] as const,
  skills: () => [...gameLessonsKeys.all, "skills"] as const,
  skillsByAgeBandAndSubject: (ageBandId: string, subjectId: string) =>
    [...gameLessonsKeys.all, "skills", "filtered", ageBandId, subjectId] as const,
  levels: () => [...gameLessonsKeys.all, "levels"] as const,
  themes: () => [...gameLessonsKeys.all, "themes"] as const,
};

// These are reference data - cache for a long time
const REFERENCE_DATA_STALE_TIME = 30 * 60 * 1000; // 30 minutes

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
 * Hook for courses (requires both subject and age band)
 */
export function useCourses(subjectId: string, ageBandId: string) {
  return useQuery({
    queryKey: gameLessonsKeys.courses(subjectId, ageBandId),
    queryFn: () => getCourses(subjectId, ageBandId),
    enabled: !!subjectId && !!ageBandId,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for tracks by subject and age band
 */
export function useTracksBySubjectAndAgeBand(subjectId: string, ageBandId: string) {
  return useQuery({
    queryKey: gameLessonsKeys.tracksBySubjectAndAgeBand(subjectId, ageBandId),
    queryFn: () => getTracksBySubjectAndAgeBand(subjectId, ageBandId),
    enabled: !!subjectId && !!ageBandId,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for tracks by course
 */
export function useTracksByCourse(courseId: string) {
  return useQuery({
    queryKey: gameLessonsKeys.tracksByCourse(courseId),
    queryFn: () => getTracksByCourse(courseId),
    enabled: !!courseId,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for units (requires track ID)
 */
export function useUnits(trackId: string) {
  return useQuery({
    queryKey: gameLessonsKeys.units(trackId),
    queryFn: () => getUnits(trackId),
    enabled: !!trackId,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for lessons by track
 */
export function useLessonsByTrack(trackId: string) {
  return useQuery({
    queryKey: gameLessonsKeys.lessonsByTrack(trackId),
    queryFn: () => getLessonsByTrack(trackId),
    enabled: !!trackId,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for lessons by unit
 */
export function useLessonsByUnit(unitId: string) {
  return useQuery({
    queryKey: gameLessonsKeys.lessonsByUnit(unitId),
    queryFn: () => getLessonsByUnit(unitId),
    enabled: !!unitId,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for all skills
 */
export function useSkills() {
  return useQuery({
    queryKey: gameLessonsKeys.skills(),
    queryFn: getSkills,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/**
 * Hook for skills filtered by age band and subject
 */
export function useSkillsByAgeBandAndSubject(ageBandId: string, subjectId: string) {
  return useQuery({
    queryKey: gameLessonsKeys.skillsByAgeBandAndSubject(ageBandId, subjectId),
    queryFn: () => getSkillsByAgeBandAndSubject(ageBandId, subjectId),
    enabled: !!ageBandId && !!subjectId,
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
 * Hook for themes
 */
export function useThemes() {
  return useQuery({
    queryKey: gameLessonsKeys.themes(),
    queryFn: getThemes,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}
