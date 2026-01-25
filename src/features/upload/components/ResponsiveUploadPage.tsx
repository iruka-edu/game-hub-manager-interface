"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useBreakpoint } from "@/hooks/useBreakpoint";

// Default thumbnail URL
const DEFAULT_THUMBNAIL_URL =
  "https://storage.googleapis.com/iruka-edu-mini-game/games/com.iruka.game-test-1/thumbnails/desktop.png";
import {
  ResponsiveLayout,
  ResponsiveContainer,
} from "@/components/layout/ResponsiveLayout";
import { AdaptiveActionBar } from "@/components/actions/AdaptiveActionBar";
import {
  SUBJECT_MAP,
  GRADE_MAP,
  GAME_TYPE_MAP,
  TEXTBOOK_MAP,
  PRIORITY_MAP,
  DIFFICULTY_MAP,
  SKILL_MAP,
  THEME_MAP,
} from "@/lib/game-constants";

export interface UploadFormData {
  gameId: string;
  title: string;
  description: string;
  version: string;
  files: FileList | null;

  // Required metadata fields
  subject: string;
  grade: string;
  gameType: string;
  lessonNo: number | "";

  // Optional metadata fields
  unit?: string;
  textbook?: string;
  theme_primary?: string;
  theme_secondary?: string[];
  context_tags?: string[];
  difficulty_levels?: string[];
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  skills?: string[];
  themes?: string[];
  linkGithub?: string;
}

interface SelfQAChecklist {
  testedDevices: boolean;
  testedAudio: boolean;
  gameplayComplete: boolean;
  contentVerified: boolean;
  note?: string;
}

interface ResponsiveUploadPageProps {
  onUpload: (data: UploadFormData) => Promise<void>;
  onPublish: (gameId: string) => Promise<void>;
  onNavigate: (path: string) => void;
}

