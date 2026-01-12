import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';

// Mock the GCS functions
vi.mock('../gcs', async () => {
  const actual = await vi.importActual('../gcs');
  return {
    ...actual,
    uploadBufferBatch: vi.fn().mockResolvedValue([
      { success: true, destination: 'games/test/1.0.0/index.html' },
      { success: true, destination: 'games/test/1.0.0/game.js' },
      { success: true, destination: 'games/test/1.0.0/assets/sprite.png' },
    ]),
    CDN_BASE: 'https://storage.googleapis.com/test-bucket',
  };
});

vi.mock('../storage-path', () => ({
  constructFileUrl: vi.fn((storagePath: string, fileName: string, baseUrl: string) => 
    `${baseUrl}/${storagePath}/${fileName}`
  ),
}));

describe('ZIP Upload Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract and upload files from build folder correctly', async () => {
    // Create a test ZIP with build folder structure
    const zip = new JSZip();
    zip.file('build/index.html', '<html><head><title>Test Game</title></head><body><div id="game"></div></body></html>');
    zip.file('build/game.js', 'console.log("Game started");');
    zip.file('build/assets/sprite.png', 'fake-png-data');
    zip.file('build/assets/sounds/music.mp3', 'fake-mp3-data');
    zip.file('src/main.ts', 'source code that should be ignored');
    zip.file('README.md', '# Game Project');

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Import the actual function (this will use our mocked dependencies)
    const { uploadGameFiles } = await import('../gcs');
    
    const result = await uploadGameFiles(zipBuffer, 'games/test/1.0.0', 'test-game.zip');

    expect(result.url).toBe('https://storage.googleapis.com/test-bucket/games/test/1.0.0/index.html');
    expect(result.files).toEqual([
      'index.html',
      'game.js', 
      'assets/sprite.png',
      'assets/sounds/music.mp3'
    ]);
  });

  it('should handle ZIP with index.html at root', async () => {
    // Create a test ZIP with files at root
    const zip = new JSZip();
    zip.file('index.html', '<html><body>Simple Game</body></html>');
    zip.file('main.js', 'console.log("Main script");');
    zip.file('style.css', 'body { margin: 0; }');

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const { uploadGameFiles } = await import('../gcs');
    
    const result = await uploadGameFiles(zipBuffer, 'games/simple/1.0.0', 'simple-game.zip');

    expect(result.files).toEqual([
      'index.html',
      'main.js',
      'style.css'
    ]);
  });

  it('should handle deeply nested structure', async () => {
    // Create a ZIP with deeply nested structure
    const zip = new JSZip();
    zip.file('project/dist/web/index.html', '<html><body>Nested Game</body></html>');
    zip.file('project/dist/web/bundle.js', 'bundled code');
    zip.file('project/dist/web/assets/textures/player.png', 'player texture');
    zip.file('project/src/game.ts', 'source that should be ignored');
    zip.file('project/package.json', '{"name": "game"}');

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const { uploadGameFiles } = await import('../gcs');
    
    const result = await uploadGameFiles(zipBuffer, 'games/nested/1.0.0', 'nested-game.zip');

    expect(result.files).toEqual([
      'index.html',
      'bundle.js',
      'assets/textures/player.png'
    ]);
  });

  it('should throw error when no index.html is found', async () => {
    // Create a ZIP without index.html
    const zip = new JSZip();
    zip.file('game.js', 'console.log("No HTML file");');
    zip.file('README.md', '# Incomplete Game');

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const { uploadGameFiles } = await import('../gcs');
    
    await expect(uploadGameFiles(zipBuffer, 'games/invalid/1.0.0', 'invalid-game.zip'))
      .rejects.toThrow('Không tìm thấy file index.html trong ZIP');
  });
});