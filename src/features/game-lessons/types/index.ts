/**
 * Game Lessons Feature Types
 * Educational metadata types based on API specification
 */

/**
 * Subject Base
 */
export interface SubjectBase {
  id: string;
  name: string;
  code?: string;
}

/**
 * Age Band Output
 */
export interface AgeBandOut {
  id: string;
  name: string;
  min_age?: number;
  max_age?: number;
}

/**
 * Course Output
 */
export interface CourseOut {
  id: string;
  name: string;
  subject_id: string;
  age_band_id: string;
}

/**
 * Track Output
 */
export interface TrackOut {
  id: string;
  name: string;
  course_id?: string;
  subject_id?: string;
  age_band_id?: string;
}

/**
 * Unit Output
 */
export interface UnitOut {
  id: string;
  name: string;
  track_id: string;
  order?: number;
}

/**
 * Lesson Track Output
 */
export interface LessonTrackOut {
  id: string;
  name: string;
  unit_id?: string;
  track_id?: string;
  order?: number;
}

/**
 * Skill Output
 */
export interface SkillOut {
  id: string;
  name: string;
  subject_id?: string;
  age_band_id?: string;
  category?: string;
}

/**
 * Level Output
 */
export interface LevelOut {
  id: string;
  name: string;
  order?: number;
}

/**
 * Theme Output
 */
export interface ThemeOut {
  id: string;
  name: string;
  category?: string;
}

/**
 * HTTP Validation Error
 */
export interface HTTPValidationError {
  detail?: Array<{
    loc: Array<string | number>;
    msg: string;
    type: string;
  }>;
}

// Response types (arrays as per API spec)
export type SubjectsResponse = SubjectBase[];
export type AgeBandsResponse = AgeBandOut[];
export type CoursesResponse = CourseOut[];
export type TracksResponse = TrackOut[];
export type UnitsResponse = UnitOut[];
export type LessonsResponse = LessonTrackOut[];
export type SkillsResponse = SkillOut[];
export type LevelsResponse = LevelOut[];
export type ThemesResponse = ThemeOut[];
