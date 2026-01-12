import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Modal Components Migration', () => {
  const modalsDir = path.join(process.cwd(), 'components/modals');

  describe('DeleteGameModal', () => {
    const modalPath = path.join(modalsDir, 'DeleteGameModal.tsx');

    it('should exist as a React component', () => {
      expect(fs.existsSync(modalPath)).toBe(true);
    });

    it('should be a client component', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content.startsWith("'use client'")).toBe(true);
    });

    it('should export DeleteGameModal function', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('export function DeleteGameModal');
    });

    it('should have required props interface', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('gameId: string');
      expect(content).toContain('gameTitle: string');
      expect(content).toContain('userRoles: string[]');
      expect(content).toContain('isOpen: boolean');
      expect(content).toContain('onClose: () => void');
    });

    it('should handle delete API call', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('/api/games/${gameId}/delete');
      expect(content).toContain("method: 'POST'");
    });

    it('should validate reason for non-admin users', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('isReasonRequired');
      expect(content).toContain("['admin', 'ceo', 'cto']");
    });
  });

  describe('SubmitQCModal', () => {
    const modalPath = path.join(modalsDir, 'SubmitQCModal.tsx');

    it('should exist as a React component', () => {
      expect(fs.existsSync(modalPath)).toBe(true);
    });

    it('should be a client component', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content.startsWith("'use client'")).toBe(true);
    });

    it('should export SubmitQCModal function', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('export function SubmitQCModal');
    });

    it('should have Self-QA checklist items', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('testedDevices');
      expect(content).toContain('testedAudio');
      expect(content).toContain('gameplayComplete');
      expect(content).toContain('contentVerified');
    });

    it('should call self-qa API before submit-qc', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('/api/games/${gameId}/self-qa');
      expect(content).toContain('/api/games/${gameId}/submit-qc');
    });

    it('should require all checklist items before submit', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('isComplete');
      expect(content).toContain('checklist.testedDevices && checklist.testedAudio');
    });
  });

  describe('UpdateCodeModal', () => {
    const modalPath = path.join(modalsDir, 'UpdateCodeModal.tsx');

    it('should exist as a React component', () => {
      expect(fs.existsSync(modalPath)).toBe(true);
    });

    it('should be a client component', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content.startsWith("'use client'")).toBe(true);
    });

    it('should export UpdateCodeModal function', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('export function UpdateCodeModal');
    });

    it('should accept only ZIP files', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('accept=".zip"');
      expect(content).toContain(".endsWith('.zip')");
    });

    it('should use FormData for file upload', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('new FormData()');
      expect(content).toContain("formData.append('file', file)");
    });

    it('should call update-code API', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('/api/games/${gameId}/update-code');
    });

    it('should display warning about code overwrite', () => {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('Code cũ sẽ bị ghi đè hoàn toàn');
      expect(content).toContain('Self-QA checklist sẽ bị xóa');
    });
  });

  describe('Modal Index Exports', () => {
    it('should export all modals from index', () => {
      const indexPath = path.join(modalsDir, 'index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('DeleteGameModal');
      expect(content).toContain('SubmitQCModal');
      expect(content).toContain('UpdateCodeModal');
    });
  });

  describe('Property: Modal Props Consistency', () => {
    it('should have consistent modal interface patterns', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('DeleteGameModal', 'SubmitQCModal', 'UpdateCodeModal'),
          (modalName) => {
            const modalPath = path.join(modalsDir, `${modalName}.tsx`);
            const content = fs.readFileSync(modalPath, 'utf-8');
            
            // All modals should have these common props
            expect(content).toContain('isOpen: boolean');
            expect(content).toContain('onClose: () => void');
            expect(content).toContain('gameId: string');
            
            // All modals should handle backdrop click
            expect(content).toContain('handleBackdropClick');
            
            // All modals should have loading state
            expect(content).toContain('loading');
            expect(content).toContain('setLoading');
            
            return true;
          }
        ),
        { numRuns: 3 }
      );
    });
  });

  describe('Property: Modal Accessibility', () => {
    it('should have proper z-index for overlay', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('DeleteGameModal', 'SubmitQCModal', 'UpdateCodeModal'),
          (modalName) => {
            const modalPath = path.join(modalsDir, `${modalName}.tsx`);
            const content = fs.readFileSync(modalPath, 'utf-8');
            
            // Should have z-50 for proper stacking
            expect(content).toContain('z-50');
            
            // Should have fixed positioning
            expect(content).toContain('fixed inset-0');
            
            return true;
          }
        ),
        { numRuns: 3 }
      );
    });
  });
});