/**
 * ResponsiveUploadPage Component
 *
 * Implements responsive upload page patterns:
 * - Desktop: Three-column layout (Upload - Manifest - Preview)
 * - Tablet: Single-column accordion layout with live checklist
 * - Mobile: Desktop-only message with basic info view
 *
 * Validates Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function ResponsiveUploadPage({
  onUpload,
  onPublish,
  onNavigate,
}: ResponsiveUploadPageProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [formData, setFormData] = useState<UploadFormData>({
    gameId: "",
    title: "",
    description: "",
    version: "1.0.0",
    files: null,

    // Required metadata fields
    subject: "",
    grade: "",
    gameType: "",
    lessonNo: "",

    // Optional metadata fields
    unit: "",
    textbook: "",
    theme_primary: "",
    theme_secondary: [],
    context_tags: [],
    difficulty_levels: [],
    thumbnailDesktop: "",
    thumbnailMobile: "",
    priority: "medium",
    tags: [],
    skills: [],
    themes: [],
    linkGithub: "",
  });
  const [selfQA, setSelfQA] = useState<SelfQAChecklist>({
    testedDevices: false,
    testedAudio: false,
    gameplayComplete: false,
    contentVerified: false,
    note: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  const isFormValid = () => {
    return (
      formData.title &&
      formData.gameId &&
      formData.files &&
      formData.subject &&
      formData.grade &&
      formData.gameType &&
      formData.lessonNo !== ""
    );
  };

  const isSelfQAComplete = () => {
    return (
      selfQA.testedDevices &&
      selfQA.testedAudio &&
      selfQA.gameplayComplete &&
      selfQA.contentVerified
    );
  };

  const uploadActions = [
    {
      key: "save-draft",
      label: "Save Draft",
      icon: "💾",
      variant: "secondary" as const,
      onClick: () => handleSaveDraft(),
      isDisabled: !formData.title || isUploading,
    },
    {
      key: "upload",
      label: "Upload & Submit",
      icon: "📤",
      variant: "primary" as const,
      onClick: () => handleUpload(),
      isDisabled: !isFormValid() || !isSelfQAComplete() || isUploading,
    },
  ];

  const handleUpload = async () => {
    if (!isFormValid() || !isSelfQAComplete()) return;

    setIsUploading(true);
    try {
      await onUpload(formData);
      onNavigate("/console/games");
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDraft = async () => {
    // Save as draft logic
    console.log("Saving draft...", formData);
  };

  // Mobile: Desktop-only message
  if (isMobile) {
    return (
      <ResponsiveLayout className="gh-upload-mobile">
        <ResponsiveContainer>
          <MobileUploadMessage onNavigate={onNavigate} />
        </ResponsiveContainer>
      </ResponsiveLayout>
    );
  }

  // Desktop: Three-column layout
  if (isDesktop) {
    return (
      <ResponsiveLayout
        className="gh-upload-desktop"
        actionBar={
          <AdaptiveActionBar
            primaryActions={uploadActions.filter(
              (a) => a.variant === "primary",
            )}
            secondaryActions={uploadActions.filter(
              (a) => a.variant === "secondary",
            )}
            position="sticky-bottom"
          />
        }
      >
        <div className="gh-upload-three-column">
          {/* Upload Column */}
          <div className="gh-upload-column">
            <UploadForm
              formData={formData}
              onFormChange={setFormData}
              isUploading={isUploading}
            />
          </div>

          {/* Manifest Column */}
          <div className="gh-manifest-column">
            <ManifestEditor formData={formData} onFormChange={setFormData} />
          </div>

          {/* Preview Column */}
          <div className="gh-preview-column">
            <GamePreview formData={formData} />
            <SelfQAChecklist
              checklist={selfQA}
              onChecklistChange={setSelfQA}
              isComplete={isSelfQAComplete()}
            />
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  // Tablet: Accordion layout
  return (
    <ResponsiveLayout
      className="gh-upload-tablet"
      actionBar={
        <AdaptiveActionBar
          primaryActions={uploadActions.filter((a) => a.variant === "primary")}
          secondaryActions={uploadActions.filter(
            (a) => a.variant === "secondary",
          )}
          position="sticky-bottom"
        />
      }
    >
      <ResponsiveContainer>
        <div className="gh-upload-accordion">
          <AccordionSection title="Upload Game" defaultOpen={true}>
            <UploadForm
              formData={formData}
              onFormChange={setFormData}
              isUploading={isUploading}
            />
          </AccordionSection>

          <AccordionSection title="Game Manifest">
            <ManifestEditor formData={formData} onFormChange={setFormData} />
          </AccordionSection>

          <AccordionSection title="Preview & QA">
            <GamePreview formData={formData} />
            <SelfQAChecklist
              checklist={selfQA}
              onChecklistChange={setSelfQA}
              isComplete={isSelfQAComplete()}
            />
          </AccordionSection>
        </div>
      </ResponsiveContainer>
    </ResponsiveLayout>
  );
}

/**
 * Mobile Upload Message Component
 */
