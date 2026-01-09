import type { APIRoute } from 'astro';
import {
  LEVELS,
  LEVEL_OPTIONS,
  MATH_SKILLS_3_4,
  SKILL_OPTIONS,
  SKILL_GROUPS,
  THEMES,
  THEME_OPTIONS,
  THEME_GROUPS,
  MATH_LESSONS_3_4,
  LESSON_OPTIONS,
} from '../../../lib/hoc-lieu-constants';

/**
 * GET /api/hoc-lieu
 * Returns all học liệu data for upload forms
 */
export const GET: APIRoute = async ({ url }) => {
  const type = url.searchParams.get('type');

  try {
    // Return specific type if requested
    if (type) {
      switch (type) {
        case 'levels':
          return new Response(JSON.stringify({
            levels: LEVELS,
            options: LEVEL_OPTIONS,
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });

        case 'skills':
          return new Response(JSON.stringify({
            skills: MATH_SKILLS_3_4,
            options: SKILL_OPTIONS,
            groups: SKILL_GROUPS,
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });

        case 'themes':
          return new Response(JSON.stringify({
            themes: THEMES,
            options: THEME_OPTIONS,
            groups: THEME_GROUPS,
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });

        case 'lessons':
          return new Response(JSON.stringify({
            lessons: MATH_LESSONS_3_4,
            options: LESSON_OPTIONS,
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });

        default:
          return new Response(JSON.stringify({
            error: `Unknown type: ${type}`,
            validTypes: ['levels', 'skills', 'themes', 'lessons'],
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
      }
    }

    // Return all data
    return new Response(JSON.stringify({
      levels: {
        data: LEVELS,
        options: LEVEL_OPTIONS,
      },
      skills: {
        data: MATH_SKILLS_3_4,
        options: SKILL_OPTIONS,
        groups: SKILL_GROUPS,
      },
      themes: {
        data: THEMES,
        options: THEME_OPTIONS,
        groups: THEME_GROUPS,
      },
      lessons: {
        data: MATH_LESSONS_3_4,
        options: LESSON_OPTIONS,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Hoc lieu API error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};