'use client';

import { useState, useRef } from 'react';

interface UpdateCodeModalProps {
  gameId: string;
  gameTitle: string;
  version: string;
  versionId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function UpdateCodeModal({
  gameId,
  gameTitle,
  version,
  versionId,
  isOpen,
  onClose,
  onUpdated,
}: UpdateCodeModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.zip')) {
      setFile(selectedFile);
    } else if (selectedFile) {
      alert('Chỉ chấp nhận file .zip');
      e.target.value = '';
    }
  };

  const handleUpdate = async () => {
    if (!file) {
      alert('Vui lòng chọn file ZIP');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('versionId', versionId);

      const response = await fetch(`/api/games/${gameId}/update-code`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Không thể cập nhật code');
      }

      onClose();
      onUpdated?.();
    } catch (error: any) {
      alert('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Cập nhật code game</h3>
        <p className="text-slate-600 mb-4">
          Cập nhật code cho game "<span className="font-medium">{gameTitle}</span>" 
          phiên bản <span className="font-mono font-medium">{version}</span>.
        </p>
        
        <div className="mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Code cũ sẽ bị ghi đè hoàn toàn</li>
                  <li>Self-QA checklist sẽ bị xóa</li>
                  <li>Bạn cần test và gửi QC lại</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Logic trạng thái:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Chưa publish:</strong> Giữ nguyên trạng thái hiện tại</li>
                  <li><strong>Đã publish:</strong> Reset về "Nháp" (phải test lại từ đầu)</li>
                </ul>
              </div>
            </div>
          </div>
          
          <label className="block text-sm font-medium text-slate-700 mb-2">Chọn file ZIP mới:</label>
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".zip"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-slate-500 mt-1">Chỉ chấp nhận file .zip</p>
          {file && (
            <p className="text-xs text-green-600 mt-1">Đã chọn: {file.name}</p>
          )}
        </div>
        
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleUpdate}
            disabled={!file || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang cập nhật...' : 'Xác nhận cập nhật'}
          </button>
        </div>
      </div>
    </div>
  );
}
