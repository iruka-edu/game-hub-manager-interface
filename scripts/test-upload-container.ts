#!/usr/bin/env node
/**
 * Test script for GameUploadContainer component
 * Validates TypeScript compilation and component functionality
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  duration?: number;
}

class UploadContainerTester {
  private results: TestResult[] = [];

  /**
   * Add test result
   */
  private addResult(test: string, passed: boolean, message: string, duration?: number) {
    this.results.push({ test, passed, message, duration });
    const status = passed ? '✅' : '❌';
    const time = duration ? ` (${duration}ms)` : '';
    console.log(`${status} ${test}: ${message}${time}`);
  }

  /**
   * Test TypeScript compilation
   */
  async testTypeScriptCompilation(): Promise<boolean> {
    const start = Date.now();
    
    try {
      // Test specific file compilation
      execSync('npx tsc --noEmit src/components/upload/GameUploadContainer.astro', {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const duration = Date.now() - start;
      this.addResult('TypeScript Compilation', true, 'No type errors found', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - start;
      this.addResult('TypeScript Compilation', false, `Type errors: ${error.message}`, duration);
      return false;
    }
  }

  /**
   * Test file structure and imports
   */
  async testFileStructure(): Promise<boolean> {
    const start = Date.now();
    
    try {
      const filePath = join(process.cwd(), 'src/components/upload/GameUploadContainer.astro');
      const content = readFileSync(filePath, 'utf8');
      
      // Check for required imports
      const requiredImports = [
        'GameMetadata',
        'UploadConfig',
        'UploadManager'
      ];
      
      const missingImports = requiredImports.filter(imp => !content.includes(imp));
      
      if (missingImports.length > 0) {
        const duration = Date.now() - start;
        this.addResult('File Structure', false, `Missing imports: ${missingImports.join(', ')}`, duration);
        return false;
      }
      
      // Check for class definition
      if (!content.includes('class GameUploadContainer')) {
        const duration = Date.now() - start;
        this.addResult('File Structure', false, 'GameUploadContainer class not found', duration);
        return false;
      }
      
      // Check for required methods
      const requiredMethods = [
        'initializeElements',
        'setupEventListeners',
        'handleFileSelected',
        'handleStartUpload',
        'handleReset'
      ];
      
      const missingMethods = requiredMethods.filter(method => !content.includes(method));
      
      if (missingMethods.length > 0) {
        const duration = Date.now() - start;
        this.addResult('File Structure', false, `Missing methods: ${missingMethods.join(', ')}`, duration);
        return false;
      }
      
      const duration = Date.now() - start;
      this.addResult('File Structure', true, 'All required imports and methods found', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - start;
      this.addResult('File Structure', false, `File read error: ${error.message}`, duration);
      return false;
    }
  }

  /**
   * Test type definitions
   */
  async testTypeDefinitions(): Promise<boolean> {
    const start = Date.now();
    
    try {
      const typesPath = join(process.cwd(), 'src/types/upload.ts');
      const content = readFileSync(typesPath, 'utf8');
      
      // Check for required type definitions
      const requiredTypes = [
        'GameMetadata',
        'UploadConfig',
        'UploadStage',
        'ValidationResult',
        'ManifestData'
      ];
      
      const missingTypes = requiredTypes.filter(type => !content.includes(`interface ${type}`) && !content.includes(`type ${type}`));
      
      if (missingTypes.length > 0) {
        const duration = Date.now() - start;
        this.addResult('Type Definitions', false, `Missing types: ${missingTypes.join(', ')}`, duration);
        return false;
      }
      
      const duration = Date.now() - start;
      this.addResult('Type Definitions', true, 'All required types found', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - start;
      this.addResult('Type Definitions', false, `Types file error: ${error.message}`, duration);
      return false;
    }
  }

  /**
   * Test UploadManager dependency
   */
  async testUploadManager(): Promise<boolean> {
    const start = Date.now();
    
    try {
      const managerPath = join(process.cwd(), 'src/lib/upload/upload-manager.ts');
      const content = readFileSync(managerPath, 'utf8');
      
      // Check for UploadManager class
      if (!content.includes('export class UploadManager')) {
        const duration = Date.now() - start;
        this.addResult('UploadManager', false, 'UploadManager class not found', duration);
        return false;
      }
      
      // Check for required methods
      const requiredMethods = [
        'subscribe',
        'setFile',
        'updateManifest',
        'upload',
        'reset'
      ];
      
      const missingMethods = requiredMethods.filter(method => !content.includes(method));
      
      if (missingMethods.length > 0) {
        const duration = Date.now() - start;
        this.addResult('UploadManager', false, `Missing methods: ${missingMethods.join(', ')}`, duration);
        return false;
      }
      
      const duration = Date.now() - start;
      this.addResult('UploadManager', true, 'UploadManager implementation found', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - start;
      this.addResult('UploadManager', false, `UploadManager error: ${error.message}`, duration);
      return false;
    }
  }

  /**
   * Test component HTML structure
   */
  async testHTMLStructure(): Promise<boolean> {
    const start = Date.now();
    
    try {
      const filePath = join(process.cwd(), 'src/components/upload/GameUploadContainer.astro');
      const content = readFileSync(filePath, 'utf8');
      
      // Check for required HTML elements
      const requiredElements = [
        'class="game-upload-container"',
        'id="startUpload"',
        'id="resetUpload"',
        'class="progress-section"',
        'class="manifest-section"'
      ];
      
      const missingElements = requiredElements.filter(element => !content.includes(element));
      
      if (missingElements.length > 0) {
        const duration = Date.now() - start;
        this.addResult('HTML Structure', false, `Missing elements: ${missingElements.join(', ')}`, duration);
        return false;
      }
      
      const duration = Date.now() - start;
      this.addResult('HTML Structure', true, 'All required HTML elements found', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - start;
      this.addResult('HTML Structure', false, `HTML structure error: ${error.message}`, duration);
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runTests(): Promise<void> {
    console.log('🧪 Testing GameUploadContainer Component');
    console.log('='.repeat(50));

    const startTime = Date.now();

    // Run tests
    await this.testFileStructure();
    await this.testTypeDefinitions();
    await this.testUploadManager();
    await this.testHTMLStructure();
    await this.testTypeScriptCompilation();

    const totalTime = Date.now() - startTime;

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary');
    console.log('='.repeat(50));
    
    const passedCount = this.results.filter(r => r.passed).length;
    const totalCount = this.results.length;
    
    console.log(`✅ Passed: ${passedCount}/${totalCount}`);
    console.log(`⏱️  Total time: ${totalTime}ms`);
    
    if (passedCount === totalCount) {
      console.log('\n🎉 All tests passed! GameUploadContainer is ready for use.');
    } else {
      console.log('\n❌ Some tests failed. Please check the implementation.');
      process.exit(1);
    }

    // Detailed results
    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const time = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`  ${status} ${result.test}: ${result.message}${time}`);
    });
  }
}

async function main() {
  const tester = new UploadContainerTester();
  await tester.runTests();
}

// Run the tests
main().catch(console.error);