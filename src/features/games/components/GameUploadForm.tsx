"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createGame,
  uploadBuild,
  uploadThumbnail,
} from "@/features/games/api/gameMutations";
import { 
  useSubjects, 
  useAgeBands,
  useLevels, 
  useSkills, 
  useThemes 
} from "@/features/game-lessons/hooks/useGameLessons";

interface GameMeta {
  grade: string;
  subject: string;
  lessonNo: string;
  backendGameId: string;
  gameId: string;
  level: string;
  skills: string[];
  themes: string[];
  linkGithub: string;
  quyenSach: string;
}

interface GameUploadFormProps {
  meta: GameMeta;
}

interface ManifestData {
  gameId: string;
  version: string;
  runtime: string;
  entryPoint: string;
  difficulty: string; // Required field
  targetAge: string; // Age range based on grade
}

interface ThumbnailData {
  file: File | null;
  preview: string | null;
}

// Difficulty options - can be made dynamic later if needed
const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Dễ - Phù hợp học sinh yếu" },
  { value: "medium", label: "Trung bình - Phù hợp học sinh khá" },
  { value: "hard", label: "Khó - Phù hợp học sinh giỏi" },
  { value: "expert", label: "Rất khó - Thử thách cao" },
] as const;

export function GameUploadForm({ meta }: GameUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const desktopThumbRef = useRef<HTMLInputElement>(null);
  const mobileThumbRef = useRef<HTMLInputElement>(null);

  // Fetch data from game-lessons API
  const { data: subjects } = useSubjects();
  const { data: ageBands } = useAgeBands();
  const { data: levels } = useLevels();
  const { data: skills } = useSkills();
  const { data: themes } = useThemes();

  // Helper functions to get names from API data
  const getSubjectName = (subjectId: string) => {
    const subject = subjects?.find(s => s.id === subjectId || s.code === subjectId);
    return subject?.name || subjectId;
  };

  const getAgeBandByGrade = (grade: string) => {
    // Map Vietnamese grade to age band
    const gradeToAge: Record<string, string> = {
      "1": "6-7",
      "2": "7-8", 
      "3": "8-9",
      "4": "9-10",
      "5": "10-11",
      "6": "11-12",
      "7": "12-13",
      "8": "13-14",
      "9": "14-15",
      "10": "15-16",
      "11": "16-17",
      "12": "17-18",
    };
    
    const ageRange = gradeToAge[grade];
    if (!ageRange || !ageBands) return "Chưa xác định";
    
    const [minAge, maxAge] = ageRange.split("-").map(Number);
    const ageBand = ageBands.find(ab => 
      ab.min_age === minAge && ab.max_age === maxAge
    );
    
    return ageBand?.name || `${minAge}-${maxAge} tuổi`;
  };

  const getLevelName = (levelId: string) => {
    const level = levels?.find(l => l.id === levelId);
    return level?.name || levelId;
  };

  // ZIP file state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileSizeWarning, setFileSizeWarning] = useState<string>("");

  // Thumbnail states
  const [desktopThumbnail, setDesktopThumbnail] = useState<ThumbnailData>({
    file: null,
    preview: null,
  });
  const [mobileThumbnail, setMobileThumbnail] = useState<ThumbnailData>({
    file: null,
    preview: null,
  });

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");
  const [error, setError] = useState("");

  const [manifest, setManifest] = useState<ManifestData>({
    gameId: meta.gameId || "my-awesome-game",
    version: "1.0.0",
    runtime: "HTML5",
    entryPoint: "index.html",
    difficulty: meta.level || "", // Use level from meta (1/2/3)
    targetAge: getAgeBandByGrade(meta.grade),
  });

  // Game ID edit mode
  const [isEditingGameId, setIsEditingGameId] = useState(false);
  const [editedGameId, setEditedGameId] = useState(meta.backendGameId || "");
  const [gameIdError, setGameIdError] = useState("");

  // Auto-detect SDK and check for duplicates
  const [sdkDetected, setSdkDetected] = useState<string | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<{
    checking: boolean;
    exists: boolean;
    message: string;
  }>({ checking: false, exists: false, message: "" });

  // Update targetAge when grade changes or ageBands data loads
  useEffect(() => {
    setManifest(prev => ({
      ...prev,
      targetAge: getAgeBandByGrade(meta.grade)
    }));
  }, [meta.grade, ageBands]);

  // Auto-detect SDK when ZIP file is selected
  const detectSDK = async (file: File) => {
    try {
      // This is a simplified SDK detection - in real implementation,
      // you would analyze the ZIP contents
      const fileName = file.name.toLowerCase();

      if (fileName.includes("unity") || fileName.includes("webgl")) {
        setSdkDetected("Unity WebGL");
        setManifest((prev) => ({ ...prev, runtime: "Unity" }));
      } else if (fileName.includes("construct") || fileName.includes("c3")) {
        setSdkDetected("Construct 3");
        setManifest((prev) => ({ ...prev, runtime: "HTML5" }));
      } else if (fileName.includes("phaser")) {
        setSdkDetected("Phaser");
        setManifest((prev) => ({ ...prev, runtime: "HTML5" }));
      } else {
        setSdkDetected("HTML5 Generic");
        setManifest((prev) => ({ ...prev, runtime: "HTML5" }));
      }
    } catch (error) {
      console.warn("SDK detection failed:", error);
      setSdkDetected("Unknown");
    }
  };

  // Check for duplicate gameId
  const checkDuplicateGameId = async (gameId: string) => {
    if (!gameId || gameId.length < 3) return;

    setDuplicateCheck({
      checking: true,
      exists: false,
      message: "Đang kiểm tra...",
    });

    try {
      const response = await fetch(
        `/api/games/check-duplicate?gameId=${encodeURIComponent(gameId)}`,
      );
      const data = await response.json();

      if (data.exists) {
        setDuplicateCheck({
          checking: false,
          exists: true,
          message: `Game ID "${gameId}" đã tồn tại. Bạn có thể upload version mới hoặc chọn ID khác.`,
        });
      } else {
        setDuplicateCheck({
          checking: false,
          exists: false,
          message: `Game ID "${gameId}" có thể sử dụng.`,
        });
      }
    } catch (error) {
      setDuplicateCheck({
        checking: false,
        exists: false,
        message: "Không thể kiểm tra duplicate. Vui lòng thử lại.",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Handle ZIP file selection with SDK detection
  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      setError("Vui lòng chọn file ZIP");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("File quá lớn. Tối đa 100MB");
      return;
    }

    // Check file size and show warning if > 4MB
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 4) {
      setFileSizeWarning(
        `File có dung lượng ${sizeMB.toFixed(1)}MB, lớn hơn khuyến nghị (3-4MB). ` +
          `Điều này có thể ảnh hưởng đến tốc độ tải game cho học sinh. ` +
          `Bạn vẫn có thể upload nhưng nên tối ưu lại game để giảm dung lượng.`,
      );
    } else if (sizeMB > 3) {
      setFileSizeWarning(
        `File có dung lượng ${sizeMB.toFixed(1)}MB, gần đạt giới hạn khuyến nghị (3-4MB). ` +
          `Nên kiểm tra và tối ưu nếu có thể.`,
      );
    } else {
      setFileSizeWarning("");
    }

    setUploadedFile(file);
    setError("");

    // Auto-detect SDK
    await detectSDK(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFileSelect(files[0]);
    }
  };

  // Handle thumbnail selection
  const handleThumbnailSelect = (file: File, type: "desktop" | "mobile") => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh (PNG, JPG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh quá lớn. Tối đa 5MB");
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);

    if (type === "desktop") {
      // Revoke old preview URL
      if (desktopThumbnail.preview)
        URL.revokeObjectURL(desktopThumbnail.preview);
      setDesktopThumbnail({ file, preview });
    } else {
      if (mobileThumbnail.preview) URL.revokeObjectURL(mobileThumbnail.preview);
      setMobileThumbnail({ file, preview });
    }
    setError("");
  };

  const removeThumbnail = (type: "desktop" | "mobile") => {
    if (type === "desktop") {
      if (desktopThumbnail.preview)
        URL.revokeObjectURL(desktopThumbnail.preview);
      setDesktopThumbnail({ file: null, preview: null });
    } else {
      if (mobileThumbnail.preview) URL.revokeObjectURL(mobileThumbnail.preview);
      setMobileThumbnail({ file: null, preview: null });
    }
  };

  const handlePublish = async () => {
    if (!uploadedFile) {
      setError("Vui lòng chọn file ZIP game");
      return;
    }

    setUploading(true);
    setError("");
    setGameIdError("");
    setUploadProgress(0);

    try {
      // Step 1: Create game record using API function
      setUploadStep("Đang tạo game...");

      const createPayload = {
        id: meta.backendGameId,
        title: manifest.gameId,
        gameId: manifest.gameId,
        description: `Game được tải lên từ ${meta.linkGithub}`,
        githubLink: meta.linkGithub,
        gameType: "html5",
        priority: "medium",
        lessonIds: [meta.lessonNo],
        skillIds: meta.skills,
        themeIds: meta.themes,
        levelId: meta.level,
        tags: [],
        version: manifest.version,
        entryFile: manifest.entryPoint,
      };

      const createData = await createGame(createPayload);
      setUploadProgress(15);

      const gameId = createData.game?.game_id;
      if (!gameId) {
        throw new Error("Không tìm thấy Game ID");
      }

      setUploadProgress(25);

      // Step 2: Upload ZIP file using API function
      setUploadStep("Đang tải file game lên...");
      const buildFormData = new FormData();
      buildFormData.append("file", uploadedFile);
      buildFormData.append("gameId", gameId);
      buildFormData.append("version", manifest.version);

      await uploadBuild(buildFormData, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            25 + (progressEvent.loaded / progressEvent.total) * 35,
          );
          setUploadProgress(percentCompleted);
        }
      });

      setUploadProgress(60);

      // Step 3: Upload thumbnails (if provided) using API function
      if (desktopThumbnail.file || mobileThumbnail.file) {
        setUploadStep("Đang tải thumbnail...");

        const thumbFormData = new FormData();
        thumbFormData.append("gameId", gameId);

        if (desktopThumbnail.file) {
          thumbFormData.append("thumbnailDesktop", desktopThumbnail.file);
        }
        if (mobileThumbnail.file) {
          thumbFormData.append("thumbnailMobile", mobileThumbnail.file);
        }

        try {
          await uploadThumbnail(thumbFormData, (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                60 + (progressEvent.loaded / progressEvent.total) * 30,
              );
              setUploadProgress(percentCompleted);
            }
          });
        } catch (thumbError) {
          console.warn("Thumbnail upload warning:", thumbError);
          // Don't fail the whole upload for thumbnail errors
        }
      }

      setUploadProgress(100);
      setUploadStep("Hoàn thành!");

      // Success - redirect to game detail
      setTimeout(() => {
        router.push(`/console/games/${createData.game?.id}`);
      }, 500);
    } catch (err: any) {
      // Handle duplicate game ID error
      if (
        err.message?.includes("already exists") ||
        err.message?.includes("đã tồn tại")
      ) {
        setGameIdError(
          `Game ID "${manifest.gameId}" đã tồn tại. Vui lòng chọn ID khác hoặc thêm version mới.`,
        );
        setIsEditingGameId(true);
      } else {
        setError(err.message || "Có lỗi xảy ra");
      }
      setUploadStep("");
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = uploadedFile && manifest.version;

  return (
    <div className="space-y-6">
      {/* ZIP Upload Zone */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              File Game (ZIP)
            </h3>
            <p className="text-sm text-slate-500">
              Tải lên file ZIP chứa game HTML5. Khuyến nghị 3-4MB, tối đa 100MB.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-medium text-blue-700">
              Khuyến nghị: 3-4MB
            </span>
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            uploadedFile
              ? "border-green-400 bg-green-50"
              : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50"
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

          {uploadedFile ? (
            <div>
              <svg
                className="w-12 h-12 mx-auto text-green-500 mb-3"
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
              <p className="font-medium text-slate-900">{uploadedFile.name}</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-sm text-slate-500">
                  {formatFileSize(uploadedFile.size)}
                </p>
                {uploadedFile.size > 4 * 1024 * 1024 && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                    Lớn hơn khuyến nghị
                  </span>
                )}
                {uploadedFile.size > 3 * 1024 * 1024 &&
                  uploadedFile.size <= 4 * 1024 * 1024 && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                      Gần giới hạn
                    </span>
                  )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFile(null);
                  setFileSizeWarning("");
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                Xóa file
              </button>
            </div>
          ) : (
            <div>
              <svg
                className="w-12 h-12 mx-auto text-slate-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="font-medium text-slate-700">
                Kéo thả file ZIP vào đây
              </p>
              <p className="text-sm text-slate-500">hoặc click để chọn file</p>
            </div>
          )}
        </div>

        {/* File Size Warning */}
        {fileSizeWarning && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                  ⚠️ Cảnh báo dung lượng file
                </h4>
                <p className="text-sm text-yellow-800">{fileSizeWarning}</p>
                <div className="mt-2 text-xs text-yellow-700">
                  <p className="font-medium mb-1">Gợi ý tối ưu:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>Nén ảnh PNG/JPG (sử dụng TinyPNG, ImageOptim)</li>
                    <li>
                      Chuyển audio sang MP3 với bitrate thấp hơn (64-128kbps)
                    </li>
                    <li>Xóa các file không sử dụng (fonts, assets dư thừa)</li>
                    <li>Minify JavaScript và CSS</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ZIP Structure Info */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                🔍 Tự động phát hiện cấu trúc ZIP & SDK
              </h4>
              <p className="text-sm text-blue-700">
                Hệ thống sẽ tự động tìm thư mục chứa{" "}
                <code className="bg-blue-100 px-1 rounded">index.html</code> và
                coi đó là root của game. Các thư mục như{" "}
                <code className="bg-blue-100 px-1 rounded">build/</code>,{" "}
                <code className="bg-blue-100 px-1 rounded">dist/</code>,
                <code className="bg-blue-100 px-1 rounded">src/</code> sẽ được
                xử lý tự động.
              </p>
              {sdkDetected && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-green-600"
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
                    <span className="text-sm font-semibold text-green-800">
                      SDK đã được phát hiện tự động!
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-700">
                      Loại SDK:
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium border border-green-300">
                      🎮 {sdkDetected}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Runtime đã được tự động cài đặt thành "{manifest.runtime}"
                    dựa trên SDK phát hiện.
                  </p>
                </div>
              )}
              {!sdkDetected && uploadedFile && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-4 h-4 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-yellow-800">
                      Đang phân tích SDK...
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700">
                    Hệ thống đang phân tích file để xác định loại SDK. Vui lòng
                    đợi một chút.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
            <div
              onClick={() => desktopThumbRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors ${
                desktopThumbnail.preview
                  ? "border-green-400"
                  : "border-slate-300 hover:border-indigo-400"
              }`}
              style={{ aspectRatio: "308/211" }}
            >
              <input
                ref={desktopThumbRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleThumbnailSelect(e.target.files[0], "desktop")
                }
                className="hidden"
              />

              {desktopThumbnail.preview ? (
                <>
                  <Image
                    src={desktopThumbnail.preview}
                    alt="Desktop thumbnail"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeThumbnail("desktop");
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <svg
                    className="w-8 h-8 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs">308 × 211</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mobile (343×170)
            </label>
            <div
              onClick={() => mobileThumbRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors ${
                mobileThumbnail.preview
                  ? "border-green-400"
                  : "border-slate-300 hover:border-indigo-400"
              }`}
              style={{ aspectRatio: "343/170" }}
            >
              <input
                ref={mobileThumbRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleThumbnailSelect(e.target.files[0], "mobile")
                }
                className="hidden"
              />

              {mobileThumbnail.preview ? (
                <>
                  <Image
                    src={mobileThumbnail.preview}
                    alt="Mobile thumbnail"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeThumbnail("mobile");
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <svg
                    className="w-8 h-8 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs">343 × 170</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manifest Form - Simplified */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Thông tin phiên bản
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Chỉ cần nhập số phiên bản. Các thông tin khác đã được điền từ bước
          trước.
        </p>

        <div className="max-w-md space-y-4">
          {/* Version Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Version <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={manifest.version}
              onChange={(e) =>
                setManifest({ ...manifest, version: e.target.value })
              }
              placeholder="1.0.0"
              pattern="^\d+\.\d+\.\d+$"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Định dạng SemVer: X.Y.Z (VD: 1.0.0, 1.2.3)
            </p>
          </div>

          {/* Game ID Error & Edit */}
          {gameIdError && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900 mb-1">
                    Game ID đã tồn tại
                  </h4>
                  <p className="text-sm text-red-700">{gameIdError}</p>
                </div>
              </div>

              {isEditingGameId ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-red-900 mb-2">
                      Nhập Game ID mới:
                    </label>
                    <input
                      type="text"
                      value={editedGameId}
                      onChange={(e) => setEditedGameId(e.target.value)}
                      placeholder="com.iruka.my-new-game"
                      pattern="^[a-z0-9.-]+$"
                      className="w-full px-3 py-2.5 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-sm"
                    />
                    <p className="text-xs text-red-600 mt-1.5">
                      Chỉ được dùng chữ thường, số, dấu chấm và gạch ngang
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!editedGameId || editedGameId === manifest.gameId) {
                          return;
                        }
                        setManifest({ ...manifest, gameId: editedGameId });
                        setGameIdError("");
                        setIsEditingGameId(false);
                      }}
                      disabled={
                        !editedGameId || editedGameId === manifest.gameId
                      }
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-all"
                    >
                      Cập nhật Game ID
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingGameId(false);
                        setGameIdError("");
                        setEditedGameId(manifest.gameId);
                      }}
                      className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-all"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingGameId(true)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-all"
                >
                  Sửa Game ID
                </button>
              )}
            </div>
          )}

          {/* Advanced Settings - Collapsed */}
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900 select-none">
              <svg
                className="w-4 h-4 transition-transform group-open:rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Cài đặt nâng cao (tùy chọn)
            </summary>

            <div className="mt-4 pl-6 space-y-4 border-l-2 border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Runtime
                </label>
                <select
                  value={manifest.runtime}
                  onChange={(e) =>
                    setManifest({ ...manifest, runtime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="HTML5">HTML5</option>
                  <option value="Unity">Unity WebGL</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {sdkDetected && `Tự động phát hiện: ${sdkDetected}`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Entry Point
                </label>
                <input
                  type="text"
                  value={manifest.entryPoint}
                  onChange={(e) =>
                    setManifest({ ...manifest, entryPoint: e.target.value })
                  }
                  placeholder="index.html"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  File HTML chính để khởi chạy game
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Summary of metadata from previous step */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">
            Thông tin từ bước trước:
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Game ID (GCS):</span>
              <code className="px-2 py-0.5 bg-slate-100 rounded text-slate-900 font-mono text-xs">
                {manifest.gameId}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Lớp:</span>
              <span className="font-medium text-slate-900">{meta.grade}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Môn:</span>
              <span className="font-medium text-slate-900">{getSubjectName(meta.subject)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Độ khó:</span>
              <span className="font-medium text-slate-900">
                {getLevelName(meta.level) || (meta.level === "1"
                  ? "🌱 Làm quen"
                  : meta.level === "2"
                    ? "⭐ Tiến bộ"
                    : "🔥 Thử thách")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Tuổi:</span>
              <span className="font-medium text-slate-900">{manifest.targetAge}</span>
            </div>
            {meta.skills.length > 0 && (
              <div className="col-span-2 flex items-start gap-2">
                <span className="text-slate-500 shrink-0">Kỹ năng:</span>
                <span className="font-medium text-slate-900">
                  {meta.skills.map(skillId => {
                    const skill = skills?.find(s => s.id === skillId);
                    return skill?.name || skillId;
                  }).join(', ')}
                </span>
              </div>
            )}
            {meta.themes.length > 0 && (
              <div className="col-span-2 flex items-start gap-2">
                <span className="text-slate-500 shrink-0">Chủ đề:</span>
                <span className="font-medium text-slate-900">
                  {meta.themes.map(themeId => {
                    const theme = themes?.find(t => t.id === themeId);
                    return theme?.name || themeId;
                  }).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-700">
              {uploadStep}
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-right">
            {uploadProgress}%
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <svg
            className="w-5 h-5 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Hủy
        </button>
        <button
          onClick={handlePublish}
          disabled={uploading || !canSubmit}
          className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang xử lý...
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Đăng Game
            </>
          )}
        </button>
      </div>
    </div>
  );
}
