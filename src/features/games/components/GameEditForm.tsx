"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUpdateGame, useUploadThumbnail } from "@/features/games";
import type { UpdateGamePayload } from "@/features/games/types";

interface GameData {
  _id: string;
  gameId: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  unit: string;
  gameType: string;
  // Additional fields
  lesson?: string[];
  level?: string;
  skills?: string[];
  themes?: string[];
  linkGithub?: string;
  quyenSach?: string;
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
}

interface GameEditFormProps {
  game: GameData;
}

interface ThumbnailData {
  file: File | null;
  preview: string | null;
}

// Backend options
const SKILLS_OPTIONS = [
  { id: "1", name: "Tô màu cơ bản" },
  { id: "2", name: "Tô theo mẫu - Theo gợi ý" },
  { id: "3", name: "Nhận diện hình & Chi tiết qua tô" },
  { id: "4", name: "Điều khiển nét & tay" },
  { id: "5", name: "Hoàn thiện hình/ Bổ sung nhẹ" },
  { id: "6", name: "Tạo hình theo chủ đề" },
];

const THEMES_OPTIONS = [
  { id: "1", name: "Động vật" },
  { id: "2", name: "Xe cộ" },
  { id: "3", name: "Đồ chơi" },
  { id: "4", name: "Âm nhạc" },
  { id: "5", name: "Trái cây" },
  { id: "6", name: "Rau củ" },
  { id: "7", name: "Thiên nhiên – hoa lá" },
  { id: "8", name: "Ngữ cảnh đời sống gần gũi" },
];

const LEVELS_OPTIONS = [
  { id: "1", name: "Làm quen" },
  { id: "2", name: "Tiến bộ" },
  { id: "3", name: "Thử thách" },
];

