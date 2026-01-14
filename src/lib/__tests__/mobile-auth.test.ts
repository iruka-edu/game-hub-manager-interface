import { createSessionCookie, clearSessionCookie } from '../session';

describe('Mobile Authentication Fixes', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('createSessionCookie', () => {
    it('should create cookie with SameSite=Lax in development', () => {
      process.env.NODE_ENV = 'development';
      const cookie = createSessionCookie('test-token');
      
      expect(cookie).toContain('iruka_session=test-token');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain('Max-Age=');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).not.toContain('Secure');
    });

    it('should create cookie with SameSite=None and Secure in production', () => {
      process.env.NODE_ENV = 'production';
      const cookie = createSessionCookie('test-token');
      
      expect(cookie).toContain('iruka_session=test-token');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain('Max-Age=');
      expect(cookie).toContain('SameSite=None');
      expect(cookie).toContain('Secure');
    });
  });

  describe('clearSessionCookie', () => {
    it('should clear cookie with SameSite=Lax in development', () => {
      process.env.NODE_ENV = 'development';
      const cookie = clearSessionCookie();
      
      expect(cookie).toContain('iruka_session=');
      expect(cookie).toContain('Max-Age=0');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).not.toContain('Secure');
    });

    it('should clear cookie with SameSite=None and Secure in production', () => {
      process.env.NODE_ENV = 'production';
      const cookie = clearSessionCookie();
      
      expect(cookie).toContain('iruka_session=');
      expect(cookie).toContain('Max-Age=0');
      expect(cookie).toContain('SameSite=None');
      expect(cookie).toContain('Secure');
    });
  });
});