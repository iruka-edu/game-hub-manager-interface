/**
 * Jest setup file for @iruka/game-core-sdk tests
 */

// Global test configuration
beforeEach(() => {
  // Reset any global state before each test
  jest.clearAllMocks();
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidMetadata(): R;
      toHaveValidationError(field: string): R;
    }
  }
}

// Custom Jest matchers for metadata validation
expect.extend({
  toBeValidMetadata(received) {
    const pass = received && typeof received === 'object' && received !== null;
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to be valid metadata`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to be valid metadata object`,
        pass: false,
      };
    }
  },
  
  toHaveValidationError(received, field) {
    const hasError = received.errors && 
      received.errors.some((error: any) => error.field === field);
    
    if (hasError) {
      return {
        message: () => `Expected validation result not to have error for field "${field}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected validation result to have error for field "${field}"`,
        pass: false,
      };
    }
  }
});