export function GameEditForm({ game }: GameEditFormProps) {
  const router = useRouter();
  const desktopThumbRef = useRef<HTMLInputElement>(null);
  const mobileThumbRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: game.title || "",
    description: game.description || "",
    subject: game.subject || "",
    grade: game.grade || "",
    unit: game.unit || "",
    gameType: game.gameType || "",
    lesson: Array.isArray(game.lesson)
      ? game.lesson[0] || ""
      : game.lesson || "",
    level: game.level || "",
    skills: game.skills || [],
    themes: game.themes || [],
    linkGithub: game.linkGithub || "",
    quyenSach: game.quyenSach || "",
  });

  // Thumbnail states
  const [desktopThumbnail, setDesktopThumbnail] = useState<ThumbnailData>({
    file: null,
    preview: game.thumbnailDesktop || null,
  });
  const [mobileThumbnail, setMobileThumbnail] = useState<ThumbnailData>({
    file: null,
    preview: game.thumbnailMobile || null,
  });

  const [error, setError] = useState("");

  // Hooks
  const { mutateAsync: updateGame, isPending: isUpdating } = useUpdateGame();
  const { mutateAsync: uploadThumbnail, isPending: isUploading } =
    useUploadThumbnail();

  const isSaving = isUpdating || isUploading;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field: "skills" | "themes", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleThumbnailSelect = (type: "desktop" | "mobile", file: File) => {
    const preview = URL.createObjectURL(file);

    if (type === "desktop") {
      setDesktopThumbnail({ file, preview });
    } else {
      setMobileThumbnail({ file, preview });
    }
  };

  const removeThumbnail = (type: "desktop" | "mobile") => {
    if (type === "desktop") {
      if (desktopThumbnail.preview && desktopThumbnail.file) {
        URL.revokeObjectURL(desktopThumbnail.preview);
      }
      setDesktopThumbnail({ file: null, preview: null });
    } else {
      if (mobileThumbnail.preview && mobileThumbnail.file) {
        URL.revokeObjectURL(mobileThumbnail.preview);
      }
      setMobileThumbnail({ file: null, preview: null });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Create Update Payload
      const payload: UpdateGamePayload = {
        title: formData.title,
        description: formData.description,
        github_link: formData.linkGithub,
        meta_data: {
          gameType: formData.gameType,
          level: formData.level,
          lesson: formData.lesson ? [formData.lesson] : [],
          skills: formData.skills,
          themes: formData.themes,
          // Custom fields moved to metadata
          subject: formData.subject,
          grade: formData.grade,
          unit: formData.unit,
          quyenSach: formData.quyenSach,
        },
      };

      // Step 1: Update game metadata
      await updateGame({ gameId: game._id, payload });

      // Step 2: Upload thumbnails if provided
      if (desktopThumbnail.file || mobileThumbnail.file) {
        const thumbFormData = new FormData();
        thumbFormData.append("mongoGameId", game._id);

        if (desktopThumbnail.file) {
          thumbFormData.append("thumbnailDesktop", desktopThumbnail.file);
        }
        if (mobileThumbnail.file) {
          thumbFormData.append("thumbnailMobile", mobileThumbnail.file);
        }

        await uploadThumbnail({ formData: thumbFormData });
      }

      router.push(`/console/games/${game._id}`);
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Thông tin cơ bản
          </h3>

          {/* Title */}
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Tên game <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Subject & Grade */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Môn học <span className="text-red-500">*</span>
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Chọn môn học</option>
                <option value="math">Toán học</option>
                <option value="vietnamese">Tiếng Việt</option>
                <option value="english">Tiếng Anh</option>
                <option value="science">Khoa học</option>
                <option value="history">Lịch sử</option>
                <option value="geography">Địa lý</option>
                <option value="art">Nghệ thuật</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="grade"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Lớp <span className="text-red-500">*</span>
              </label>
              <select
                id="grade"
                name="grade"
                required
                value={formData.grade}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Chọn lớp</option>
                <option value="1">Lớp 1</option>
                <option value="2">Lớp 2</option>
                <option value="3">Lớp 3</option>
                <option value="4">Lớp 4</option>
                <option value="5">Lớp 5</option>
              </select>
            </div>
          </div>

          {/* Unit & Lesson */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="unit"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Unit SGK
              </label>
              <input
                type="text"
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="lesson"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Bài học
              </label>
              <input
                type="text"
                id="lesson"
                name="lesson"
                value={formData.lesson}
                onChange={handleChange}
                placeholder="Bài 1"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Game Type */}
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label
                htmlFor="gameType"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Loại game
              </label>
              <select
                id="gameType"
                name="gameType"
                value={formData.gameType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Chọn loại</option>
                <option value="quiz">Quiz</option>
                <option value="matching">Matching</option>
                <option value="puzzle">Puzzle</option>
                <option value="adventure">Adventure</option>
                <option value="html5">HTML5</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          {/* Quyen Sach & Github */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="quyenSach"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Quyển sách
              </label>
              <input
                type="text"
                id="quyenSach"
                name="quyenSach"
                value={formData.quyenSach}
                onChange={handleChange}
                placeholder="Tập 1"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="linkGithub"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Link Github
              </label>
              <input
                type="url"
                id="linkGithub"
                name="linkGithub"
                value={formData.linkGithub}
                onChange={handleChange}
                placeholder="https://github.com/..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Level Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Cấp độ</h3>
          <div className="grid grid-cols-3 gap-4">
            {LEVELS_OPTIONS.map((level) => (
              <label key={level.id} className="flex items-center">
                <input
                  type="radio"
                  name="level"
                  value={level.id}
                  checked={formData.level === level.id}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-slate-700">
                  {level.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Skills Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Kỹ năng</h3>
          <div className="grid grid-cols-2 gap-3">
            {SKILLS_OPTIONS.map((skill) => (
              <label key={skill.id} className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.skills.includes(skill.id)}
                  onChange={() => handleCheckboxChange("skills", skill.id)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mt-0.5"
                />
                <span className="ml-2 text-sm text-slate-700">
                  {skill.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Themes Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Chủ đề</h3>
          <div className="grid grid-cols-2 gap-3">
            {THEMES_OPTIONS.map((theme) => (
              <label key={theme.id} className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.themes.includes(theme.id)}
                  onChange={() => handleCheckboxChange("themes", theme.id)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mt-0.5"
                />
                <span className="ml-2 text-sm text-slate-700">
                  {theme.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <a
            href={`/console/games/${game._id}`}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Hủy
          </a>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>

      {/* Thumbnails Upload */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Thumbnail (Tùy chọn)
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Ảnh preview cho game. Hỗ trợ PNG, JPG, WebP. Tối đa 5MB.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Desktop Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Desktop (308×211)
            </label>

            <input
              ref={desktopThumbRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) =>
                e.target.files?.[0] &&
                handleThumbnailSelect("desktop", e.target.files[0])
              }
              className="hidden"
            />

            {desktopThumbnail.preview ? (
              <div className="relative">
                <Image
                  src={desktopThumbnail.preview}
                  alt="Desktop thumbnail"
                  width={308}
                  height={211}
                  className="w-full h-32 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => removeThumbnail("desktop")}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onClick={() => desktopThumbRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
              >
                <div className="text-center">
                  <svg
                    className="w-8 h-8 mx-auto text-slate-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <p className="text-sm text-slate-500">Thêm ảnh desktop</p>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mobile (343×170)
            </label>

            <input
              ref={mobileThumbRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) =>
                e.target.files?.[0] &&
                handleThumbnailSelect("mobile", e.target.files[0])
              }
              className="hidden"
            />

            {mobileThumbnail.preview ? (
              <div className="relative">
                <Image
                  src={mobileThumbnail.preview}
                  alt="Mobile thumbnail"
                  width={343}
                  height={170}
                  className="w-full h-32 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => removeThumbnail("mobile")}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onClick={() => mobileThumbRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
              >
                <div className="text-center">
                  <svg
                    className="w-8 h-8 mx-auto text-slate-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <p className="text-sm text-slate-500">Thêm ảnh mobile</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
