#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class GameValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);
    
    // Load schema
    const schemaPath = path.join(__dirname, '../schema/manifest.schema.json');
    this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    this.validate = this.ajv.compile(this.schema);
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logBold(message, color = 'white') {
    console.log(`${colors.bold}${colors[color]}${message}${colors.reset}`);
  }

  validateGameDirectory(gameDir) {
    this.logBold(`\n🎮 Validating game: ${path.basename(gameDir)}`, 'cyan');
    
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      files: {
        hasIndex: false,
        hasManifest: false,
        manifestPath: null
      }
    };

    // Check required files
    const indexPath = path.join(gameDir, 'index.html');
    const manifestPath = path.join(gameDir, 'manifest.json');

    results.files.hasIndex = fs.existsSync(indexPath);
    results.files.hasManifest = fs.existsSync(manifestPath);
    results.files.manifestPath = manifestPath;

    if (!results.files.hasIndex) {
      results.errors.push("❌ Missing 'index.html' - required entry point");
      results.valid = false;
    } else {
      this.log("✅ Found index.html", 'green');
    }

    if (!results.files.hasManifest) {
      results.errors.push("❌ Missing 'manifest.json' - required metadata file");
      results.valid = false;
    } else {
      this.log("✅ Found manifest.json", 'green');
      
      // Validate manifest content
      try {
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifestResult = this.validateManifest(manifestContent);
        
        results.errors.push(...manifestResult.errors);
        results.warnings.push(...manifestResult.warnings);
        results.suggestions.push(...manifestResult.suggestions);
        
        if (!manifestResult.valid) {
          results.valid = false;
        }
      } catch (error) {
        results.errors.push(`❌ Cannot read manifest.json: ${error.message}`);
        results.valid = false;
      }
    }

    return results;
  }

  validateManifest(content) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      const manifest = JSON.parse(content);

      // Schema validation
      const schemaValid = this.validate(manifest);
      if (!schemaValid && this.validate.errors) {
        this.validate.errors.forEach(error => {
          const field = error.instancePath.replace('/', '') || error.params?.missingProperty || 'root';
          let message = `❌ ${field}: ${error.message}`;
          
          // Enhanced error messages
          if (error.keyword === 'pattern') {
            if (field === 'id') {
              message = '❌ ID không đúng format com.iruka.<slug> với kebab-case';
            } else if (field === 'title') {
              message = '❌ Tên game chứa ký tự không hợp lệ hoặc format không đúng';
            } else if (field === 'version') {
              message = '❌ Version không đúng format Semantic Versioning (SemVer)';
            }
          }
          
          results.errors.push(message);
        });
        results.valid = false;
      }

      // Custom validations
      this.performCustomValidations(manifest, results);

    } catch (parseError) {
      results.valid = false;
      results.errors.push(`❌ JSON không hợp lệ: ${parseError.message}`);
    }

    return results;
  }

  performCustomValidations(manifest, results) {
    // ID validation
    if (manifest.id) {
      if (!manifest.id.startsWith('com.iruka.')) {
        results.errors.push("❌ ID phải bắt đầu với 'com.iruka.'");
        results.suggestions.push("💡 Ví dụ: com.iruka.my-awesome-game");
      } else {
        const slug = manifest.id.replace('com.iruka.', '');
        if (slug.includes('--')) {
          results.errors.push("❌ ID không được có hai dấu gạch ngang liền nhau");
        }
        if (slug.includes('_')) {
          results.errors.push("❌ ID không được có dấu gạch dưới");
          results.suggestions.push("💡 Sử dụng dấu gạch ngang: com.iruka.memory-match");
        }
      }
    }

    // Title validation
    if (manifest.title) {
      if (manifest.title !== manifest.title.trim()) {
        results.errors.push("❌ Tên game không được có khoảng trắng ở đầu hoặc cuối");
        results.suggestions.push(`💡 Sử dụng: "${manifest.title.trim()}"`);
      }
      
      if (manifest.title === manifest.title.toUpperCase() && manifest.title.length > 1) {
        results.errors.push("❌ Tên game không được viết toàn chữ HOA");
        results.suggestions.push(`💡 Gợi ý Title Case: "${this.toTitleCase(manifest.title)}"`);
      }

      // Check for emojis
      const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/gu;
      if (emojiRegex.test(manifest.title)) {
        results.errors.push("❌ Tên game không được chứa emoji");
      }
    }

    // Version warnings
    if (manifest.version) {
      if (manifest.version.includes('-') || manifest.version.includes('+')) {
        results.warnings.push("⚠️  Version có prerelease/build metadata. Khuyến nghị stable cho production");
      }
      if (manifest.version.startsWith('0.')) {
        results.warnings.push("⚠️  Version 0.x.x cho thấy game đang phát triển");
        results.suggestions.push("💡 Cân nhắc 1.0.0+ cho production");
      }
    }

    // Entry URL validation
    if (manifest.entryUrl && manifest.id && manifest.version) {
      if (!manifest.entryUrl.includes(manifest.id)) {
        results.errors.push("❌ Entry URL phải chứa ID của game");
      }
      if (!manifest.entryUrl.includes(manifest.version)) {
        results.errors.push("❌ Entry URL phải chứa version của game");
      }
    }

    // Capabilities validation
    if (manifest.capabilities && Array.isArray(manifest.capabilities)) {
      const validCaps = ['score', 'save-progress', 'levels', 'hints', 'audio', 'telemetry', 'leaderboard'];
      const invalid = manifest.capabilities.filter(cap => !validCaps.includes(cap));
      if (invalid.length > 0) {
        results.errors.push(`❌ Capabilities không hợp lệ: ${invalid.join(', ')}`);
        results.suggestions.push(`💡 Chỉ sử dụng: ${validCaps.join(', ')}`);
      }
    }
  }

  toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  printResults(results, gameName) {
    if (results.valid) {
      this.logBold(`\n✅ ${gameName} - PASS`, 'green');
    } else {
      this.logBold(`\n❌ ${gameName} - FAIL`, 'red');
    }

    if (results.errors.length > 0) {
      this.logBold('\n🚨 Lỗi cần sửa:', 'red');
      results.errors.forEach(error => this.log(`  ${error}`, 'red'));
    }

    if (results.warnings.length > 0) {
      this.logBold('\n⚠️  Cảnh báo:', 'yellow');
      results.warnings.forEach(warning => this.log(`  ${warning}`, 'yellow'));
    }

    if (results.suggestions.length > 0) {
      this.logBold('\n💡 Gợi ý cải thiện:', 'blue');
      results.suggestions.forEach(suggestion => this.log(`  ${suggestion}`, 'blue'));
    }
  }

  printChecklist() {
    this.logBold('\n📋 CHECKLIST VALIDATION', 'magenta');
    
    const checklist = [
      {
        category: '🆔 Định danh Game (ID)',
        items: [
          'Format: com.iruka.<slug>',
          'Slug: chỉ chữ thường, số, dấu gạch ngang (3-48 ký tự)',
          'Kebab-case: không dấu gạch dưới, không hai dấu -- liền nhau',
          'Độ dài: tổng ID ≤ 64 ký tự'
        ]
      },
      {
        category: '📝 Tên hiển thị (Title)',
        items: [
          'Độ dài: 3-40 ký tự',
          'Ký tự: chữ cái, số, không emoji, không ký tự điều khiển',
          'Format: không khoảng trắng đầu/cuối, không toàn chữ HOA',
          'Style: khuyến nghị Title Case hoặc Sentence case'
        ]
      },
      {
        category: '🔢 Phiên bản (Version)',
        items: [
          'SemVer: theo chuẩn Semantic Versioning (x.y.z)',
          'Production: khuyến nghị không có prerelease',
          'Stable: cân nhắc sử dụng 1.0.0+ thay vì 0.x.x'
        ]
      },
      {
        category: '🔗 URLs & Runtime',
        items: [
          'Entry URL: HTTPS, khớp ID + version, kết thúc /index.html',
          'Icon URL: HTTPS, file ảnh hợp lệ (PNG, JPG, WebP, SVG)',
          'Runtime: iframe-html hoặc esm-module'
        ]
      }
    ];

    checklist.forEach(section => {
      this.logBold(`\n${section.category}`, 'cyan');
      section.items.forEach(item => this.log(`  • ${item}`, 'white'));
    });
  }

  generateTemplate(gameId, title) {
    const id = gameId || 'com.iruka.my-awesome-game';
    const gameTitle = title || 'My Awesome Game';
    const version = '1.0.0';
    
    return JSON.stringify({
      id,
      title: gameTitle,
      version,
      runtime: 'iframe-html',
      entryUrl: `https://storage.googleapis.com/iruka-edu-mini-game/games/${id}/${version}/index.html`,
      iconUrl: `https://storage.googleapis.com/iruka-edu-mini-game/games/${id}/icon.png`,
      capabilities: ['score', 'audio'],
      minHubVersion: '1.0.0',
      disabled: false
    }, null, 2);
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const validator = new GameValidator();

  if (args.length === 0) {
    validator.logBold('🎮 Iruka Game Validator', 'magenta');
    validator.log('\nUsage:');
    validator.log('  pnpm iruka-game:validate <game-directory>  # Validate specific game');
    validator.log('  pnpm iruka-game:validate --checklist      # Show validation checklist');
    validator.log('  pnpm iruka-game:validate --template       # Generate manifest template');
    validator.log('\nExamples:');
    validator.log('  pnpm iruka-game:validate ./dist');
    validator.log('  pnpm iruka-game:validate ./games/bubbles-game');
    return;
  }

  if (args[0] === '--checklist') {
    validator.printChecklist();
    return;
  }

  if (args[0] === '--template') {
    const gameId = args[1];
    const title = args[2];
    validator.logBold('📄 Manifest Template:', 'green');
    console.log(validator.generateTemplate(gameId, title));
    return;
  }

  const gameDir = args[0];
  
  if (!fs.existsSync(gameDir)) {
    validator.log(`❌ Directory not found: ${gameDir}`, 'red');
    process.exit(1);
  }

  if (!fs.statSync(gameDir).isDirectory()) {
    validator.log(`❌ Not a directory: ${gameDir}`, 'red');
    process.exit(1);
  }

  const results = validator.validateGameDirectory(gameDir);
  validator.printResults(results, path.basename(gameDir));

  if (!results.valid) {
    validator.log('\n💡 Run with --checklist to see full validation rules', 'blue');
    process.exit(1);
  }

  validator.logBold('\n🎉 Game is ready for upload!', 'green');
}

main();