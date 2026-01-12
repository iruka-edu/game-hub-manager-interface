"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ReuploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string; // Slug e.g. com.iruka.math
  mongoGameId: string;
  version: string;
}

export function ReuploadModal({
  isOpen,
  onClose,
  gameId,
  mongoGameId,
  version,
}: ReuploadModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".zip")) {
      setError("Vui lòng chọn file ZIP");
      return;
    }
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError("File quá lớn. Tối đa 100MB");
      return;
    }
    setFile(selectedFile);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("gameId", gameId);
      formData.append("version", version);
      formData.append("mongoGameId", mongoGameId);

      const response = await fetch("/api/games/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload thất bại");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.refresh(); // Refresh content
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            Cập nhật Code (Ghi đè)
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-slate-900">
              Upload thành công!
            </h4>
            <p className="text-slate-500 mt-2">Đang tải lại trang...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-sm text-amber-800">
              Bạn đang upload đè lên phiên bản <strong>{version}</strong>. Toàn
              bộ code cũ sẽ bị xóa và thay thế bằng file mới.
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                file
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={(e) =>
                  e.target.files?.[0] && handleFileSelect(e.target.files[0])
                }
                className="hidden"
              />

              {file ? (
                <div>
                  <svg
                    className="w-10 h-10 mx-auto text-indigo-500 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="font-medium text-slate-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-xs text-red-600 hover:underline mt-2"
                  >
                    Chọn file khác
                  </button>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-slate-700">
                    Chọn file ZIP code game mới
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Chỉ hỗ trợ file .zip
                  </p>
                </div>
              )}
            </div>

            {error && <div className="text-sm text-red-600 px-1">{error}</div>}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? "Đang upload..." : "Upload & Thay thế"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
