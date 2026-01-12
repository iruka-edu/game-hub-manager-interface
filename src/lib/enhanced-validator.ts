import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import manifestSchema from '../../schema/manifest.schema.json';
import { constructFileUrl } from './storage-path';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  manifest?: any;
}

interface ValidationRule {
  field: string;
  check: (value: any, manifest: any) => {
    valid: boolean;
    error?: string;
    warning?: string;
    suggestion?: string;
  };
}

export class EnhancedValidator {
  private ajv: Ajv;
  private customRules: ValidationRule[];

  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);
    
    // Add custom format for Unicode pattern (since Ajv doesn't support \p{} in browser)
    this.ajv.addFormat('safe-unicode', {
      validate: (str: string) => {
        // Check for control characters, surrogates, and symbols (emojis)
        const controlChars = /[\u0000-\u001F\u007F-\u009F]/;
        const surrogates = /[\uD800-\uDFFF]/;
        const symbols = /[\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF]/; // Common emoji ranges
        
        return !controlChars.test(str) && !surrogates.test(str) && !symbols.test(str);
      }
    });

    this.customRules = [
      {
        field: 'id',
        check: (value: string) => {
          if (!value.startsWith('com.iruka.')) {
            return {
              valid: false,
              error: 'ID phải bắt đầu với "com.iruka."',
              suggestion: 'Sử dụng format: com.iruka.ten-game-cua-ban'
            };
          }

          const slug = value.replace('com.iruka.', '');
          if (slug.length < 3 || slug.length > 48) {
            return {
              valid: false,
              error: 'Slug phải có độ dài 3-48 ký tự',
              suggestion: 'Ví dụ: com.iruka.bubbles-game'
            };
          }

          if (slug.includes('--')) {
            return {
              valid: false,
              error: 'Không được có hai dấu gạch ngang liền nhau (--)',
              suggestion: 'Sử dụng một dấu gạch ngang: com.iruka.memory-match'
            };
          }

          if (slug.includes('_')) {
            return {
              valid: false,
              error: 'Không được sử dụng dấu gạch dưới (_)',
              suggestion: 'Sử dụng dấu gạch ngang (-): com.iruka.number-ninja'
            };
          }

          return { valid: true };
        }
      },
      {
        field: 'title',
        check: (value: string) => {
          // Check for leading/trailing spaces
          if (value !== value.trim()) {
            return {
              valid: false,
              error: 'Tên game không được có khoảng trắng ở đầu hoặc cuối',
              suggestion: `Sử dụng: "${value.trim()}"`
            };
          }

          // Check for all caps
          if (value === value.toUpperCase() && value.length > 1) {
            return {
              valid: false,
              error: 'Tên game không được viết toàn chữ HOA',
              suggestion: `Sử dụng Title Case: "${this.toTitleCase(value)}"`
            };
          }

          // Check for emojis and special characters
          const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
          if (emojiRegex.test(value)) {
            return {
              valid: false,
              error: 'Tên game không được chứa emoji',
              suggestion: 'Sử dụng chữ cái và số thông thường'
            };
          }

          // Suggest Title Case if not already
          const titleCase = this.toTitleCase(value);
          if (value !== titleCase && value.toLowerCase() === value) {
            return {
              valid: true,
              suggestion: `Gợi ý Title Case: "${titleCase}"`
            };
          }

          return { valid: true };
        }
      },
      {
        field: 'version',
        check: (value: string, manifest: any) => {
          // Check for prerelease in production
          if (value.includes('-') || value.includes('+')) {
            return {
              valid: true,
              warning: 'Phiên bản có prerelease/build metadata. Khuyến nghị sử dụng phiên bản stable cho production.',
              suggestion: 'Ví dụ: "1.0.0" thay vì "1.0.0-beta.1"'
            };
          }

          // Check for 0.x.x versions
          if (value.startsWith('0.')) {
            return {
              valid: true,
              warning: 'Phiên bản 0.x.x cho thấy game đang trong giai đoạn phát triển.',
              suggestion: 'Cân nhắc sử dụng phiên bản 1.0.0+ cho production'
            };
          }

          return { valid: true };
        }
      },
      {
        field: 'entryUrl',
        check: (value: string, manifest: any) => {
          if (!value.includes(manifest.id)) {
            return {
              valid: false,
              error: 'Entry URL phải chứa ID của game',
              suggestion: `URL phải chứa: /games/${manifest.id}/${manifest.version}/index.html`
            };
          }

          if (!value.includes(manifest.version)) {
            return {
              valid: false,
              error: 'Entry URL phải chứa version của game',
              suggestion: `URL phải chứa: /games/${manifest.id}/${manifest.version}/index.html`
            };
          }

          if (!value.endsWith('/index.html')) {
            return {
              valid: false,
              error: 'Entry URL phải kết thúc bằng /index.html',
              suggestion: `Sử dụng: ${value.replace(/\/[^\/]*$/, '/index.html')}`
            };
          }

          return { valid: true };
        }
      },
      {
        field: 'capabilities',
        check: (value: string[]) => {
          if (!Array.isArray(value)) return { valid: true };

          const validCapabilities = ['score', 'save-progress', 'levels', 'hints', 'audio', 'telemetry', 'leaderboard'];
          const invalid = value.filter(cap => !validCapabilities.includes(cap));
          
          if (invalid.length > 0) {
            return {
              valid: false,
              error: `Capabilities không hợp lệ: ${invalid.join(', ')}`,
              suggestion: `Chỉ sử dụng: ${validCapabilities.join(', ')}`
            };
          }

          // Suggest common capabilities if empty
          if (value.length === 0) {
            return {
              valid: true,
              suggestion: 'Gợi ý thêm capabilities: ["score", "audio"] cho game cơ bản'
            };
          }

          return { valid: true };
        }
      }
    ];
  }

  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  validateManifest(manifestContent: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Parse JSON
      const manifest = JSON.parse(manifestContent);
      result.manifest = manifest;

      // Schema validation
      const validate = this.ajv.compile(manifestSchema);
      const schemaValid = validate(manifest);

      if (!schemaValid && validate.errors) {
        validate.errors.forEach(error => {
          const field = error.instancePath.replace('/', '') || error.params?.missingProperty || 'root';
          let message = `${field}: ${error.message}`;
          
          // Enhanced error messages
          if (error.keyword === 'pattern') {
            if (field === 'id') {
              message = 'ID không đúng format com.iruka.<slug> với kebab-case';
            } else if (field === 'title') {
              message = 'Tên game chứa ký tự không hợp lệ hoặc format không đúng';
            } else if (field === 'version') {
              message = 'Version không đúng format Semantic Versioning (SemVer)';
            }
          }
          
          result.errors.push(message);
        });
        result.valid = false;
      }

      // Custom rules validation
      this.customRules.forEach(rule => {
        if (manifest[rule.field] !== undefined) {
          const checkResult = rule.check(manifest[rule.field], manifest);
          
          if (!checkResult.valid && checkResult.error) {
            result.errors.push(`${rule.field}: ${checkResult.error}`);
            result.valid = false;
          }
          
          if (checkResult.warning) {
            result.warnings.push(`${rule.field}: ${checkResult.warning}`);
          }
          
          if (checkResult.suggestion) {
            result.suggestions.push(`${rule.field}: ${checkResult.suggestion}`);
          }
        }
      });

      // Additional cross-field validations
      if (manifest.iconUrl && manifest.id) {
        if (!manifest.iconUrl.includes(manifest.id)) {
          result.suggestions.push('iconUrl: Khuyến nghị đặt icon trong thư mục game để dễ quản lý');
        }
      }

    } catch (parseError: any) {
      result.valid = false;
      result.errors.push(`JSON không hợp lệ: ${parseError.message}`);
    }

    return result;
  }

  generateManifestTemplate(gameId?: string, title?: string): string {
    const id = gameId || 'com.iruka.my-awesome-game';
    const gameTitle = title || 'My Awesome Game';
    const version = '1.0.0';
    
    return JSON.stringify({
      id,
      title: gameTitle,
      version,
      runtime: 'iframe-html',
      entryUrl: constructFileUrl(`games/${id}/${version}`, 'index.html', 'https://storage.googleapis.com/iruka-edu-mini-game'),
      iconUrl: constructFileUrl(`games/${id}`, 'icon.png', 'https://storage.googleapis.com/iruka-edu-mini-game'),
      capabilities: ['score', 'audio'],
      minHubVersion: '1.0.0',
      disabled: false
    }, null, 2);
  }

  getValidationChecklist(): Array<{category: string, items: Array<{rule: string, description: string}>}> {
    return [
      {
        category: 'Định danh Game (ID)',
        items: [
          { rule: 'Format', description: 'Phải theo format com.iruka.<slug>' },
          { rule: 'Slug', description: 'Chỉ chữ thường, số, dấu gạch ngang (3-48 ký tự)' },
          { rule: 'Kebab-case', description: 'Không dấu gạch dưới, không hai dấu -- liền nhau' },
          { rule: 'Độ dài', description: 'Tổng ID ≤ 64 ký tự' }
        ]
      },
      {
        category: 'Tên hiển thị (Title)',
        items: [
          { rule: 'Độ dài', description: '3-40 ký tự' },
          { rule: 'Ký tự', description: 'Chữ cái, số, không emoji, không ký tự điều khiển' },
          { rule: 'Format', description: 'Không khoảng trắng đầu/cuối, không toàn chữ HOA' },
          { rule: 'Style', description: 'Khuyến nghị Title Case hoặc Sentence case' }
        ]
      },
      {
        category: 'Phiên bản (Version)',
        items: [
          { rule: 'SemVer', description: 'Theo chuẩn Semantic Versioning (x.y.z)' },
          { rule: 'Production', description: 'Khuyến nghị không có prerelease cho production' },
          { rule: 'Stable', description: 'Cân nhắc sử dụng 1.0.0+ thay vì 0.x.x' }
        ]
      },
      {
        category: 'URLs & Runtime',
        items: [
          { rule: 'Entry URL', description: 'HTTPS, khớp ID + version, kết thúc /index.html' },
          { rule: 'Icon URL', description: 'HTTPS, file ảnh hợp lệ (PNG, JPG, WebP, SVG)' },
          { rule: 'Runtime', description: 'iframe-html hoặc esm-module' }
        ]
      },
      {
        category: 'Tùy chọn',
        items: [
          { rule: 'Capabilities', description: 'Chỉ sử dụng giá trị được phép' },
          { rule: 'Min Hub Version', description: 'Phiên bản Hub tối thiểu cần thiết' },
          { rule: 'Disabled', description: 'Boolean để tạm thời vô hiệu hóa game' }
        ]
      }
    ];
  }
}

// Export singleton instance
export const enhancedValidator = new EnhancedValidator();