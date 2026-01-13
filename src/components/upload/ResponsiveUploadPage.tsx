'use client';

import React, { useState } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { AdaptiveActionBar } from '@/components/actions/AdaptiveActionBar';

interface UploadFormData {
  gameId: string;
  title: string;
  description: string;
  version: string;
  files: File[];
  manifest: any;
  selfQA: {
    testedDevices: boolean;
    testedAudio: boolean;
    gameplayComplete: boolean;
    contentVerified: boolean;
    note: string;
  };
}

interface ResponsiveUploadPageProps {
  initialData?: Partial<UploadFormData>;
  onSave?: (data: UploadFormData) => void;
  onPublish?: (data: UploadFormData) => void;
  className?: string;
}

/**
 * ResponsiveUploadPage Component
 * 
 * Implements responsive upload page patterns:
 * - Desktop: Three-column layout (Upload - Manifest - Preview)
 * - Tablet: Single-column accordion layout with live checklist
 * - Mobile: Desktop-only message with view-only access
 * 
 * Validates Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function ResponsiveUploadPage({
  initialData = {},
  onSave,
  onPublish,
  className = ''
}: ResponsiveUploadPageProps) {
  const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();
  const [formData, setFormData] = useState<Partial<UploadFormData>>(initialData);
  const [activeAccordion, setActiveAccordion] = useState<string>('upload');

  // Mobile: Desktop-only message
  if (isMobile) {
    return (
      <ResponsiveLayout className={className}>
        <MobileDesktopOnlyMessage />
      </ResponsiveLayout>
    );
  }

  // Desktop: Three-column layout
  if (isDesktop) {
    return (
      <ResponsiveLayout className={className}>
        <div className="gh-upload-desktop-layout">
          <div className="gh-upload-column gh-upload-column-main">
            <UploadSection
              formData={formData}
              onUpdate={setFormData}
              layout="desktop"
            />
          </div>
          
          <div className="gh-upload-column gh-upload-column-manifest">
            <ManifestSection
              formData={formData}
              onUpdate={setFormData}
              layout="desktop"
            />
          </div>
          
          <div className="gh-upload-column gh-upload-column-preview">
            <PreviewSection
              formData={formData}
              layout="desktop"
            />
            <SelfQAChecklist
              formData={formData}
              onUpdate={setFormData}
              layout="desktop"
            />
          </div>
        </div>
        
        <AdaptiveActionBar
          primaryActions={getUploadActions(formData, onSave, onPublish)}
          position="sticky-bottom"
        />
      </ResponsiveLayout>
    );
  }

  // Tablet: Accordion layout
  return (
    <ResponsiveLayout className={className}>
      <div className="gh-upload-tablet-layout">
        <UploadAccordion
          sections={[
            {
              id: 'upload',
              title: 'Upload Files',
              icon: '⬆️',
              content: (
                <UploadSection
                  formData={formData}
                  onUpdate={setFormData}
                  layout="tablet"
                />
              )
            },
            {
              id: 'manifest',
              title: 'Game Manifest',
              icon: '📋',
              content: (
                <ManifestSection
                  formData={formData}
                  onUpdate={setFormData}
                  layout="tablet"
                />
              )
            },
            {
              id: 'preview',
              title: 'Preview & QA',
              icon: '👁',
              content: (
                <>
                  <PreviewSection
                    formData={formData}
                    layout="tablet"
                  />
                  <SelfQAChecklist
                    formData={formData}
                    onUpdate={setFormData}
                    layout="tablet"
                  />
                </>
              )
            }
          ]}
          activeSection={activeAccordion}
          onSectionChange={setActiveAccordion}
        />
      </div>
      
      <AdaptiveActionBar
        primaryActions={getUploadActions(formData, onSave, onPublish)}
        position="sticky-bottom"
      />
    </ResponsiveLayout>
  );
}

/**
 * Mobile Desktop-Only Message Component
 */
