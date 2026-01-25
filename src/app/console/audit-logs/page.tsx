"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/features/auth/hooks/useAuth";
import {
  useAuditLogs,
  useAuditLogFilterActions,
  useAuditLogFilters,
} from "@/features/audit-logs";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AuditLogEntry } from "@/features/audit-logs/types";
import { useState } from "react";
import type { ActionType } from "@/lib/audit-types";

// Action display names
const actionLabels: Record<string, { label: string; color: string }> = {
  // Core dictionary
  CREATE_GAME: { label: "Tạo game", color: "bg-blue-100 text-blue-800" },
  UPDATE_GAME: {
    label: "Cập nhật game",
    color: "bg-yellow-100 text-yellow-800",
  },
  CHANGE_STATUS: {
    label: "Đổi trạng thái game",
    color: "bg-purple-100 text-purple-800",
  },
  QC_ISSUE: { label: "QC Issue", color: "bg-red-100 text-red-800" },
  REVIEW_DECISION: {
    label: "Quyết định duyệt",
    color: "bg-emerald-100 text-emerald-800",
  },
  PUBLISH_ACTION: { label: "Xuất bản", color: "bg-indigo-100 text-indigo-800" },
  USER_ROLE_CHANGE: {
    label: "Đổi Role User",
    color: "bg-orange-100 text-orange-800",
  },
  USER_STATE_CHANGE: {
    label: "Khóa/Mở User",
    color: "bg-rose-100 text-rose-800",
  },

  // Auth
  USER_LOGIN: { label: "Đăng nhập", color: "bg-slate-100 text-slate-800" },
  USER_LOGOUT: { label: "Đăng xuất", color: "bg-slate-100 text-slate-800" },

  // Legacy/Support
  GAME_UPLOAD: { label: "Upload Game", color: "bg-blue-50 text-blue-600" },
  GAME_APPROVE: { label: "Duyệt game", color: "bg-green-50 text-green-600" },
  GAME_REJECT: { label: "Từ chối game", color: "bg-red-50 text-red-600" },
  GAME_PUBLISH: {
    label: "Xuất bản game",
    color: "bg-indigo-50 text-indigo-600",
  },
  GAME_QC_PASS: { label: "QC Pass", color: "bg-emerald-50 text-emerald-600" },
  GAME_QC_FAIL: { label: "QC Fail", color: "bg-rose-50 text-rose-600" },

  DEFAULT: { label: "Hành động khách", color: "bg-gray-100 text-gray-800" },
};

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: sessionLoading } = useSession();
  const { logs, pagination, isLoading, isError } = useAuditLogs();
  const {
    setPage,
    setUserId,
    setAction,
    setIp,
    setStartDate,
    setEndDate,
    setTargetId,
  } = useAuditLogFilterActions();
  const filters = useAuditLogFilters();
  const searchParams = useSearchParams();
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Initialize filters from search params
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId) {
      setUserId(userId);
    }
  }, [searchParams, setUserId]);

  // Authorization check
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user) {
      const isAdmin = user.roles.includes("admin");
      if (!isAdmin) {
        router.push("/console");
      }
    }
  }, [user, isAuthenticated, sessionLoading, router]);

  const breadcrumbItems = [
    { label: "Console", href: "/console" },
    { label: "Audit Logs" },
  ];

  // Loading state
  if (sessionLoading || isLoading) {
    return (
      <div className="p-8">
        <Breadcrumb items={breadcrumbItems} />
        <div className="animate-pulse space-y-4 mt-8">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded mt-8"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-8">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-8">
          <p className="text-red-700">Không thể tải dữ liệu audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
            Nhật ký hệ thống
          </h1>
          <p className="text-slate-500 mt-1">
            Theo dõi và truy vết hoạt động quản trị trong Game Hub
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600">
            Tổng:{" "}
            <span className="font-bold text-indigo-600">
              {pagination.total}
            </span>{" "}
            bản ghi
          </div>
        </div>
      </div>

      {/* Filters Overlay */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Người thực hiện
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Email hoặc User ID..."
              value={filters.userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Loại hành động
            </label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.action}
              onChange={(e) => setAction(e.target.value as ActionType | "")}
            >
              <option value="">Tất cả hành động</option>
              {Object.keys(actionLabels)
                .filter((k) => k !== "DEFAULT")
                .map((key) => (
                  <option key={key} value={key}>
                    {actionLabels[key].label}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              ID Đối tượng (Game/User...)
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Game ID, User ID..."
              value={filters.targetId || ""}
              onChange={(e) => setTargetId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Địa chỉ IP
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Ví dụ: 1.1.1.1"
              value={filters.ip || ""}
              onChange={(e) => setIp(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Khoảng thời gian: Từ ngày
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.startDate || ""}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Đến ngày
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.endDate || ""}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                setStartDate(today);
                setEndDate(today);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hôm nay
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const start = new Date(now.setDate(now.getDate() - 7))
                  .toISOString()
                  .split("T")[0];
                const end = new Date().toISOString().split("T")[0];
                setStartDate(start);
                setEndDate(end);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              7 ngày
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const start = new Date(now.setDate(now.getDate() - 30))
                  .toISOString()
                  .split("T")[0];
                const end = new Date().toISOString().split("T")[0];
                setStartDate(start);
                setEndDate(end);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              30 ngày
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">
                  Thời điểm
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">
                  Người thực hiện
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">
                  Hành động
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">
                  Đối tượng tác động
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">
                  IP
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Chưa có bản ghi audit nào.
                  </td>
                </tr>
              ) : (
                logs.map((log: AuditLogEntry) => {
                  const actionInfo = actionLabels[log.action] ||
                    actionLabels.DEFAULT || {
                      label: log.action,
                      color: "bg-gray-100 text-gray-800",
                    };

                  return (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-700">
                          {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString("vi-VN")}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">
                          {log.actor?.email || "Unknown"}
                        </div>
                        <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-0.5 font-mono">
                          {log.actor?.role || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${actionInfo.color} mb-1.5`}
                        >
                          {actionInfo.label}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">
                          {log.action}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                            {log.target?.entity || "N/A"}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {log.target?.id || "N/A"}
                          </span>
                        </div>
                        {(log.metadata as any)?.gameId && (
                          <div className="text-[11px] font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full inline-block border border-indigo-100 shadow-sm">
                            Game ID: {String((log.metadata as any).gameId)}
                          </div>
                        )}
                        {(log.metadata as any)?.targetEmail && (
                          <div className="text-[11px] text-slate-500 font-semibold mt-1">
                            Target: {String((log.metadata as any).targetEmail)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-xs text-slate-500 font-mono text-center">
                        {log.actor?.ip || "---"}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-bold"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Trang {pagination.page} / {pagination.totalPages}
              <span className="ml-2 text-slate-300">|</span>
              <span className="ml-2">Tổng {pagination.total} bản ghi</span>
            </div>
            <div className="flex items-center gap-1">
              {pagination.page > 1 && (
                <button
                  onClick={() => setPage(pagination.page - 1)}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="Trang trước"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}

              {/* Basic page numbers */}
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const p = i + 1;
                // Simple logic for showing pages around current
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      pagination.page === p
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              {pagination.page < pagination.totalPages && (
                <button
                  onClick={() => setPage(pagination.page + 1)}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="Trang tiếp"
                >
                  <svg
                    className="w-5 h-5"
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
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setSelectedLog(null)}
              ></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full border border-slate-200">
              <div className="bg-white px-6 pt-6 pb-6 sm:p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                    Chi tiết Audit Log
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${actionLabels[selectedLog.action]?.color || "bg-slate-100 text-slate-800"}`}
                  >
                    {actionLabels[selectedLog.action]?.label ||
                      selectedLog.action}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Thời điểm thực hiện
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {new Date(selectedLog.createdAt).toLocaleString(
                          "vi-VN",
                          {
                            dateStyle: "full",
                            timeStyle: "medium",
                          },
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Người thực hiện
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                          {selectedLog.actor?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-none">
                            {selectedLog.actor?.email}
                          </p>
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-1">
                            {selectedLog.actor?.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Đối tượng tác động
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                          {selectedLog.target?.entity || "N/A"}
                        </span>
                        <span className="text-sm font-mono text-slate-700 font-semibold">
                          {selectedLog.target?.id || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Địa chỉ IP & Thiết bị
                      </span>
                      <span className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {selectedLog.actor?.ip || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedLog.changes && selectedLog.changes.length > 0 && (
                    <div className="border-t border-slate-100 pt-6">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                        Nội dung thay đổi (Before/After)
                      </h4>
                      <div className="space-y-3">
                        {selectedLog.changes.map((change, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200"
                          >
                            <div className="px-4 py-2 bg-slate-100/50 border-b border-slate-200 flex justify-between items-center">
                              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">
                                Trường dữ liệu:{" "}
                                <span className="text-indigo-600">
                                  {change.field}
                                </span>
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                              <div className="p-4">
                                <span className="block text-[10px] font-bold text-rose-500 uppercase mb-2">
                                  Trạng thái cũ
                                </span>
                                <div className="text-xs text-slate-600 font-mono break-all line-through opacity-60 bg-white p-2 rounded-lg border border-slate-100">
                                  {typeof change.oldValue === "object"
                                    ? JSON.stringify(change.oldValue, null, 2)
                                    : String(change.oldValue)}
                                </div>
                              </div>
                              <div className="p-4 bg-emerald-50/20">
                                <span className="block text-[10px] font-bold text-emerald-600 uppercase mb-2">
                                  Trạng thái mới
                                </span>
                                <div className="text-xs text-slate-900 font-mono break-all font-semibold bg-white p-2 rounded-lg border border-emerald-100 shadow-sm">
                                  {typeof change.newValue === "object"
                                    ? JSON.stringify(change.newValue, null, 2)
                                    : String(change.newValue)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                      Thông tin kỹ thuật (Metadata)
                    </h4>
                    <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-[11px] overflow-auto max-h-48 font-mono leading-relaxed shadow-inner">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-6 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl hover:bg-slate-100 transition-all shadow-sm active:scale-95"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
