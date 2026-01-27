"use client";

import { useState } from "react";
import { useUpdateSelfQA } from "@/features/games";
import type {
  SelfQAChecklist as SelfQAChecklistType,
  SelfQAItem,
} from "@/features/games/types";

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
    id: "testedDevices",
    label: "Đã test trên thiết bị",
    description: "Đảm bảo game hoạt động tốt trên cả mobile và desktop",
  },
  {
    id: "testedAudio",
    label: "Âm thanh hoạt động tốt",
    description: "Kiểm tra nhạc nền, hiệu ứng âm thanh và lồng tiếng",
  },
  {
    id: "gameplayComplete",
    label: "Gameplay hoàn chỉnh",
    description: "Người chơi có thể hoàn thành game mà không gặp lỗi logic",
  },
  {
    id: "contentVerified",
    label: "Nội dung chính xác",
    description:
      "Đã kiểm tra text, câu hỏi, đáp án theo đúng yêu cầu chuyên môn",
  },
];

export function SelfQAChecklist({
  gameId,
  versionId,
  selfQa,
  canEdit,
}: SelfQAChecklistProps) {
  const [checklist, setChecklist] = useState<SelfQA>(selfQa);
  const [note, setNote] = useState(selfQa.note || "");

  const { mutate: saveSelfQA, isPending: saving } = useUpdateSelfQA();

  const handleCheckChange = (itemId: keyof SelfQA) => {
    if (!canEdit) return;
    setChecklist((prev) => ({
      ...prev,
      [itemId]: !prev[itemId], // Toggle boolean value
    }));
  };

  const handleSave = () => {
    // Transform flat checklist to API expected format
    const items: SelfQAItem[] = checklistItems.map((item) => ({
      id: item.id,
      label: item.label,
      checked: !!checklist[item.id as keyof SelfQA],
      checked_at: checklist[item.id as keyof SelfQA]
        ? new Date().toISOString()
        : undefined,
    }));

    const payload: SelfQAChecklistType = {
      items,
      note,
      versionId,
    };

    saveSelfQA(
      { gameId, checklist: payload },
      {
        onSuccess: (data) => {
          // Update state from response data
          if (data && data.buildData && data.buildData.selfQAChecklist) {
            const responseChecklist = data.buildData.selfQAChecklist;
            const newChecklistState = { ...checklist };

            // Map items array back to flat state
            if (
              responseChecklist.items &&
              Array.isArray(responseChecklist.items)
            ) {
              responseChecklist.items.forEach((item) => {
                // Check if item.id exists in our known keys
                if (checklistItems.some((i) => i.id === item.id)) {
                  (newChecklistState as any)[item.id] = item.checked;
                }
              });
            }

            setChecklist(newChecklistState);
            if (responseChecklist.note) {
              setNote(responseChecklist.note);
            }
          }
          alert("Lưu checklist thành công!");
        },
        onError: (error: any) => {
          console.error("Error saving self-QA:", error);
          alert("Có lỗi xảy ra khi lưu. Vui lòng thử lại.");
        },
      },
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-indigo-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Danh sách tự kiểm tra (Self-QA)
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Vui lòng kiểm tra kỹ các hạng mục trước khi gửi QC
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checklistItems.map((item) => {
          const isChecked = checklist[item.id as keyof SelfQA] as boolean;
          return (
            <label
              key={item.id}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                isChecked
                  ? "border-emerald-100 bg-emerald-50/20"
                  : "border-slate-50 bg-slate-50/50"
              } ${canEdit ? "cursor-pointer hover:border-indigo-100 hover:bg-white hover:shadow-md hover:-translate-y-1" : ""}`}
            >
              <div className="relative flex items-center mt-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckChange(item.id as keyof SelfQA)}
                  disabled={!canEdit}
                  className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all checked:border-indigo-600"
                />
              </div>
              <div>
                <span
                  className={`font-bold block text-sm mb-1 ${isChecked ? "text-slate-900" : "text-slate-600"}`}
                >
                  {item.label}
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {canEdit && (
        <div className="mt-8 pt-8 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Ghi chú cho QC
          </label>
          <div className="relative group">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-sm border-2 border-slate-100 rounded-xl bg-slate-50/30 focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
              placeholder="Ví dụ: Cần chú ý phần âm thanh ở màn 3..."
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                saving
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-100 active:scale-95"
              }`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang lưu...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  Lưu Checklist
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