function MobileUploadMessage({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="gh-mobile-upload-message">
      <div className="gh-desktop-only-icon">🖥️</div>
      <h2 className="gh-responsive-heading gh-font-semibold">
        Desktop Required
      </h2>
      <p className="gh-responsive-body gh-text-muted">
        Game upload and configuration requires a desktop computer for the best
        experience. Please use a desktop or laptop to upload games.
      </p>

      <div className="gh-mobile-alternatives">
        <h3 className="gh-responsive-body gh-font-medium">
          What you can do on mobile:
        </h3>
        <ul className="gh-mobile-feature-list">
          <li onClick={() => onNavigate("/console/games")}>
            📱 View your games
          </li>
          <li onClick={() => onNavigate("/console/qc-inbox")}>
            🔍 Check QC status
          </li>
          <li onClick={() => onNavigate("/console")}>📊 Monitor dashboard</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Upload Form Component
 */
function UploadForm({
  formData,
  onFormChange,
  isUploading,
}: {
  formData: UploadFormData;
  onFormChange: (data: UploadFormData) => void;
  isUploading: boolean;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFormChange({ ...formData, files: e.target.files });
  };

  return (
    <div className="gh-upload-form">
      <h3 className="gh-responsive-heading gh-font-medium">
        Upload Game Files
      </h3>

      <div className="gh-form-field">
        <label className="gh-form-label">Game ID</label>
        <input
          type="text"
          className="gh-input-responsive"
          value={formData.gameId}
          onChange={(e) =>
            onFormChange({ ...formData, gameId: e.target.value })
          }
          placeholder="com.iruka.math-adventure"
          disabled={isUploading}
        />
      </div>

      <div className="gh-form-field">
        <label className="gh-form-label">Game Title</label>
        <input
          type="text"
          className="gh-input-responsive"
          value={formData.title}
          onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
          placeholder="Math Adventure"
          disabled={isUploading}
        />
      </div>

      <div className="gh-form-field">
        <label className="gh-form-label">Version</label>
        <input
          type="text"
          className="gh-input-responsive"
          value={formData.version}
          onChange={(e) =>
            onFormChange({ ...formData, version: e.target.value })
          }
          placeholder="1.0.0"
          disabled={isUploading}
        />
      </div>

      <div className="gh-form-field">
        <label className="gh-form-label">Game Files (ZIP)</label>
        <input
          type="file"
          className="gh-input-responsive"
          accept=".zip"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <small className="gh-form-help">
          Upload a ZIP file containing your game's HTML, CSS, JS, and assets.
        </small>
      </div>
    </div>
  );
}

/**
 * Manifest Editor Component - Enhanced with full metadata support
 */
function ManifestEditor({
  formData,
  onFormChange,
}: {
  formData: UploadFormData;
  onFormChange: (data: UploadFormData) => void;
}) {
  const handleArrayChange = (field: keyof UploadFormData, value: string) => {
    const currentArray = (formData[field] as string[]) || [];
    const newArray = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item);
    onFormChange({ ...formData, [field]: newArray });
  };

  return (
    <div className="gh-manifest-editor">
      <h3 className="gh-responsive-heading gh-font-medium">Game Manifest</h3>

      {/* Basic Information */}
      <div className="gh-form-section">
        <h4 className="gh-form-section-title">Basic Information</h4>

        <div className="gh-form-field">
          <label className="gh-form-label">Description</label>
          <textarea
            className="gh-input-responsive"
            rows={4}
            value={formData.description}
            onChange={(e) =>
              onFormChange({ ...formData, description: e.target.value })
            }
            placeholder="Describe your game..."
          />
        </div>
      </div>

      {/* Required Metadata */}
      <div className="gh-form-section">
        <h4 className="gh-form-section-title">Required Metadata</h4>

        <div className="gh-form-row">
          <div className="gh-form-field">
            <label className="gh-form-label">Subject *</label>
            <select
              className="gh-input-responsive"
              value={formData.subject}
              onChange={(e) =>
                onFormChange({ ...formData, subject: e.target.value })
              }
              required
            >
              <option value="">Select Subject</option>
              {Object.entries(SUBJECT_MAP).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="gh-form-field">
            <label className="gh-form-label">Grade Level *</label>
            <select
              className="gh-input-responsive"
              value={formData.grade}
              onChange={(e) =>
                onFormChange({ ...formData, grade: e.target.value })
              }
              required
            >
              <option value="">Select Grade</option>
              {Object.entries(GRADE_MAP).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="gh-form-row">
          <div className="gh-form-field">
            <label className="gh-form-label">Game Type *</label>
            <select
              className="gh-input-responsive"
              value={formData.gameType}
              onChange={(e) =>
                onFormChange({ ...formData, gameType: e.target.value })
              }
              required
            >
              <option value="">Select Game Type</option>
              {Object.entries(GAME_TYPE_MAP).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="gh-form-field">
            <label className="gh-form-label">Lesson Number *</label>
            <input
              type="number"
              className="gh-input-responsive"
              value={formData.lessonNo}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  lessonNo: e.target.value ? parseInt(e.target.value) : "",
                })
              }
              placeholder="1"
              min="1"
              required
            />
          </div>
        </div>
      </div>

      {/* Optional Metadata */}
      <div className="gh-form-section">
        <h4 className="gh-form-section-title">Optional Metadata</h4>

        <div className="gh-form-row">
          <div className="gh-form-field">
            <label className="gh-form-label">Unit</label>
            <input
              type="text"
              className="gh-input-responsive"
              value={formData.unit || ""}
              onChange={(e) =>
                onFormChange({ ...formData, unit: e.target.value })
              }
              placeholder="Unit 1: Numbers"
            />
          </div>

          <div className="gh-form-field">
            <label className="gh-form-label">Textbook</label>
            <select
              className="gh-input-responsive"
              value={formData.textbook || ""}
              onChange={(e) =>
                onFormChange({ ...formData, textbook: e.target.value })
              }
            >
              <option value="">Select Textbook</option>
              {Object.entries(TEXTBOOK_MAP).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="gh-form-field">
          <label className="gh-form-label">Primary Theme</label>
          <input
            type="text"
            className="gh-input-responsive"
            value={formData.theme_primary || ""}
            onChange={(e) =>
              onFormChange({ ...formData, theme_primary: e.target.value })
            }
            placeholder="Addition and Subtraction"
          />
        </div>

        <div className="gh-form-field">
          <label className="gh-form-label">Priority</label>
          <select
            className="gh-input-responsive"
            value={formData.priority || "medium"}
            onChange={(e) =>
              onFormChange({
                ...formData,
                priority: e.target.value as "low" | "medium" | "high",
              })
            }
          >
            {Object.entries(PRIORITY_MAP).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="gh-form-field">
          <label className="gh-form-label">GitHub Link</label>
          <input
            type="url"
            className="gh-input-responsive"
            value={formData.linkGithub || ""}
            onChange={(e) =>
              onFormChange({ ...formData, linkGithub: e.target.value })
            }
            placeholder="https://github.com/username/repo"
          />
        </div>
      </div>

      {/* Tags and Categories */}
      <div className="gh-form-section">
        <h4 className="gh-form-section-title">Tags & Categories</h4>

        <div className="gh-form-field">
          <label className="gh-form-label">Secondary Themes</label>
          <input
            type="text"
            className="gh-input-responsive"
            value={(formData.theme_secondary || []).join(", ")}
            onChange={(e) =>
              handleArrayChange("theme_secondary", e.target.value)
            }
            placeholder="Geometry, Problem Solving (comma separated)"
          />
        </div>

        <div className="gh-form-field">
          <label className="gh-form-label">Context Tags</label>
          <input
            type="text"
            className="gh-input-responsive"
            value={(formData.context_tags || []).join(", ")}
            onChange={(e) => handleArrayChange("context_tags", e.target.value)}
            placeholder="k12, exam-prep, interactive (comma separated)"
          />
        </div>

        <div className="gh-form-field">
          <label className="gh-form-label">Difficulty Levels</label>
          <input
            type="text"
            className="gh-input-responsive"
            value={(formData.difficulty_levels || []).join(", ")}
            onChange={(e) =>
              handleArrayChange("difficulty_levels", e.target.value)
            }
            placeholder="easy, medium, hard (comma separated)"
          />
        </div>

        <div className="gh-form-field">
          <label className="gh-form-label">Skills</label>
          <select
            className="gh-input-responsive"
            multiple
            value={formData.skills || []}
            onChange={(e) => {
              const selectedOptions = Array.from(
                e.target.selectedOptions,
                (option) => option.value,
              );
              onFormChange({ ...formData, skills: selectedOptions });
            }}
          >
            {Object.entries(SKILL_MAP)
              .filter(([key]) => /^\d+$/.test(key))
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
          <small className="gh-form-help">
            Giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều kỹ năng
          </small>
        </div>

        <div className="gh-form-field">
          <label className="gh-form-label">General Tags</label>
          <input
            type="text"
            className="gh-input-responsive"
            value={(formData.tags || []).join(", ")}
            onChange={(e) => handleArrayChange("tags", e.target.value)}
            placeholder="educational, fun, interactive (comma separated)"
          />
        </div>

        <div className="gh-form-field">
          <label className="gh-form-label">Themes</label>
          <select
            className="gh-input-responsive"
            multiple
            value={formData.themes || []}
            onChange={(e) => {
              const selectedOptions = Array.from(
                e.target.selectedOptions,
                (option) => option.value,
              );
              onFormChange({ ...formData, themes: selectedOptions });
            }}
          >
            {Object.entries(THEME_MAP)
              .filter(([key]) => /^\d+$/.test(key))
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
          <small className="gh-form-help">
            Giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều chủ đề
          </small>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="gh-form-section">
        <h4 className="gh-form-section-title">Thumbnails</h4>

        <div className="gh-form-row">
          <div className="gh-form-field">
            <label className="gh-form-label">Desktop Thumbnail (308x211)</label>
            <input
              type="url"
              className="gh-input-responsive"
              value={formData.thumbnailDesktop || ""}
              onChange={(e) =>
                onFormChange({ ...formData, thumbnailDesktop: e.target.value })
              }
              placeholder="https://example.com/thumbnail-desktop.png"
            />
          </div>

          <div className="gh-form-field">
            <label className="gh-form-label">Mobile Thumbnail (343x170)</label>
            <input
              type="url"
              className="gh-input-responsive"
              value={formData.thumbnailMobile || ""}
              onChange={(e) =>
                onFormChange({ ...formData, thumbnailMobile: e.target.value })
              }
              placeholder="https://example.com/thumbnail-mobile.png"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Game Preview Component - Enhanced with metadata display
 */
function GamePreview({ formData }: { formData: UploadFormData }) {
  const getMetadataCompleteness = () => {
    const requiredFields = ["subject", "grade", "gameType", "lessonNo"];
    const completedFields = requiredFields.filter((field) => {
      const value = formData[field as keyof UploadFormData];
      return value !== undefined && value !== null && value !== "";
    });
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const getSkillText = (skills?: string[]) => {
    if (!skills || skills.length === 0) return "Not set";
    return skills.map((skill) => SKILL_MAP[skill] || skill).join(", ");
  };

  const getThemeText = (themes?: string[]) => {
    if (!themes || themes.length === 0) return "Not set";
    return themes.map((theme) => THEME_MAP[theme] || theme).join(", ");
  };

  const completeness = getMetadataCompleteness();

  return (
    <div className="gh-game-preview">
      <h3 className="gh-responsive-heading gh-font-medium">Preview</h3>

      {formData.files ? (
        <div className="gh-preview-content">
          <div className="gh-preview-card">
            <div className="gh-preview-thumbnail">
              {formData.thumbnailDesktop &&
              formData.thumbnailDesktop.trim() !== "" ? (
                <Image
                  src={formData.thumbnailDesktop}
                  alt="Game thumbnail"
                  width={308}
                  height={211}
                  className="gh-preview-image"
                />
              ) : (
                <Image
                  src={DEFAULT_THUMBNAIL_URL}
                  alt="Default game thumbnail"
                  width={308}
                  height={211}
                  className="gh-preview-image opacity-50"
                />
              )}
            </div>

            <div className="gh-preview-info">
              <h4 className="gh-responsive-body gh-font-medium">
                {formData.title || "Untitled Game"}
              </h4>
              <p className="gh-responsive-meta">Version: {formData.version}</p>
              <p className="gh-responsive-meta">
                Files: {formData.files.length} file(s)
              </p>

              {/* Metadata Summary */}
              <div className="gh-metadata-summary">
                <div className="gh-metadata-row">
                  <span className="gh-metadata-label">Subject:</span>
                  <span className="gh-metadata-value">
                    {formData.subject || "Not set"}
                  </span>
                </div>
                <div className="gh-metadata-row">
                  <span className="gh-metadata-label">Grade:</span>
                  <span className="gh-metadata-value">
                    {formData.grade || "Not set"}
                  </span>
                </div>
                <div className="gh-metadata-row">
                  <span className="gh-metadata-label">Game Type:</span>
                  <span className="gh-metadata-value">
                    {formData.gameType || "Not set"}
                  </span>
                </div>
                <div className="gh-metadata-row">
                  <span className="gh-metadata-label">Lesson:</span>
                  <span className="gh-metadata-value">
                    {formData.lessonNo || "Not set"}
                  </span>
                </div>
                <div className="gh-metadata-row">
                  <span className="gh-metadata-label">Skills:</span>
                  <span className="gh-metadata-value">
                    {getSkillText(formData.skills)}
                  </span>
                </div>
                <div className="gh-metadata-row">
                  <span className="gh-metadata-label">Themes:</span>
                  <span className="gh-metadata-value">
                    {getThemeText(formData.themes)}
                  </span>
                </div>
              </div>

              {/* Completeness Indicator */}
              <div className="gh-completeness-indicator">
                <div className="gh-completeness-header">
                  <span className="gh-completeness-label">
                    Metadata Completeness
                  </span>
                  <span className="gh-completeness-percentage">
                    {completeness}%
                  </span>
                </div>
                <div className="gh-completeness-bar">
                  <div
                    className="gh-completeness-fill"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="gh-preview-empty">
          <p className="gh-responsive-body gh-text-muted">
            Upload game files to see preview
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Self-QA Checklist Component
 */
function SelfQAChecklist({
  checklist,
  onChecklistChange,
  isComplete,
}: {
  checklist: SelfQAChecklist;
  onChecklistChange: (checklist: SelfQAChecklist) => void;
  isComplete: boolean;
}) {
  const checklistItems = [
    { key: "testedDevices", label: "Tested on target devices" },
    { key: "testedAudio", label: "Audio works correctly" },
    { key: "gameplayComplete", label: "Full gameplay tested" },
    { key: "contentVerified", label: "Content accuracy verified" },
  ];

  return (
    <div className="gh-selfqa-checklist">
      <h3 className="gh-responsive-heading gh-font-medium">
        Self-QA Checklist
        {isComplete && <span className="gh-checklist-complete">✅</span>}
      </h3>

      <div className="gh-checklist-items">
        {checklistItems.map((item) => (
          <label key={item.key} className="gh-checklist-item">
            <input
              type="checkbox"
              checked={checklist[item.key as keyof SelfQAChecklist] as boolean}
              onChange={(e) =>
                onChecklistChange({
                  ...checklist,
                  [item.key]: e.target.checked,
                })
              }
            />
            <span className="gh-checklist-label">{item.label}</span>
          </label>
        ))}
      </div>

      <div className="gh-form-field">
        <label className="gh-form-label">QA Notes (Optional)</label>
        <textarea
          className="gh-input-responsive"
          rows={3}
          value={checklist.note || ""}
          onChange={(e) =>
            onChecklistChange({ ...checklist, note: e.target.value })
          }
          placeholder="Any additional notes about testing..."
        />
      </div>

      {!isComplete && (
        <div className="gh-checklist-warning">
          <p className="gh-responsive-meta gh-text-warning">
            ⚠️ Complete all checklist items before submitting to QC
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Accordion Section Component
 */
function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="gh-accordion-section">
      <button
        className="gh-accordion-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="gh-accordion-title">{title}</span>
        <span className="gh-accordion-icon">{isOpen ? "▼" : "▶"}</span>
      </button>

      {isOpen && <div className="gh-accordion-content">{children}</div>}
    </div>
  );
}
