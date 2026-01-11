'use client';

import { useState } from 'react';

interface SelfQAChecklist {
  testedDevices: boolean;
  testedAudio: boolean;
  gameplayComplete: boolean;
  contentVerified: boolean;
  note?: string;
}

interface SubmitQCModalProps {
  gameId: string;
  gameTitle: string;
  version: string;
  versionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

const checklistItems = [
  { id: 'testedDevices', label: 'Đã test trên các thiết bị (mobile, tablet, desktop)' },
  { id: 'testedAudio', label: 'Đã test âm thanh hoạt động đúng' },
  { id: 'gameplayComplete', label: 'Logic game hoạt động hoàn chỉnh' },
  { id: 'contentVerified', label: 'Nội dung đã được kiểm tra và phù hợp' },
];

export function SubmitQCModal({
  gameId,
  gameTitle,
  version,
  versionId,
  isOpen,
  onClose,
  onSubmitted,
}: SubmitQCModalProps) {
  const [checklist, setChecklist] = useState<SelfQAChecklist>({
    testedDevices: false,
    testedAudio: false,
    gameplayComplete: false,
    contentVerified: false,
  });
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const isComplete = checklist.testedDevices && checklist.testedAudio && 
                     checklist.gameplayComplete && checklist.contentVerified;

  const handleCheckChange = (field: keyof SelfQAChecklist) => {
    setChecklist((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    if (!isComplete) {
      alert('Vui lòng hoàn thành tất cả các mục trong checklist');
      return;
    }

    setLoading(true);
    try {
      // First save the self-QA checklist
      const selfQaResponse = await fetch(`/api/games/${gameId}/self-qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId,
          checklist: { ...checklist, note: note.trim() || undefined },
        }),
      });

      if (!selfQaResponse.ok) {
        const data = await selfQaResponse.json();
        throw new Error(data.error || 'Không thể lưu Self-QA checklist');
      }

      // Then submit to QC
      const submitResponse = await fetch(`/api/games/${gameId}/submit-qc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });

      if (!submitResponse.ok) {
        const data = await submitResponse.json();
        throw new Error(data.error || 'Không thể gửi QC');
      }

      onClose();
      onSubmitted?.();
    } catch (error: any) {
      alert('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Gửi game để QC kiểm tra</h3>
        <p className="text-slate-600 mb-4">
          Bạn đang gửi game "<span className="font-medium">{gameTitle}</span>" 
          phiên bản <span className="font-mono font-medium">{version}</span> để QC kiểm tra.
        </p>
        
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3">Self-QA Checklist (bắt buộc):</p>
          <div className="space-y-2">
            {checklistItems.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={checklist[item.id as keyof SelfQAChecklist] as boolean}
                  onChange={() => handleCheckChange(item.id as keyof SelfQAChecklist)}
                  className="rounded border-slate-300"
                />
                {item.label}
              </label>
            ))}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (tùy chọn):</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={2}
              placeholder="Ghi chú cho QC..."
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isComplete || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang gửi...' : 'Xác nhận gửi QC'}
          </button>
        </div>
      </div>
    </div>
  );
}
