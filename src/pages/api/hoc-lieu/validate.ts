import type { APIRoute } from 'astro';
import {
  validateSkillCodes,
  validateThemeCodes,
  validateLevelCode,
  getSkillByCode,
  getThemeByCode,
  getLevelByCode,
} from '../../../lib/hoc-lieu-constants';

/**
 * POST /api/hoc-lieu/validate
 * Validates học liệu data before upload
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { level, skills, themes } = body;

    const errors: string[] = [];
    const warnings: string[] = [];
    const validatedData: any = {};

    // Validate level
    if (!level) {
      errors.push('Level là bắt buộc');
    } else if (!validateLevelCode(level)) {
      errors.push(`Level không hợp lệ: ${level}. Chọn: lam_quen, tien_bo, thu_thach`);
    } else {
      validatedData.level = getLevelByCode(level);
    }

    // Validate skills
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      errors.push('Phải chọn ít nhất 1 kỹ năng');
    } else {
      const skillValidation = validateSkillCodes(skills);
      if (!skillValidation.valid) {
        errors.push(`Mã kỹ năng không hợp lệ: ${skillValidation.invalid.join(', ')}`);
      } else {
        validatedData.skills = skills.map(code => getSkillByCode(code));
      }
    }

    // Validate themes
    if (!themes || !Array.isArray(themes) || themes.length === 0) {
      errors.push('Phải chọn ít nhất 1 chủ đề');
    } else {
      const themeValidation = validateThemeCodes(themes);
      if (!themeValidation.valid) {
        errors.push(`Mã chủ đề không hợp lệ: ${themeValidation.invalid.join(', ')}`);
      } else {
        validatedData.themes = themes.map(code => getThemeByCode(code));
      }
    }

    // Warnings for best practices
    if (skills && skills.length > 5) {
      warnings.push('Nên chọn tối đa 5 kỹ năng để game tập trung hơn');
    }

    if (themes && themes.length > 3) {
      warnings.push('Nên chọn tối đa 3 chủ đề để game nhất quán');
    }

    const valid = errors.length === 0;

    return new Response(JSON.stringify({
      valid,
      errors,
      warnings,
      validatedData: valid ? validatedData : null,
    }), {
      status: valid ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(JSON.stringify({
      valid: false,
      errors: ['Lỗi server khi validate dữ liệu'],
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};