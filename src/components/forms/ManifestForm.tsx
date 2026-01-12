'use client';

import { useState, useCallback } from 'react';

export interface ManifestData {
  gameId: string;
  version: string;
  title?: string;
  runtime: string;
  entryPoint: string;
  description?: string;
}

interface ManifestFormProps {
  manifest: ManifestData;
  disabled?: boolean;
  onChange?: (manifest: ManifestData) => void;
  onValidate?: (isValid: boolean, errors: string[]) => void;
}

const runtimeOptions = [
  { value: 'HTML5', label: 'HTML5' },
  { value: 'Unity WebGL', label: 'Unity WebGL' },
  { value: 'Phaser', label: 'Phaser' },
  { value: 'Construct 3', label: 'Construct 3' },
  { value: 'Custom', label: 'Custom' },
];

export function ManifestForm({
  manifest: initialManifest,
  disabled = false,
  onChange,
  onValidate,
}: ManifestFormProps) {
  const [manifest, setManifest] = useState<ManifestData>(initialManifest);
  const [errors, setErrors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = useCallback(
    (field: keyof ManifestData, value: string) => {
      const updated = { ...manifest, [field]: value };
      setManifest(updated);
      onChange?.(updated);
    },
    [manifest, onChange]
  );

  const validate = useCallback(() => {
    const validationErrors: string[] = [];

    if (!manifest.gameId) validationErrors.push('Game ID là bắt buộc');
    if (!manifest.version) validationErrors.push('Version là bắt buộc');
    if (!manifest.runtime) validationErrors.push('Runtime là bắt buộc');
    if (!manifest.entryPoint) validationErrors.push('Entry Point là bắt buộc');

    if (manifest.gameId && !/^[a-z0-9.-]+$/.test(manifest.gameId)) {
      validationErrors.push('Game ID chỉ được chứa chữ thường, số, dấu chấm và gạch ngang');
    }

    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      validationErrors.push('Version phải theo chuẩn Semantic Versioning (vd: 1.0.0)');
    }

    setErrors(validationErrors);
    const isValid = validationErrors.length === 0;
    
    if (isValid) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }

    onValidate?.(isValid, validationErrors);
    return isValid;
  }, [manifest, onValidate]);

  const reset = useCallback(() => {
    setManifest(initialManifest);
    setErrors([]);
    setShowSuccess(false);
    onChange?.(initialManifest);
  }, [initialManifest, onChange]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">Game Manifest</h3>
        <p className="text-sm text-slate-600">Cấu hình thông tin cơ bản của game</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Game ID */}
          <div className="space-y-2">
            <label htmlFor="gameId" className="block text-sm font-medium text-slate-700">
              Game ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="gameId"
              value={manifest.gameId}
              onChange={(e) => handleChange('gameId', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              placeholder="com.example.my-game"
              disabled={disabled}
              required
            />
            <p className="text-xs text-slate-500">
              Định danh duy nhất của game (chỉ chữ thường, số, dấu chấm và gạch ngang)
            </p>
          </div>

          {/* Version */}
          <div className="space-y-2">
            <label htmlFor="version" className="block text-sm font-medium text-slate-700">
              Version <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="version"
              value={manifest.version}
              onChange={(e) => handleChange('version', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              placeholder="1.0.0"
              disabled={disabled}
              required
            />
            <p className="text-xs text-slate-500">
              Phiên bản theo chuẩn Semantic Versioning (vd: 1.0.0)
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={manifest.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              placeholder="Tên hiển thị của game"
              disabled={disabled}
            />
          </div>

          {/* Runtime */}
          <div className="space-y-2">
            <label htmlFor="runtime" className="block text-sm font-medium text-slate-700">
              Runtime <span className="text-red-500">*</span>
            </label>
            <select
              id="runtime"
              value={manifest.runtime}
              onChange={(e) => handleChange('runtime', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              disabled={disabled}
              required
            >
              {runtimeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Entry Point */}
          <div className="space-y-2">
            <label htmlFor="entryPoint" className="block text-sm font-medium text-slate-700">
              Entry Point <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="entryPoint"
              value={manifest.entryPoint}
              onChange={(e) => handleChange('entryPoint', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              placeholder="index.html"
              disabled={disabled}
              required
            />
            <p className="text-xs text-slate-500">
              File chính để khởi chạy game (thường là index.html)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              value={manifest.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              placeholder="Mô tả ngắn về game..."
              disabled={disabled}
              rows={3}
            />
          </div>
        </div>

        {/* Validation Messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-red-800 font-medium text-sm mb-2">Validation Errors:</h4>
            <ul className="text-red-600 text-sm space-y-1">
              {errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-600 text-sm font-medium">✓ Manifest hợp lệ</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={reset}
            disabled={disabled}
            className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={validate}
            disabled={disabled}
            className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Validate
          </button>
        </div>
      </div>
    </div>
  );
}
