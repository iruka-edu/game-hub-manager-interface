"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("sdk");

  // Initialize tests from version.qaSummary if available
  const initialCategories = [
    {
      id: "sdk",
      name: "Tích hợp SDK",
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
        {
          id: "sdk_error_handling",
          category: "sdk",
          name: "Xử lý lỗi SDK",
          description: "Kiểm tra game xử lý lỗi SDK một cách graceful",
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
          name: "Thời gian tải",
          description: "Game tải xong trong vòng 5 giây (3G/4G)",
          passed: null,
          notes: "",
          isAutoTest: true,
        },
        {
          id: "perf_fps",
          category: "performance",
          name: "Frame Rate",
          description: "Game chạy mượt mà ≥30 FPS trên thiết bị trung bình",
          passed: null,
          notes: "",
        },
        {
          id: "perf_memory",
          category: "performance",
          name: "Sử dụng bộ nhớ",
          description: "Game không gây memory leak, RAM ổn định",
          passed: null,
          notes: "",
        },
        {
          id: "perf_bundle_size",
          category: "performance",
          name: "Kích thước bundle",
          description: "Tổng kích thước game ≤ 20MB (nén)",
          passed: null,
          notes: "",
          isAutoTest: true,
        },
      ],
    },
    {
      id: "compatibility",
      name: "Tương thích",
      icon: "📱",
      tests: [
        {
          id: "compat_ios",
          category: "compatibility",
          name: "iOS Testing",
          description:
            "Game hoạt động tốt trên iOS (không autoplay, không white screen)",
          passed: null,
          notes: "",
        },
        {
          id: "compat_android",
          category: "compatibility",
          name: "Android Testing",
          description: "Game hoạt động tốt trên Android các phiên bản",
          passed: null,
          notes: "",
        },
        {
          id: "compat_browsers",
          category: "compatibility",
          name: "Trình duyệt",
          description: "Game chạy tốt trên Chrome, Safari, Firefox",
          passed: null,
          notes: "",
        },
        {
          id: "compat_responsive",
          category: "compatibility",
          name: "Responsive Design",
          description:
            "Game hiển thị đúng trên các kích thước màn hình (phone, tablet)",
          passed: null,
          notes: "",
        },
      ],
    },
    {
      id: "gameplay",
      name: "Gameplay",
      icon: "🎮",
      tests: [
        {
          id: "game_mechanics",
          category: "gameplay",
          name: "Game Mechanics",
          description: "Cơ chế game hoạt động đúng, không có bug logic",
          passed: null,
          notes: "",
        },
        {
          id: "game_controls",
          category: "gameplay",
          name: "Điều khiển",
          description: "Các nút bấm, gesture, keyboard hoạt động tốt",
          passed: null,
          notes: "",
        },
        {
          id: "game_feedback",
          category: "gameplay",
          name: "Phản hồi người chơi",
          description: "Game có feedback rõ ràng (âm thanh, hiệu ứng, điểm số)",
          passed: null,
          notes: "",
        },
        {
          id: "game_completion",
          category: "gameplay",
          name: "Hoàn thành game",
          description: "Có thể chơi và hoàn thành game từ đầu đến cuối",
          passed: null,
          notes: "",
        },
        {
          id: "game_idempotency",
          category: "gameplay",
          name: "Idempotency",
          description: "Xử lý đúng khi submit kết quả nhiều lần",
          passed: null,
          notes: "",
          isAutoTest: true,
        },
      ],
    },
    {
      id: "content",
      name: "Nội dung",
      icon: "📝",
      tests: [
        {
          id: "content_educational",
          category: "content",
          name: "Nội dung giáo dục",
          description: "Nội dung phù hợp với môn học, lớp học đã chọn",
          passed: null,
          notes: "",
        },
        {
          id: "content_language",
          category: "content",
          name: "Ngôn ngữ",
          description: "Không có lỗi chính tả, ngữ pháp đúng",
          passed: null,
          notes: "",
        },
        {
          id: "content_appropriate",
          category: "content",
          name: "Phù hợp độ tuổi",
          description:
            "Nội dung phù hợp với học sinh (không bạo lực, phản cảm)",
          passed: null,
          notes: "",
        },
        {
          id: "content_assets",
          category: "content",
          name: "Tài nguyên đa phương tiện",
          description: "Hình ảnh, âm thanh chất lượng tốt, không bị lỗi",
          passed: null,
          notes: "",
        },
      ],
    },
    {
      id: "ui",
      name: "Giao diện",
      icon: "🎨",
      tests: [
        {
          id: "ui_design",
          category: "ui",
          name: "Thiết kế UI",
          description: "Giao diện đẹp, dễ nhìn, phù hợp với học sinh",
          passed: null,
          notes: "",
        },
        {
          id: "ui_readability",
          category: "ui",
          name: "Khả năng đọc",
          description: "Chữ đủ lớn, màu sắc tương phản tốt, dễ đọc",
          passed: null,
          notes: "",
        },
        {
          id: "ui_navigation",
          category: "ui",
          name: "Điều hướng",
          description: "Dễ dàng điều hướng, nút bấm rõ ràng",
          passed: null,
          notes: "",
        },
        {
          id: "ui_accessibility",
          category: "ui",
          name: "Accessibility",
          description: "Hỗ trợ học sinh khuyết tật (nếu có)",
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
            (t: any) => t.id === test.id
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

  const updateTest = (
    testId: string,
    field: "passed" | "notes",
    value: boolean | null | string
  ) => {
    setTestCategories((categories) =>
      categories.map((category) => ({
        ...category,
        tests: category.tests.map((test) =>
          test.id === testId ? { ...test, [field]: value } : test
        ),
      }))
    );
  };

  const allTests = testCategories.flatMap((cat) => cat.tests);

  // Only manual tests require user input
  const manualTests = allTests.filter((test) => !test.isAutoTest);
  const manualTestsCompleted = manualTests.every(
    (test) => test.passed !== null
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
      (t) => t.passed !== null
    ).length;
    const passed = categoryManualTests.filter((t) => t.passed === true).length;
    return { completed, total: categoryManualTests.length, passed };
  };

  const handleSubmit = async (finalDecision: "pass" | "fail") => {
    if (!manualTestsCompleted) {
      setError(
        "Vui lòng hoàn thành tất cả các mục kiểm tra thủ công (Manual Tests) trước khi submit."
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
        "Cảnh báo: Có test tự động không đạt. Bạn có chắc chắn muốn Pass QC không?"
      );
      if (!confirmIgnore) return;
    }

    setIsSubmitting(true);
    setError("");

    try {
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

      // Submit QC report
      const response = await fetch(`/api/games/${gameId}/qc-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId,
          decision: finalDecision,
          qaSummary,
          notes: generalNotes,
          reviewerName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể submit review");
      }

      // Redirect to QC inbox on success
      router.push("/console/qc-inbox?success=review_submitted");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi submit review");
      setIsSubmitting(false);
    }
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
                  <span className="sm:hidden">{category.name.split(' ')[0]}</span>
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
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{test.name}</h3>
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
                <p className="text-xs sm:text-sm text-slate-600">{test.description}</p>
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
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
