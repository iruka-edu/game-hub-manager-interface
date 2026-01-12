// Simple test to verify game edit API
const gameId = '6963bc4b97412e3db14971bc';

const testData = {
  title: 'Test Game Updated',
  description: 'Updated description',
  subject: 'math',
  grade: '1',
  unit: 'Unit 1',
  gameType: 'quiz',
  lesson: ['Bài 1'],
  level: '1',
  skills: ['1', '2'],
  themes: ['1'],
  linkGithub: 'https://github.com/test',
  quyenSach: 'Tập 1',
};

console.log('Testing game edit API...');
console.log('Game ID:', gameId);
console.log('Test data:', JSON.stringify(testData, null, 2));

// This would be the actual API call:
// PUT /api/games/6963bc4b97412e3db14971bc
// Body: testData
// Headers: Cookie with session

console.log('API endpoint: PUT /api/games/' + gameId);
console.log('Expected: 200 OK with updated game data');