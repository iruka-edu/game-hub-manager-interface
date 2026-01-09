#!/usr/bin/env node
/**
 * Test script for upload flow
 * Tests the complete upload process: metadata → file upload → GCS → server update
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  duration?: number;
}

class UploadFlowTester {
  private baseUrl: string;
  private authToken?: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string = 'http://localhost:4321') {
    this.baseUrl = baseUrl;
  }

  /**
   * Add test result
   */
  private addResult(step: string, success: boolean, message: string, duration?: number) {
    this.results.push({ step, success, message, duration });
    const status = success ? '✅' : '❌';
    const time = duration ? ` (${duration}ms)` : '';
    console.log(`${status} ${step}: ${message}${time}`);
  }

  /**
   * Test authentication
   */
  async testAuth(): Promise<boolean> {
    const start = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'dev@iruka.com',
          password: 'dev123'
        }),
      });

      const duration = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        this.authToken = data.token;
        this.addResult('Authentication', true, 'Login successful', duration);
        return true;
      } else {
        this.addResult('Authentication', false, `Login failed: ${response.status}`, duration);
        return false;
      }
    } catch (error) {
      const duration = Date.now() - start;
      this.addResult('Authentication', false, `Login error: ${error.message}`, duration);
      return false;
    }
  }

  /**
   * Test game creation
   */
  async testGameCreation(): Promise<string | null> {
    const start = Date.now();
    
    try {
      const gameData = {
        title: 'Test Upload Game',
        gameId: 'test-upload-game-' + Date.now(),
        subject: 'math',
        grade: '1',
        gameType: 'quiz',
        description: 'Test game for upload flow validation',
      };

      const response = await fetch(`${this.baseUrl}/api/games/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(gameData),
      });

      const duration = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        this.addResult('Game Creation', true, `Game created: ${data.game._id}`, duration);
        return data.game._id;
      } else {
        const error = await response.text();
        this.addResult('Game Creation', false, `Creation failed: ${error}`, duration);
        return null;
      }
    } catch (error) {
      const duration = Date.now() - start;
      this.addResult('Game Creation', false, `Creation error: ${error.message}`, duration);
      return null;
    }
  }

  /**
   * Create test ZIP file
   */
  createTestZip(): Buffer {
    // Create a simple test ZIP with required files
    const JSZip = require('jszip');
    const zip = new JSZip();

    // Add index.html
    zip.file('index.html', `
<!DOCTYPE html>
<html>
<head>
    <title>Test Game</title>
</head>
<body>
    <h1>Test Game</h1>
    <p>This is a test game for upload validation.</p>
</body>
</html>
    `);

    // Add manifest.json
    zip.file('manifest.json', JSON.stringify({
      id: 'test-upload-game',
      version: '1.0.0',
      title: 'Test Upload Game',
      runtime: 'HTML5',
      entryPoint: 'index.html'
    }, null, 2));

    // Add some additional files
    zip.file('style.css', 'body { font-family: Arial, sans-serif; }');
    zip.file('script.js', 'console.log("Test game loaded");');

    return zip.generateNodeStream({ type: 'nodebuffer', compression: 'DEFLATE' });
  }

  /**
   * Test file upload
   */
  async testFileUpload(gameId: string): Promise<boolean> {
    const start = Date.now();
    
    try {
      // Create test ZIP
      const zipBuffer = this.createTestZip();
      
      // Create FormData
      const formData = new FormData();
      const blob = new Blob([zipBuffer], { type: 'application/zip' });
      formData.append('file', blob, 'test-game.zip');
      formData.append('gameId', 'test-upload-game-' + Date.now());
      formData.append('version', '1.0.0');

      const response = await fetch(`${this.baseUrl}/api/games/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: formData,
      });

      const duration = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        this.addResult('File Upload', true, `Upload successful: ${data.data.storagePath}`, duration);
        return true;
      } else {
        const error = await response.text();
        this.addResult('File Upload', false, `Upload failed: ${error}`, duration);
        return false;
      }
    } catch (error) {
      const duration = Date.now() - start;
      this.addResult('File Upload', false, `Upload error: ${error.message}`, duration);
      return false;
    }
  }

  /**
   * Test metadata update
   */
  async testMetadataUpdate(gameId: string): Promise<boolean> {
    const start = Date.now();
    
    try {
      const metadata = {
        metadata: {
          runtime: 'HTML5',
          entryPoint: 'index.html',
          skills: ['problem-solving', 'logic'],
          themes: ['mathematics', 'education'],
          level: 'beginner',
          linkGithub: 'https://github.com/test/test-game',
        },
      };

      const response = await fetch(`${this.baseUrl}/api/games/${gameId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(metadata),
      });

      const duration = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        this.addResult('Metadata Update', true, `Update successful: ${data.data.fieldsUpdated.length} fields`, duration);
        return true;
      } else {
        const error = await response.text();
        this.addResult('Metadata Update', false, `Update failed: ${error}`, duration);
        return false;
      }
    } catch (error) {
      const duration = Date.now() - start;
      this.addResult('Metadata Update', false, `Update error: ${error.message}`, duration);
      return false;
    }
  }

  /**
   * Run complete upload flow test
   */
  async runTest(): Promise<void> {
    console.log('🚀 Starting Upload Flow Test');
    console.log('='.repeat(50));

    const startTime = Date.now();

    // Step 1: Authentication
    const authSuccess = await this.testAuth();
    if (!authSuccess) {
      console.log('\n❌ Test failed at authentication step');
      return;
    }

    // Step 2: Game Creation
    const gameId = await this.testGameCreation();
    if (!gameId) {
      console.log('\n❌ Test failed at game creation step');
      return;
    }

    // Step 3: File Upload
    const uploadSuccess = await this.testFileUpload(gameId);
    if (!uploadSuccess) {
      console.log('\n❌ Test failed at file upload step');
      return;
    }

    // Step 4: Metadata Update
    const updateSuccess = await this.testMetadataUpdate(gameId);
    if (!updateSuccess) {
      console.log('\n❌ Test failed at metadata update step');
      return;
    }

    const totalTime = Date.now() - startTime;

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary');
    console.log('='.repeat(50));
    
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    
    console.log(`✅ Passed: ${successCount}/${totalCount}`);
    console.log(`⏱️  Total time: ${totalTime}ms`);
    
    if (successCount === totalCount) {
      console.log('\n🎉 All tests passed! Upload flow is working correctly.');
    } else {
      console.log('\n❌ Some tests failed. Please check the implementation.');
    }

    // Detailed results
    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const time = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`  ${status} ${result.step}: ${result.message}${time}`);
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'http://localhost:4321';

  console.log(`Testing upload flow at: ${baseUrl}`);
  
  const tester = new UploadFlowTester(baseUrl);
  await tester.runTest();
}

// Run the test
main().catch(console.error);