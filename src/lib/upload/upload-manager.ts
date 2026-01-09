/**
 * Upload Manager - Centralized upload logic
 */

import type { 
  UploadState, 
  UploadProgress, 
  ValidationResult, 
  ManifestData, 
  GameMetadata,
  UploadConfig 
} from '../../types/upload';
import { validateGameZip, validateGameId, validateVersion } from '../upload-utils';

export class UploadManager {
  private state: UploadState;
  private config: UploadConfig;
  private listeners: ((state: UploadState) => void)[] = [];

  constructor(config: UploadConfig, initialMetadata: GameMetadata) {
    this.config = config;
    this.state = {
      file: null,
      manifest: {
        gameId: initialMetadata.backendGameId,
        version: '1.0.0',
        runtime: 'HTML5',
        entryPoint: 'index.html',
      },
      metadata: initialMetadata,
      isUploading: false,
      progress: 0,
      stage: 'idle',
      error: null,
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: UploadState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update state and notify listeners
   */
  private setState(updates: Partial<UploadState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Get current state
   */
  getState(): UploadState {
    return { ...this.state };
  }

  /**
   * Set file for upload
   */
  async setFile(file: File): Promise<ValidationResult> {
    this.setState({ 
      file, 
      stage: 'validating',
      error: null 
    });

    try {
      // Validate file
      const validation = await this.validateFile(file);
      
      if (validation.valid && validation.manifestData) {
        // Auto-populate manifest from ZIP
        this.setState({
          manifest: {
            ...this.state.manifest,
            ...validation.manifestData,
          },
          stage: 'idle',
        });
      } else {
        this.setState({ stage: 'idle' });
      }

      return validation;
    } catch (error) {
      this.setState({ 
        stage: 'error',
        error: error.message 
      });
      return {
        valid: false,
        errors: [error.message],
        warnings: [],
      };
    }
  }

  /**
   * Update manifest data
   */
  updateManifest(updates: Partial<ManifestData>): void {
    this.setState({
      manifest: { ...this.state.manifest, ...updates }
    });
  }

  /**
   * Validate current state
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate file
    if (!this.state.file) {
      errors.push('Vui lòng chọn file để upload');
    }

    // Validate manifest
    const gameIdValidation = validateGameId(this.state.manifest.gameId);
    if (!gameIdValidation.valid) {
      errors.push(gameIdValidation.error!);
    }

    const versionValidation = validateVersion(this.state.manifest.version);
    if (!versionValidation.valid) {
      errors.push(versionValidation.error!);
    }

    if (!this.state.manifest.runtime) {
      errors.push('Runtime là bắt buộc');
    }

    if (!this.state.manifest.entryPoint) {
      errors.push('Entry point là bắt buộc');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Start upload process
   */
  async upload(): Promise<boolean> {
    const validation = this.validate();
    if (!validation.valid) {
      this.setState({
        stage: 'error',
        error: validation.errors.join(', ')
      });
      return false;
    }

    this.setState({
      isUploading: true,
      stage: 'uploading',
      progress: 0,
      error: null,
    });

    try {
      // Step 1: Upload file
      const uploadResult = await this.uploadFile();
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Step 2: Update metadata
      this.setState({
        stage: 'updating',
        progress: 80,
      });

      const updateResult = await this.updateMetadata(uploadResult.gameId);
      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }

      // Complete
      this.setState({
        stage: 'complete',
        progress: 100,
        isUploading: false,
      });

      return true;

    } catch (error) {
      this.setState({
        stage: 'error',
        error: error.message,
        isUploading: false,
      });
      return false;
    }
  }

  /**
   * Reset upload state
   */
  reset(): void {
    this.setState({
      file: null,
      isUploading: false,
      progress: 0,
      stage: 'idle',
      error: null,
    });
  }

  /**
   * Private: Validate file
   */
  private async validateFile(file: File): Promise<ValidationResult> {
    // Basic validation
    if (file.size > this.config.validation.maxFileSize) {
      return {
        valid: false,
        errors: [`File quá lớn. Tối đa ${this.config.validation.maxFileSize / 1024 / 1024}MB`],
        warnings: [],
      };
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.config.validation.allowedTypes.includes(extension)) {
      return {
        valid: false,
        errors: [`Chỉ hỗ trợ file: ${this.config.validation.allowedTypes.join(', ')}`],
        warnings: [],
      };
    }

    // ZIP validation
    if (extension === 'zip') {
      return await validateGameZip(file);
    }

    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Private: Upload file to server
   */
  private async uploadFile(): Promise<{ success: boolean; gameId?: string; error?: string }> {
    if (!this.state.file) {
      return { success: false, error: 'No file selected' };
    }

    const formData = new FormData();
    formData.append('file', this.state.file);
    formData.append('gameId', this.state.manifest.gameId);
    formData.append('version', this.state.manifest.version);

    try {
      const response = await fetch(this.config.endpoints.upload, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const result = await response.json();
      return { 
        success: true, 
        gameId: result.data.gameId 
      };

    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Private: Update game metadata
   */
  private async updateMetadata(gameId: string): Promise<{ success: boolean; error?: string }> {
    const updateData = {
      metadata: {
        runtime: this.state.manifest.runtime,
        entryPoint: this.state.manifest.entryPoint,
        skills: this.state.metadata.skills,
        themes: this.state.metadata.themes,
        level: this.state.metadata.level,
        linkGithub: this.state.metadata.linkGithub,
      },
    };

    try {
      const response = await fetch(`${this.config.endpoints.update}/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}