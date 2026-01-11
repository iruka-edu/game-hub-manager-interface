'use client';

import { useState } from 'react';

interface SelfQA {
  testedDevices: boolean;
  testedAudio: boolean;
  gameplayComplete: boolean;
  contentVerified: boolean;
  note?: string;
}

interface SelfQAChecklistProps {
  gameId: string;
  versionId?: string;
  selfQa: SelfQA;
  canEdit: boolean;
}

const checklistItems = [
  {
    id: 'testedDevices',
    label: 'Đã test trên thiết bị',
    description: 'Đảm bảo game hoạt động tốt trên cả mobile và desktop',
  },
  {
    id: 'testedAudio',
    label: 'Âm thanh hoạt động tốt',
    description: 'Kiểm tra nhạc nền, hiệu ứng âm thanh và lồng tiếng',
  },
  {
    id: 'gameplayComplete',
    label: 'Gameplay hoàn chỉnh',
    description: 'Người chơi có thể hoàn thành game mà không gặp lỗi logic',
  },
  {
    id: 'contentVerified',
    label: 'Nội dung chính xác',
    description: 'Đã kiểm tra text, câu hỏi, đáp án theo đúng yêu cầu chuyên môn',
  },
];

export function SelfQAChecklist({ gameId, versionId, selfQa, canEdit }: SelfQAChecklistProps) {
  const [checklist, setChecklist] = useState<SelfQA>(selfQa);
  const [note, setNote] = useState(selfQa.note || '');
  const [saving, setSaving] = useState(false);

  const handleCheckChange = (itemId: keyof SelfQA) => {
    if (!canEdit) return;
    setChecklist((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleSave = async () => {
    if (!versionId) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/games/${gameId}/self-qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId,
          checklist: { ...checklist, note },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      // Refresh page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error saving self-QA:', error);
      alert('Có lỗi xảy ra khi lưu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Self-QA Checklist</h3>
        {canEdit && <span className="text-xs text-slate-500">Nhấn để cập nhật</span>}
      </div>

      <div className="space-y-4">
        {checklistItems.map((item) => {
          const isChecked = checklist[item.id as keyof SelfQA] as boolean;
          return (
            <label
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                isChecked ? 'border-green-100 bg-green-50/30' : 'border-slate-100'
              } ${canEdit ? 'cursor-pointer hover:border-indigo-200' : ''}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleCheckChange(item.id as keyof SelfQA)}
                disabled={!canEdit}
                className="w-5 h-5 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className={`font-medium block ${isChecked ? 'text-slate-900' : 'text-slate-500'}`}>
                  {item.label}
                </span>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            </label>
          );
        })}
      </div>

      {canEdit && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">Ghi chú cho QC</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Ví dụ: Cần chú ý phần âm thanh ở màn 3..."
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-2 px-4 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu Checklist'}
          </button>
        </div>
      )}
    </div>
  );
}
