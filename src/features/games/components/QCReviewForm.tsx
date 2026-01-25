"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQCPass, useQCFail, useGameHistory } from "@/features/games";
import { apiPost } from "@/lib/api-fetch";
import { StatusChip } from "@/components/ui/StatusChip";

interface QCReviewFormProps {
  gameId: string;
  versionId: string;
  game: {
    _id: string;
    gameId: string;
    title: string;
    description?: string;
  };
  version: {
    _id: string;
    version: string;
    status: string;
    qaSummary?: any;
  };
  reviewerName: string;
}

// Auto test result types
interface AutoTestResult {
  testId: string;
  passed: boolean;
  message?: string;
  duration?: number;
  details?: any;
}

interface SDKTestProgress {
  phase: "idle" | "initializing" | "running" | "completed" | "error";
  currentTest?: string;
  progress: number;
  results: AutoTestResult[];
  error?: string;
}

interface QATest {
  id: string;
  category: string;
  name: string;
  description: string;
  passed: boolean | null;
  notes: string;
  isAutoTest?: boolean;
}

interface TestCategory {
  id: string;
  name: string;
  icon: string;
  tests: QATest[];
}

export function QCReviewForm({
  gameId,
  versionId,
  game,
  version,
  reviewerName,
}: QCReviewFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("sdk");

  // QC Review mutations
  const qcPassMutation = useQCPass();
  const qcFailMutation = useQCFail();
  const isSubmitting = qcPassMutation.isPending || qcFailMutation.isPending;

  // Auto test state
  const [autoTestProgress, setAutoTestProgress] = useState<SDKTestProgress>({
    phase: "idle",
    progress: 0,
    results: [],
  });
  const [isRunningAutoTests, setIsRunningAutoTests] = useState(false);
  const [showRawResult, setShowRawResult] = useState(false);
  const [rawResult, setRawResult] = useState<any>(null);

  // Fetch History
  const { data: history = [], refetch: refetchHistory } = useGameHistory(
    gameId,
    versionId,
  );

  const initialCategories = [
    {
      id: "sdk",
      name: "Tích hợp SDK (Auto)",
      icon: "🔌",
      tests: [
        {
          id: "sdk_handshake",
          category: "sdk",
          name: "SDK Handshake",
          description:
            "Kiểm tra khởi tạo SDK và vòng đời game (init → ready → quit → complete)",
          passed: null,
          notes: "",
          isAutoTest: true,
        },
        {
          id: "sdk_events",
          category: "sdk",
          name: "SDK Events",
          description:
            "Kiểm tra các sự kiện SDK được gửi đúng (onReady, onQuit, onComplete)",
          passed: null,
          notes: "",
          isAutoTest: true,
        },
        {
          id: "sdk_data_format",
          category: "sdk",
          name: "Định dạng dữ liệu",
          description: "Kiểm tra dữ liệu kết quả game được format đúng chuẩn",
          passed: null,
          notes: "",
          isAutoTest: true,
        },
      ],
    },
    {
      id: "audio",
      name: "Âm thanh",
      icon: "🔊",
      tests: [
        {
          id: "audio_presence",
          category: "audio",
          name: "Sự hiện diện âm thanh",
          description: "Game có âm thanh nền và âm thanh hiệu ứng (SFX)",
          passed: null,
          notes: "",
        },
        {
          id: "audio_volume",
          category: "audio",
          name: "Âm lượng hợp lý",
          description: "Âm lượng cân đối, không quá to hoặc quá nhỏ",
          passed: null,
          notes: "",
        },
        {
          id: "audio_logic",
          category: "audio",
          name: "Âm đúng tình huống",
          description:
            "Âm thanh phản hồi đúng với hành động (đúng/sai/win/lose)",
          passed: null,
          notes: "",
        },
        {
          id: "audio_quality",
          category: "audio",
          name: "Chất lượng âm thanh",
          description: "Không rè, không vỡ, không trễ bất thường",
          passed: null,
          notes: "",
        },
      ],
    },
    {
      id: "visual",
      name: "Hình ảnh / Asset",
      icon: "🖼️",
      tests: [
        {
          id: "asset_completeness",
          category: "visual",
          name: "Đầy đủ Asset",
          description: "Không thiếu hình ảnh, sprite hoặc background",
          passed: null,
          notes: "",
        },
        {
          id: "asset_quality",
          category: "visual",
          name: "Chất lượng hiển thị",
          description: "Hình ảnh rõ nét, không mờ/vỡ, đúng tỉ lệ",
          passed: null,
          notes: "",
        },
        {
          id: "asset_animation",
          category: "visual",
          name: "Xử lý Sprite/Anim",
          description: "Hiệu ứng chuyển động mượt mà, không lỗi hiển thị",
          passed: null,
          notes: "",
        },
      ],
    },
    {
      id: "performance",
      name: "Hiệu năng",
      icon: "⚡",
      tests: [
        {
          id: "perf_load_time",
          category: "performance",
          name: "Thời gian tải (Auto)",
          description:
            "Game tải xong trong vòng thời gian quy định (Auto-check)",
          passed: null,
          notes: "",
          isAutoTest: true,
        },
        {
          id: "perf_fps",
          category: "performance",
          name: "Độ mượt (FPS)",
          description: "Game chạy ổn định, không giật/lag khi thao tác",
          passed: null,
          notes: "",
        },
        {
          id: "perf_resources",
          category: "performance",
          name: "Tài nguyên hệ thống",
          description:
            "Không tốn tài nguyên bất thường hoặc gây treo trình duyệt",
          passed: null,
          notes: "",
        },
      ],
    },
    {
      id: "compatibility",
      name: "Tương thích",
      icon: "📱",
      tests: [
        {
          id: "compat_devices",
          category: "compatibility",
          name: "Đa thiết bị",
          description: "Hoạt động tốt trên Desktop, Tablet và Mobile",
          passed: null,
          notes: "",
        },
        {
          id: "compat_ratio",
          category: "compatibility",
          name: "Tỉ lệ màn hình",
          description: "Hiển thị đúng trên các tỉ lệ màn hình khác nhau",
          passed: null,
          notes: "",
        },
        {
          id: "compat_input",
          category: "compatibility",
          name: "Cảm ứng / Chuột",
          description: "Phản hồi tốt với cả thao tác chạm và click chuột",
          passed: null,
          notes: "",
        },
      ],
    },
    {
      id: "content",
      name: "Nội dung & Kiến thức",
      icon: "📚",
      tests: [
        {
          id: "content_accuracy",
          category: "content",
          name: "Tính chính xác",
          description: "Sai kiến thức, sai câu chữ hoặc sai đáp án",
          passed: null,
          notes: "",
        },
        {
          id: "content_educational",
          category: "content",
          name: "Môn học & Lớp",
          description: "Nội dung phù hợp với môn học và độ tuổi quy định",
          passed: null,
          notes: "",
        },
        {
          id: "content_flow",
          category: "content",
          name: "Luồng chơi",
          description: "Hướng dẫn dễ hiểu, luồng chơi rõ ràng cho học sinh",
          passed: null,
          notes: "",
        },
      ],
    },
    {
      id: "ux",
      name: "Giao diện / UX",
      icon: "🎨",
      tests: [
        {
          id: "ux_interaction",
          category: "ux",
          name: "Tương tác nút bấm",
          description: "Nút bấm nhạy, phản hồi đúng mục đích",
          passed: null,
          notes: "",
        },
        {
          id: "ux_feedback",
          category: "ux",
          name: "Phản hồi kết quả",
          description: "Có phản hồi rõ ràng khi học sinh làm đúng/sai",
          passed: null,
          notes: "",
        },
        {
          id: "ux_completion",
          category: "ux",
          name: "Có thể hoàn thành",
          description: "Không có lỗi chặn (deadlock) khiến không thể về đích",
          passed: null,
          notes: "",
        },
      ],
    },
  ];

  // Merge with existing results if any
  const [testCategories, setTestCategories] = useState<TestCategory[]>(() => {
    if (!version.qaSummary?.categories) return initialCategories;

    return initialCategories.map((category) => {
      const savedCategory = version.qaSummary.categories[category.id];
      if (!savedCategory) return category;

      return {
        ...category,
        tests: category.tests.map((test) => {
          const savedTest = savedCategory.tests?.find(
            (t: any) => t.id === test.id,
          );
          if (!savedTest) return test;

          return {
            ...test,
            passed: savedTest.passed,
            notes: savedTest.notes || test.notes,
          };
        }),
      };
    });
  });

  const [generalNotes, setGeneralNotes] = useState("");

  // Run SDK Auto Tests
  const runAutoTests = useCallback(async () => {
    setIsRunningAutoTests(true);
    setAutoTestProgress({
      phase: "initializing",
      progress: 0,
      results: [],
      currentTest: "Khởi tạo SDK...",
    });
    setError("");

    try {
      // Call the comprehensive test API
      const data = await apiPost<any>("/api/v1/qc/run", {
        gameId: game.gameId,
        versionId: versionId,
        gameUrl: `https://storage.googleapis.com/iruka-edu-mini-game/games/${game.gameId}/${version.version}/index.html`,
        gameData: {
          id: game._id,
          game_id: game.gameId,
          title: game.title,
          description: game.description || "",
          owner_id: "",
          status: "uploaded",
          meta_data: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        versionData: {
          id: version._id,
          game_id: game.gameId,
          version: version.version,
          status: version.status,
          build_url: `https://storage.googleapis.com/iruka-edu-mini-game/games/${game.gameId}/${version.version}/index.html`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      setAutoTestProgress((prev) => ({
        ...prev,
        phase: "running",
        progress: 20,
        currentTest: "Đang chạy QA-01: SDK Handshake...",
      }));

      console.log("📊 Auto test response:", data);
      setRawResult(data);
      refetchHistory();

      const testReport = data.testReport;
      const results = testReport.qaResults;

      console.log("📋 QA Results:", results);
      console.log("📈 Overall Result:", testReport.overallResult);

      // Map API results to auto test results
      const autoTestResults: AutoTestResult[] = [];

      // QA-01: SDK Handshake
      if (results.qa01) {
        autoTestResults.push({
          testId: "sdk_handshake",
          passed: results.qa01.pass,
          message: results.qa01.pass
            ? `Khởi tạo: ${results.qa01.initToReadyMs}ms, Kết thúc: ${results.qa01.quitToCompleteMs}ms`
            : `Lỗi handshake - Khởi tạo: ${results.qa01.initToReadyMs}ms (tối đa: 10000ms)`,
          duration: results.qa01.initToReadyMs + results.qa01.quitToCompleteMs,
          details: results.qa01,
        });
      }

      setAutoTestProgress((prev) => ({
        ...prev,
        progress: 40,
        currentTest: "Đang chạy QA-02: Định dạng dữ liệu...",
      }));

      // QA-02: Data Format / Converter
      if (results.qa02) {
        autoTestResults.push({
          testId: "sdk_data_format",
          passed: results.qa02.pass,
          message: results.qa02.pass
            ? `Độ chính xác: ${(results.qa02.accuracy * 100).toFixed(1)}%, Hoàn thành: ${(results.qa02.completion * 100).toFixed(1)}%`
            : `Lỗi xác thực dữ liệu: ${results.qa02.validationErrors?.join(", ") || "Lỗi không xác định"}`,
          details: results.qa02,
        });
      }

      setAutoTestProgress((prev) => ({
        ...prev,
        progress: 60,
        currentTest: "Đang chạy QA-03: Hiệu năng...",
      }));

      // QA-03: Performance / iOS Pack
      if (results.qa03) {
        const perfPassed =
          !results.qa03.auto.assetError &&
          results.qa03.manual.noAutoplay &&
          results.qa03.manual.noWhiteScreen;

        autoTestResults.push({
          testId: "perf_load_time",
          passed: !results.qa03.auto.assetError,
          message: !results.qa03.auto.assetError
            ? `Thời gian tải tài nguyên: ${results.qa03.auto.readyMs}ms`
            : `Lỗi tải tài nguyên: ${results.qa03.auto.errorDetails?.join(", ") || "Quá thời gian"}`,
          duration: results.qa03.auto.readyMs,
          details: results.qa03.auto,
        });

        autoTestResults.push({
          testId: "perf_bundle_size",
          passed: perfPassed,
          message: perfPassed
            ? "Kích thước bundle trong giới hạn"
            : "Phát hiện vấn đề về kích thước hoặc hiệu năng",
          details: results.qa03,
        });
      }

      setAutoTestProgress((prev) => ({
        ...prev,
        progress: 80,
        currentTest: "Đang chạy QA-04: Kiểm tra trùng lặp...",
      }));

      // QA-04: Idempotency
      if (results.qa04) {
        autoTestResults.push({
          testId: "game_idempotency",
          passed: results.qa04.pass,
          message: results.qa04.pass
            ? `Không có gửi trùng, đã xác minh ${results.qa04.backendRecordCount} bản ghi`
            : `Lỗi kiểm tra trùng lặp: ${results.qa04.duplicateAttemptId ? "Phát hiện ID trùng" : "Kiểm tra nhất quán thất bại"}`,
          details: results.qa04,
        });
      }

      // SDK Events test (from QA-01 events)
      if (results.qa01?.events) {
        const hasAllEvents =
          results.qa01.events.some((e: any) => e.type === "INIT") &&
          results.qa01.events.some((e: any) => e.type === "READY") &&
          results.qa01.events.some((e: any) => e.type === "QUIT") &&
          results.qa01.events.some((e: any) => e.type === "COMPLETE");

        autoTestResults.push({
          testId: "sdk_events",
          passed: hasAllEvents,
          message: hasAllEvents
            ? "Tất cả sự kiện SDK hoạt động đúng"
            : "Thiếu sự kiện SDK lifecycle",
          details: results.qa01.events,
        });
      }

      setAutoTestProgress({
        phase: "completed",
        progress: 100,
        results: autoTestResults,
        currentTest: "Hoàn thành!",
      });

      // Update test categories with auto test results
      setTestCategories((categories) =>
        categories.map((category) => ({
          ...category,
          tests: category.tests.map((test) => {
            if (!test.isAutoTest) return test;

            const autoResult = autoTestResults.find(
              (r) => r.testId === test.id,
            );
            if (!autoResult) return test;

            return {
              ...test,
              passed: autoResult.passed,
              notes: autoResult.message || test.notes,
            };
          }),
        })),
      );
    } catch (err: any) {
      setAutoTestProgress({
        phase: "error",
        progress: 0,
        results: [],
        error: err.message || "Auto test failed",
      });
      setError(`Auto test error: ${err.message}`);
    } finally {
      setIsRunningAutoTests(false);
    }
  }, [game.gameId, versionId]);

  const updateTest = (
    testId: string,
    field: "passed" | "notes",
    value: boolean | null | string,
  ) => {
    setTestCategories((categories) =>
      categories.map((category) => ({
        ...category,
        tests: category.tests.map((test) =>
          test.id === testId ? { ...test, [field]: value } : test,
        ),
      })),
    );
  };

  const allTests = testCategories.flatMap((cat) => cat.tests);

  // Only manual tests require user input
  const manualTests = allTests.filter((test) => !test.isAutoTest);
  const manualTestsCompleted = manualTests.every(
    (test) => test.passed !== null,
  );
  const manualTestsPassed = manualTests.every((test) => test.passed === true);

  // Auto tests are informational for the reviewer, unless they have already failed
  const autoTests = allTests.filter((test) => test.isAutoTest);
  const autoTestsFailed = autoTests.filter((test) => test.passed === false);

  const failedTests = allTests.filter((test) => test.passed === false);

  const getCategoryProgress = (categoryId: string) => {
    const category = testCategories.find((c) => c.id === categoryId);
    if (!category) return { completed: 0, total: 0, passed: 0 };

    // For progress, we focus on manual tests if category implies manual work
    // But for simple "x/y" display, showing manual completion is more useful for QC action
    const categoryManualTests = category.tests.filter((t) => !t.isAutoTest);

    if (categoryManualTests.length === 0) {
      // If category is full auto (like SDK), consider it "done" or N/A for manual actions
      return {
        completed: category.tests.length,
        total: category.tests.length,
        passed: category.tests.filter((t) => t.passed === true).length,
      };
    }

    const completed = categoryManualTests.filter(
      (t) => t.passed !== null,
    ).length;
    const passed = categoryManualTests.filter((t) => t.passed === true).length;
    return { completed, total: categoryManualTests.length, passed };
  };

  const handleSubmit = async (finalDecision: "pass" | "fail") => {
    if (!manualTestsCompleted) {
      setError(
        "Vui lòng hoàn thành tất cả các mục kiểm tra thủ công (Manual Tests) trước khi submit.",
      );
      return;
    }

    // Check if failed tests have notes
    const failedWithoutNotes = failedTests.filter((test) => !test.notes.trim());
    if (failedWithoutNotes.length > 0) {
      setError("Vui lòng ghi chú lý do cho tất cả các test bị fail.");
      return;
    }

    // Warn if auto tests failed but user is trying to pass
    if (finalDecision === "pass" && autoTestsFailed.length > 0) {
      const confirmIgnore = window.confirm(
        "Cảnh báo: Có test tự động không đạt. Bạn có chắc chắn muốn Pass QC không?",
      );
      if (!confirmIgnore) return;
    }

    setError("");

    // Prepare comprehensive QA summary
    const qaSummary: any = {
      overall: finalDecision,
      categories: {},
    };

    testCategories.forEach((category) => {
      qaSummary.categories[category.id] = {
        name: category.name,
        tests: category.tests.map((test) => ({
          id: test.id,
          name: test.name,
          passed: test.passed,
          notes: test.notes,
          isAutoTest: test.isAutoTest,
        })),
      };
    });

    // Submit using appropriate mutation
    const mutation = finalDecision === "pass" ? qcPassMutation : qcFailMutation;

    mutation.mutate(
      {
        gameId,
        versionId,
        notes: generalNotes,
        qaSummary,
        reviewerName,
      },
      {
        onSuccess: () => {
          router.push("/console/qc-inbox?success=review_submitted");
          router.refresh();
        },
        onError: (err: any) => {
          setError(err.message || "Đã xảy ra lỗi khi submit review");
        },
      },
    );
  };

  const activeTests =
    testCategories.find((c) => c.id === activeCategory)?.tests || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Biểu mẫu QC Review
        </h2>
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">
            {manualTests.filter((t) => t.passed !== null).length}
          </span>
          <span className="text-slate-500">
            /{manualTests.length} manual tests
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
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
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Auto Test Panel */}
      <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h3 className="font-semibold text-slate-900">
                Kiểm tra tự động SDK
              </h3>
              {autoTestProgress.phase === "completed" && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Hoàn thành
                </span>
              )}
              {autoTestProgress.phase === "error" && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  Lỗi
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">
              Chạy kiểm tra tự động: SDK handshake, định dạng dữ liệu, hiệu năng
              và kiểm tra trùng lặp
            </p>

            {/* Progress Bar */}
            {(autoTestProgress.phase === "initializing" ||
              autoTestProgress.phase === "running") && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>{autoTestProgress.currentTest}</span>
                  <span>{autoTestProgress.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${autoTestProgress.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Results Summary */}
            {autoTestProgress.phase === "completed" &&
              autoTestProgress.results.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {autoTestProgress.results.map((result) => {
                      // Map test IDs to Vietnamese names
                      const testNameMap: Record<string, string> = {
                        sdk_handshake: "SDK Handshake",
                        sdk_data_format: "Định dạng dữ liệu",
                        sdk_events: "Sự kiện SDK",
                        perf_load_time: "Thời gian tải",
                        perf_bundle_size: "Kích thước bundle",
                        game_idempotency: "Kiểm tra trùng lặp",
                      };
                      const displayName =
                        testNameMap[result.testId] ||
                        result.testId.replace(/_/g, " ");

                      return (
                        <div
                          key={result.testId}
                          className={`inline-flex flex-col px-3 py-2 rounded-lg text-xs ${
                            result.passed
                              ? "bg-green-100 border border-green-200"
                              : "bg-red-100 border border-red-200"
                          }`}
                        >
                          <span
                            className={`font-semibold ${result.passed ? "text-green-800" : "text-red-800"}`}
                          >
                            {result.passed ? "✓" : "✗"} {displayName}
                          </span>
                          {result.message && (
                            <span
                              className={`mt-0.5 ${result.passed ? "text-green-700" : "text-red-700"}`}
                            >
                              {result.message}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Overall Summary */}
                  <div
                    className={`p-3 rounded-lg ${
                      autoTestProgress.results.every((r) => r.passed)
                        ? "bg-green-50 border border-green-200"
                        : "bg-amber-50 border border-amber-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {autoTestProgress.results.every((r) => r.passed) ? (
                        <>
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm font-medium text-green-800">
                            Tất cả kiểm tra tự động đều ĐẠT
                          </span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 text-amber-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm font-medium text-amber-800">
                            {
                              autoTestProgress.results.filter((r) => !r.passed)
                                .length
                            }{" "}
                            kiểm tra tự động KHÔNG ĐẠT - Cần xem xét thủ công
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Error Message */}
            {autoTestProgress.phase === "error" && autoTestProgress.error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {autoTestProgress.error}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runAutoTests}
              disabled={isRunningAutoTests}
              className={`px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                isRunningAutoTests
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95"
              }`}
            >
              {isRunningAutoTests ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  ĐANG CHẠY...
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
                      strokeWidth={3}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                  </svg>
                  CHẠY AUTO TEST
                </>
              )}
            </button>

            {autoTestProgress.phase === "completed" && (
              <button
                type="button"
                onClick={() => setShowRawResult(true)}
                className="px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                VIEW DIAGNOSTIC
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {testCategories.map((category) => {
            const progress = getCategoryProgress(category.id);
            const isActive = activeCategory === category.id;
            const hasAutoTestsOnly = category.tests.every((t) => t.isAutoTest);

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-sm sm:text-base">{category.icon}</span>
                  <span className="hidden sm:inline">{category.name}</span>
                  <span className="sm:hidden">
                    {category.name.split(" ")[0]}
                  </span>
                  {!hasAutoTestsOnly && (
                    <span className="text-[10px] sm:text-xs bg-slate-100 px-1 sm:px-1.5 py-0.5 rounded-full text-slate-600">
                      {progress.completed}/{progress.total}
                    </span>
                  )}
                  {hasAutoTestsOnly && (
                    <span className="text-[10px] sm:text-xs bg-blue-50 text-blue-600 px-1 sm:px-1.5 py-0.5 rounded-full">
                      Auto
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Category Tests */}
      <div className="space-y-4 mb-8">
        {activeTests.map((test) => (
          <div
            key={test.id}
            className="border border-slate-200 rounded-lg p-4 sm:p-5 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                    {test.name}
                  </h3>
                  {test.isAutoTest && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded flex items-center gap-1 shrink-0">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                      Auto Check
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  {test.description}
                </p>
              </div>
            </div>

            {/* Pass/Fail Toggle - Only for Manual Tests */}
            {!test.isAutoTest ? (
              <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
                <span className="text-xs sm:text-sm text-slate-700 font-medium shrink-0">
                  Kết quả:
                </span>
                <button
                  type="button"
                  onClick={() => updateTest(test.id, "passed", true)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    test.passed === true
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ✓ Đạt
                </button>
                <button
                  type="button"
                  onClick={() => updateTest(test.id, "passed", false)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    test.passed === false
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ✗ Không đạt
                </button>
              </div>
            ) : (
              // Auto Test Info View
              <div className="mb-3">
                {test.passed === true && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <svg
                      className="w-4 sm:w-5 sm:h-5 h-4 text-green-600 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-green-800">
                      Hệ thống đánh giá: Đạt
                    </span>
                  </div>
                )}
                {test.passed === false && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <svg
                      className="w-4 sm:w-5 h-4 sm:h-5 text-red-600 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-red-800">
                      Hệ thống đánh giá: Không đạt
                    </span>
                  </div>
                )}
                {test.passed === null && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs sm:text-sm text-slate-500 italic flex items-center gap-2">
                      <svg
                        className="w-3 sm:w-4 h-3 sm:h-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Đang chờ kết quả từ hệ thống SDK...
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes - Only show for manual tests or if auto test failed */}
            {(!test.isAutoTest || test.passed === false) && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                  Ghi chú{" "}
                  {test.passed === false && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <textarea
                  value={test.notes}
                  onChange={(e) => updateTest(test.id, "notes", e.target.value)}
                  placeholder={
                    test.passed === false
                      ? "Giải thích lý do test không đạt..."
                      : "Ghi chú thêm (không bắt buộc)..."
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* General Notes */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Nhận xét chung
        </label>
        <textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="Thêm nhận xét, góp ý chung về game..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          rows={4}
        />
      </div>

      {/* Summary */}
      <div className="bg-linear-to-br from-slate-50 to-slate-100 rounded-lg p-5 mb-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Tổng kết Review</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-slate-600 mb-1">Manual Completed</div>
            <div className="text-2xl font-bold text-slate-900">
              {manualTests.filter((t) => t.passed !== null).length}
              <span className="text-sm text-slate-500 font-normal">
                /{manualTests.length}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-slate-600 mb-1">Manual Passed</div>
            <div className="text-2xl font-bold text-green-600">
              {manualTests.filter((t) => t.passed === true).length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-slate-600 mb-1">Auto Tests</div>
            <div className="text-2xl font-bold text-blue-600">
              {autoTests.length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-slate-600 mb-1">Kết luận</div>
            <div
              className={`text-2xl font-bold ${
                manualTestsCompleted
                  ? manualTestsPassed && autoTestsFailed.length === 0
                    ? "text-green-600"
                    : "text-red-600"
                  : "text-slate-400"
              }`}
            >
              {manualTestsCompleted
                ? manualTestsPassed && autoTestsFailed.length === 0
                  ? "ĐẠT"
                  : "FAIL"
                : "Chưa xong"}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-2">
          {testCategories.map((category) => {
            const hasAutoOnly = category.tests.every((t) => t.isAutoTest);
            const progress = getCategoryProgress(category.id);
            const percentage =
              progress.total > 0
                ? (progress.completed / progress.total) * 100
                : hasAutoOnly
                  ? 100
                  : 0;

            return (
              <div key={category.id} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-32 flex items-center gap-1">
                  {category.icon} {category.name}
                  {hasAutoOnly && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded">
                      Auto
                    </span>
                  )}
                </span>
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      hasAutoOnly ? "bg-blue-400" : "bg-indigo-600"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-slate-600 w-16 text-right">
                  {hasAutoOnly
                    ? "Auto"
                    : `${progress.completed}/${progress.total}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={() => handleSubmit("pass")}
          disabled={!manualTestsCompleted || !manualTestsPassed || isSubmitting}
          className="flex-1 px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm text-sm sm:text-base"
        >
          {isSubmitting ? "Đang gửi..." : "✓ Duyệt (Pass QC)"}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit("fail")}
          disabled={!manualTestsCompleted || isSubmitting}
          className="flex-1 px-4 sm:px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm text-sm sm:text-base"
        >
          {isSubmitting ? "Đang gửi..." : "✗ Từ chối (Fail QC)"}
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-4 text-center">
        {manualTestsCompleted
          ? "Bạn đã hoàn thành kiểm tra thủ công. Kết quả auto-test sẽ được hệ thống cập nhật sau."
          : `⏳ Vui lòng hoàn thành ${
              manualTests.filter((t) => t.passed === null).length
            } mục kiểm tra thủ công (Manual Tests) còn lại.`}
      </p>

      {/* Add scrollbar hide utility */}
      {/* Raw JSON Diagnostic View */}
      {showRawResult && rawResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight">
                    Raw Diagnostic Logs
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    JSON Output for Engineering Debug
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRawResult(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
            <div className="flex-1 overflow-auto p-6 bg-slate-950 font-mono text-[12px] text-emerald-400 leading-relaxed custom-scrollbar">
              <pre>{JSON.stringify(rawResult, null, 2)}</pre>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowRawResult(false)}
                className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95"
              >
                Đóng logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QC Test History Section */}
      <div className="mt-12 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-bold text-slate-900">Lịch sử QC Runner</h3>
          </div>
          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
            {history.length} Reports
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {history.length > 0 ? (
            history.map((report: any, idx: number) => (
              <div
                key={idx}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${report.passed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                  >
                    {report.passed ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Report #{history.length - idx}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${report.passed ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"}`}
                      >
                        {report.passed ? "PASS" : "FAIL"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                      {new Date(
                        report.timestamp || report.created_at,
                      ).toLocaleString("vi-VN")}{" "}
                      • By: {report.tested_by || "Auto Runner"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRawResult(report.rawResult || report);
                    setShowRawResult(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl"
                >
                  Xem chi tiết
                </button>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm italic">
                Chưa có lịch sử chạy test cho version này.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
