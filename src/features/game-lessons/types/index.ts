/**
 * Game Lessons Feature Types
 * Educational metadata types (subjects, courses, units, etc.)
 */

/**
 * Common metadata item structure
 */
export interface MetadataItem {
  id: string;
  name: string;
  displayName?: string;
}

/**
 * Age Band
 */
export interface AgeBand extends MetadataItem {
  minAge?: number;
  maxAge?: number;
}

/**
 * Subject
 */
export interface Subject extends MetadataItem {
  code?: string;
}

/**
 * Course
 */
export interface Course extends MetadataItem {
  subjectId?: string;
}

/**
 * Level
 */
export interface Level extends MetadataItem {
  order?: number;
}

/**
 * Unit
 */
export interface Unit extends MetadataItem {
  courseId?: string;
  order?: number;
}

/**
 * Lesson
 */
export interface Lesson extends MetadataItem {
  unitId?: string;
  order?: number;
}

/**
 * Skill
 */
export interface Skill extends MetadataItem {
  category?: string;
}

/**
 * Theme
 */
export interface Theme extends MetadataItem {
  category?: string;
}

/**
 * Track
 */
export interface Track extends MetadataItem {
  ageBandId?: string;
}

/**
 * Generic list response
 */
export interface MetadataListResponse<T> {
  data: T[];
  total?: number;
}

/**
 * Age Bands Response
 */
export type AgeBandsResponse = MetadataListResponse<AgeBand>;

/**
 * Subjects Response
 */
export type SubjectsResponse = MetadataListResponse<Subject>;

/**
 * Courses Response
 */
export type CoursesResponse = MetadataListResponse<Course>;

/**
 * Levels Response
 */
export type LevelsResponse = MetadataListResponse<Level>;

/**
 * Units Response
 */
export type UnitsResponse = MetadataListResponse<Unit>;

/**
 * Lessons Response
 */
export type LessonsResponse = MetadataListResponse<Lesson>;

/**
 * Skills Response
 */
export type SkillsResponse = MetadataListResponse<Skill>;

/**
 * Themes Response
 */
export type ThemesResponse = MetadataListResponse<Theme>;

/**
 * Tracks Response
 */
export type TracksResponse = MetadataListResponse<Track>;