function MobileDesktopOnlyMessage() {
  return (
    <div className="gh-desktop-only-message">
      <div className="gh-desktop-only-content">
        <div className="gh-desktop-only-icon">
          💻
        </div>
        <h2 className="gh-responsive-heading gh-font-semibold">
          Desktop Required
        </h2>
        <p className="gh-responsive-body gh-text-muted">
          Game upload and editing features are only available on desktop devices 
          for the best experience with file management and complex forms.
        </p>
        <div className="gh-desktop-only-features">
          <h3 className="gh-responsive-body gh-font-medium">
            Available on mobile:
          </h3>
          <ul className="gh-feature-list">
            <li>View game information</li>
            <li>Check upload status</li>
            <li>Monitor QC progress</li>
            <li>Basic game management</li>
          </ul>
        </div>
        <button 
          className="gh-btn gh-btn-primary gh-btn-responsive"
          onClick={() => window.history.back()}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

/**
 * Upload Section Component
 */
interface UploadSectionProps {
  formData: Partial<UploadFormData>;
  onUpdate: (data: Partial<UploadFormData>) => void;
  layout: 'desktop' | 'tablet';
}

function UploadSection({ formData, onUpdate, layout }: UploadSectionProps) {
  return (
    <div className={`gh-upload-section gh-upload-section-${layout}`}>
      <h3 className="gh-section-title gh-responsive-heading gh-font-semibold">
        Upload Game Files
      </h3>
      
      <div className="gh-upload-form">
        <div className="gh-form-field">
          <label className="gh-form-label">Game ID</label>
          <input
            type="text"
            className="gh-form-input gh-input-responsive"
            value={formData.gameId || ''}
            onChange={(e) => onUpdate({ ...formData, gameId: e.target.value })}
            placeholder="com.iruka.game-name"
          />
        </div>
        
        <div className="gh-form-field">
          <label className="gh-form-label">Game Title</label>
          <input
            type="text"
            className="gh-form-input gh-input-responsive"
            value={formData.title || ''}
            onChange={(e) => onUpdate({ ...formData, title: e.target.value })}
            placeholder="Enter game title"
          />
        </div>
        
        <div className="gh-form-field">
          <label className="gh-form-label">Version</label>
          <input
            type="text"
            className="gh-form-input gh-input-responsive"
            value={formData.version || ''}
            onChange={(e) => onUpdate({ ...formData, version: e.target.value })}
            placeholder="1.0.0"
          />
        </div>
        
        <div className="gh-form-field">
          <label className="gh-form-label">Game Files</label>
          <div className="gh-file-upload-area">
            <div className="gh-file-upload-content">
              <span className="gh-file-upload-icon">📁</span>
              <span className="gh-file-upload-text">
                Drop files here or click to browse
              </span>
              <input
                type="file"
                multiple
                className="gh-file-upload-input"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  onUpdate({ ...formData, files });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Manifest Section Component
 */
function ManifestSection({ formData, onUpdate, layout }: UploadSectionProps) {
  return (
    <div className={`gh-manifest-section gh-manifest-section-${layout}`}>
      <h3 className="gh-section-title gh-responsive-heading gh-font-semibold">
        Game Manifest
      </h3>
      
      <div className="gh-manifest-form">
        <div className="gh-form-field">
          <label className="gh-form-label">Description</label>
          <textarea
            className="gh-form-input gh-input-responsive"
            rows={4}
            value={formData.description || ''}
            onChange={(e) => onUpdate({ ...formData, description: e.target.value })}
            placeholder="Describe your game..."
          />
        </div>
        
        <div className="gh-form-field">
          <label className="gh-form-label">Subject</label>
          <select className="gh-form-input gh-input-responsive">
            <option value="">Select subject</option>
            <option value="math">Mathematics</option>
            <option value="science">Science</option>
            <option value="language">Language Arts</option>
          </select>
        </div>
        
        <div className="gh-form-field">
          <label className="gh-form-label">Grade Level</label>
          <select className="gh-form-input gh-input-responsive">
            <option value="">Select grade</option>
            <option value="k">Kindergarten</option>
            <option value="1">Grade 1</option>
            <option value="2">Grade 2</option>
            <option value="3">Grade 3</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/**
 * Preview Section Component
 */
interface PreviewSectionProps {
  formData: Partial<UploadFormData>;
  layout: 'desktop' | 'tablet';
}

function PreviewSection({ formData, layout }: PreviewSectionProps) {
  return (
    <div className={`gh-preview-section gh-preview-section-${layout}`}>
      <h3 className="gh-section-title gh-responsive-heading gh-font-semibold">
        Game Preview
      </h3>
      
      <div className="gh-preview-content">
        {formData.files && formData.files.length > 0 ? (
          <div className="gh-preview-placeholder">
            <span className="gh-preview-icon">🎮</span>
            <span className="gh-preview-text">
              Game preview will appear here
            </span>
            <button className="gh-btn gh-btn-secondary gh-btn-responsive">
              Launch Preview
            </button>
          </div>
        ) : (
          <div className="gh-preview-empty">
            <span className="gh-preview-empty-text">
              Upload files to see preview
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Self-QA Checklist Component
 */
function SelfQAChecklist({ formData, onUpdate, layout }: UploadSectionProps) {
  const selfQA = formData.selfQA || {
    testedDevices: false,
    testedAudio: false,
    gameplayComplete: false,
    contentVerified: false,
    note: ''
  };

  const updateSelfQA = (updates: Partial<typeof selfQA>) => {
    onUpdate({
      ...formData,
      selfQA: { ...selfQA, ...updates }
    });
  };

  return (
    <div className={`gh-selfqa-section gh-selfqa-section-${layout}`}>
      <h3 className="gh-section-title gh-responsive-heading gh-font-semibold">
        Self-QA Checklist
      </h3>
      
      <div className="gh-selfqa-checklist">
        <label className="gh-checkbox-field">
          <input
            type="checkbox"
            checked={selfQA.testedDevices}
            onChange={(e) => updateSelfQA({ testedDevices: e.target.checked })}
          />
          <span className="gh-checkbox-label">Tested on target devices</span>
        </label>
        
        <label className="gh-checkbox-field">
          <input
            type="checkbox"
            checked={selfQA.testedAudio}
            onChange={(e) => updateSelfQA({ testedAudio: e.target.checked })}
          />
          <span className="gh-checkbox-label">Audio works correctly</span>
        </label>
        
        <label className="gh-checkbox-field">
          <input
            type="checkbox"
            checked={selfQA.gameplayComplete}
            onChange={(e) => updateSelfQA({ gameplayComplete: e.target.checked })}
          />
          <span className="gh-checkbox-label">Full gameplay tested</span>
        </label>
        
        <label className="gh-checkbox-field">
          <input
            type="checkbox"
            checked={selfQA.contentVerified}
            onChange={(e) => updateSelfQA({ contentVerified: e.target.checked })}
          />
          <span className="gh-checkbox-label">Content accuracy verified</span>
        </label>
        
        <div className="gh-form-field">
          <label className="gh-form-label">QA Notes</label>
          <textarea
            className="gh-form-input gh-input-responsive"
            rows={3}
            value={selfQA.note}
            onChange={(e) => updateSelfQA({ note: e.target.value })}
            placeholder="Additional notes..."
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Upload Accordion Component for Tablet
 */
interface AccordionSection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

interface UploadAccordionProps {
  sections: AccordionSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

function UploadAccordion({ sections, activeSection, onSectionChange }: UploadAccordionProps) {
  return (
    <div className="gh-upload-accordion">
      {sections.map((section) => (
        <div key={section.id} className="gh-accordion-section">
          <button
            className={`gh-accordion-header ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => onSectionChange(section.id)}
          >
            <span className="gh-accordion-icon">{section.icon}</span>
            <span className="gh-accordion-title gh-responsive-body gh-font-medium">
              {section.title}
            </span>
            <span className="gh-accordion-chevron">
              {activeSection === section.id ? '▼' : '▶'}
            </span>
          </button>
          
          {activeSection === section.id && (
            <div className="gh-accordion-content">
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Helper function to get upload actions
 */
function getUploadActions(
  formData: Partial<UploadFormData>,
  onSave?: (data: UploadFormData) => void,
  onPublish?: (data: UploadFormData) => void
) {
  const isComplete = formData.gameId && formData.title && formData.files?.length;
  
  return [
    {
      key: 'save',
      label: 'Save Draft',
      icon: '💾',
      variant: 'secondary' as const,
      onClick: () => onSave?.(formData as UploadFormData),
      isDisabled: !formData.gameId || !formData.title
    },
    {
      key: 'submit',
      label: 'Submit to QC',
      icon: '📤',
      variant: 'primary' as const,
      onClick: () => onPublish?.(formData as UploadFormData),
      isDisabled: !isComplete
    }
  ];
}