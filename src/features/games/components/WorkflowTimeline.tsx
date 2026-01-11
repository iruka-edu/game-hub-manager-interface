'use client';

interface WorkflowTimelineProps {
  currentStatus: string;
}

const workflowSteps = [
  { id: 'draft', label: 'Nháp', icon: '📝' },
  { id: 'uploaded', label: 'Chờ QC', icon: '📤' },
  { id: 'qc_processing', label: 'Đang QC', icon: '🔍' },
  { id: 'qc_passed', label: 'QC Đạt', icon: '✅' },
  { id: 'approved', label: 'Đã duyệt', icon: '👍' },
  { id: 'published', label: 'Xuất bản', icon: '🚀' },
];

const statusOrder: Record<string, number> = {
  draft: 0,
  uploaded: 1,
  qc_processing: 2,
  qc_passed: 3,
  qc_failed: 2, // Same level as qc_processing
  approved: 4,
  published: 5,
  archived: 5,
};

export function WorkflowTimeline({ currentStatus }: WorkflowTimelineProps) {
  const currentIndex = statusOrder[currentStatus] ?? 0;
  const isFailed = currentStatus === 'qc_failed';

  return (
    <div className="flex items-center justify-between">
      {workflowSteps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFailedStep = isFailed && step.id === 'qc_processing';

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  isFailedStep
                    ? 'bg-red-100 border-2 border-red-500'
                    : isCompleted
                    ? 'bg-green-100 border-2 border-green-500'
                    : isCurrent
                    ? 'bg-indigo-100 border-2 border-indigo-500'
                    : 'bg-slate-100 border-2 border-slate-300'
                }`}
              >
                {isFailedStep ? '❌' : isCompleted ? '✓' : step.icon}
              </div>
              <span
                className={`text-xs mt-2 ${
                  isFailedStep
                    ? 'text-red-600 font-medium'
                    : isCurrent
                    ? 'text-indigo-600 font-medium'
                    : isCompleted
                    ? 'text-green-600'
                    : 'text-slate-400'
                }`}
              >
                {isFailedStep ? 'QC Không đạt' : step.label}
              </span>
            </div>
            {index < workflowSteps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
