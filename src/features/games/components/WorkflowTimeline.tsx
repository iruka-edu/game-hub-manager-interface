"use client";

interface WorkflowTimelineProps {
  currentStatus: string;
}

const workflowSteps = [
  { id: "draft", label: "Nháp", icon: "📝" },
  { id: "qc", label: "QC", icon: "📤" },
  { id: "review", label: "Chờ duyệt", icon: "🔍" },
  { id: "approved", label: "Đã duyệt", icon: "👍" },
  { id: "published", label: "Xuất bản", icon: "🚀" },
];

const statusOrder: Record<string, number> = {
  draft: 0,
  qc: 1,
  review: 2,
  approved: 3,
  published: 4,
  archived: 5,
};

export function WorkflowTimeline({ currentStatus }: WorkflowTimelineProps) {
  const currentIndex = statusOrder[currentStatus] ?? 0;
  const isFailed = currentStatus === "qc_failed";

  return (
    <div className="flex items-center justify-between">
      {workflowSteps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFailedStep = isFailed && step.id === "qc_processing";

        return (
          <div
            key={step.id}
            className="flex items-center flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm transition-all duration-500 ${
                  isFailedStep
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : isCompleted
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : isCurrent
                        ? "bg-indigo-600 text-white border border-indigo-500 shadow-indigo-200 shadow-lg scale-110 ring-4 ring-indigo-50"
                        : "bg-white text-slate-400 border border-slate-200"
                }`}
              >
                {isFailedStep ? (
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
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
                ) : isCompleted ? (
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-lg md:text-xl">{step.icon}</span>
                )}
              </div>
              <span
                className={`text-[10px] md:text-xs mt-3 font-semibold whitespace-nowrap px-2 py-0.5 rounded-full transition-colors duration-300 ${
                  isFailedStep
                    ? "text-red-600 bg-red-50"
                    : isCurrent
                      ? "text-indigo-700 bg-indigo-50"
                      : isCompleted
                        ? "text-emerald-700 bg-emerald-50"
                        : "text-slate-400 bg-transparent"
                }`}
              >
                {isFailedStep ? "QC Không đạt" : step.label}
              </span>
            </div>
            {index < workflowSteps.length - 1 && (
              <div
                className={`flex-1 h-0.5 -mt-8 ${
                  index < currentIndex ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
