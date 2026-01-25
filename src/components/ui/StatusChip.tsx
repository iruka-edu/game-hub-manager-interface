import type { VersionStatus } from "@/models/GameVersion";

interface StatusChipProps {
  status: VersionStatus;
  size?: "sm" | "md";
}

const statusConfig: Record<
  VersionStatus,
  { label: string; className: string }
> = {
  draft: { label: "Nháp", className: "bg-slate-100 text-slate-700" },
  uploaded: { label: "Chờ QC", className: "bg-blue-100 text-blue-700" },
  qc_processing: {
    label: "Đang QC",
    className: "bg-yellow-100 text-yellow-700",
  },
  qc_passed: { label: "QC Passed", className: "bg-purple-100 text-purple-700" },
  qc_failed: { label: "QC Failed", className: "bg-red-100 text-red-700" },
  approved: { label: "Đã duyệt", className: "bg-emerald-100 text-emerald-700" },
  published: { label: "Đã xuất bản", className: "bg-green-100 text-green-700" },
  archived: { label: "Đã lưu trữ", className: "bg-gray-200 text-gray-600" },
};

export function StatusChip({ status, size = "md" }: StatusChipProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-slate-100 text-slate-700",
  };

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-widest rounded-full border ${config.className} ${sizeClasses} shadow-sm`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
