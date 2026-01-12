import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';

// Mock the uploadGameFiles function logic for testing
describe('ZIP Root Directory Detection', () => {
  let mockZip: JSZip;

  beforeEach(() => {
    mockZip = new JSZip();
  });

  it('should find index.html at ZIP root', async () => {
    // Create a ZIP with index.html at root
    mockZip.file('index.html', '<html><body>Game</body></html>');
    mockZip.file('game.js', 'console.log("game");');
    mockZip.file('assets/sprite.png', 'fake-image-data');

    const allFiles = Object.keys(mockZip.files);
    
    // Find index.html paths
    const indexHtmlPaths = allFiles.filter(path => 
      path.toLowerCase().endsWith('index.html') && !mockZip.files[path].dir
    );
    
    expect(indexHtmlPaths).toHaveLength(1);
    expect(indexHtmlPaths[0]).toBe('index.html');
    
    // Determine root path
    const indexPath = indexHtmlPaths[0];
    const pathParts = indexPath.split('/');
    const rootPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') + '/' : '';
    
    expect(rootPath).toBe('');
  });

  it('should find index.html in build folder and use build as root', async () => {
    // Create a ZIP with index.html in build folder
    mockZip.file('build/index.html', '<html><body>Game</body></html>');
    mockZip.file('build/game.js', 'console.log("game");');
    mockZip.file('build/assets/sprite.png', 'fake-image-data');
    mockZip.file('README.md', '# Game Project');

    const allFiles = Object.keys(mockZip.files);
    
    // Find index.html paths
    const indexHtmlPaths = allFiles.filter(path => 
      path.toLowerCase().endsWith('index.html') && !mockZip.files[path].dir
    );
    
    expect(indexHtmlPaths).toHaveLength(1);
    expect(indexHtmlPaths[0]).toBe('build/index.html');
    
    // Determine root path
    const indexPath = indexHtmlPaths[0];
    const pathParts = indexPath.split('/');
    const rootPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') + '/' : '';
    
    expect(rootPath).toBe('build/');
  });

  it('should find index.html in nested folder structure', async () => {
    // Create a ZIP with index.html in deeply nested folder
    mockZip.file('project/dist/game/index.html', '<html><body>Game</body></html>');
    mockZip.file('project/dist/game/main.js', 'console.log("game");');
    mockZip.file('project/dist/game/assets/images/sprite.png', 'fake-image-data');
    mockZip.file('project/src/main.ts', 'source code');
    mockZip.file('package.json', '{}');

    const allFiles = Object.keys(mockZip.files);
    
    // Find index.html paths
    const indexHtmlPaths = allFiles.filter(path => 
      path.toLowerCase().endsWith('index.html') && !mockZip.files[path].dir
    );
    
    expect(indexHtmlPaths).toHaveLength(1);
    expect(indexHtmlPaths[0]).toBe('project/dist/game/index.html');
    
    // Determine root path
    const indexPath = indexHtmlPaths[0];
    const pathParts = indexPath.split('/');
    const rootPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') + '/' : '';
    
    expect(rootPath).toBe('project/dist/game/');
  });

  it('should filter files correctly based on root path', async () => {
    // Create a ZIP with mixed structure
    mockZip.file('build/index.html', '<html><body>Game</body></html>');
    mockZip.file('build/game.js', 'console.log("game");');
    mockZip.file('build/assets/sprite.png', 'fake-image-data');
    mockZip.file('src/main.ts', 'source code');
    mockZip.file('README.md', '# Game Project');
    mockZip.file('package.json', '{}');

    const allFiles = Object.keys(mockZip.files);
    const rootPath = 'build/';
    
    // Filter files that should be uploaded (only from root path)
    const filesToUpload = allFiles.filter(path => {
      const zipEntry = mockZip.files[path];
      if (zipEntry.dir) return false;
      if (rootPath && !path.startsWith(rootPath)) return false;
      return true;
    });
    
    expect(filesToUpload).toHaveLength(3);
    expect(filesToUpload).toContain('build/index.html');
    expect(filesToUpload).toContain('build/game.js');
    expect(filesToUpload).toContain('build/assets/sprite.png');
    expect(filesToUpload).not.toContain('src/main.ts');
    expect(filesToUpload).not.toContain('README.md');
    expect(filesToUpload).not.toContain('package.json');
  });

  it('should calculate correct relative paths after removing root prefix', async () => {
    const rootPath = 'build/';
    const testCases = [
      { original: 'build/index.html', expected: 'index.html' },
      { original: 'build/game.js', expected: 'game.js' },
      { original: 'build/assets/sprite.png', expected: 'assets/sprite.png' },
      { original: 'build/assets/sounds/music.mp3', expected: 'assets/sounds/music.mp3' },
    ];

    testCases.forEach(({ original, expected }) => {
      const fileRelativePath = rootPath ? original.substring(rootPath.length) : original;
      expect(fileRelativePath).toBe(expected);
    });
  });

  it('should handle case when no index.html is found', async () => {
    // Create a ZIP without index.html
    mockZip.file('game.js', 'console.log("game");');
    mockZip.file('assets/sprite.png', 'fake-image-data');

    const allFiles = Object.keys(mockZip.files);
    
    // Find index.html paths
    const indexHtmlPaths = allFiles.filter(path => 
      path.toLowerCase().endsWith('index.html') && !mockZip.files[path].dir
    );
    
    expect(indexHtmlPaths).toHaveLength(0);
    
    // This should trigger an error in the actual implementation
    expect(() => {
      if (indexHtmlPaths.length === 0) {
        throw new Error('Không tìm thấy file index.html trong ZIP');
      }
    }).toThrow('Không tìm thấy file index.html trong ZIP');
  });
});