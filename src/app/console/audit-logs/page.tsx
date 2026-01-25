"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  GAME_CREATE: { label: "Tạo game", color: "bg-blue-100 text-blue-800" },
  GAME_UPDATE: {
    label: "Cập nhật game",
    color: "bg-yellow-100 text-yellow-800",
  },
  GAME_SUBMIT_QC: { label: "Gửi QC", color: "bg-purple-100 text-purple-800" },
  GAME_QC_PASS: { label: "QC Pass", color: "bg-green-100 text-green-800" },
  GAME_QC_FAIL: { label: "QC Fail", color: "bg-red-100 text-red-800" },
  GAME_APPROVE: {
    label: "Duyệt game",
    color: "bg-emerald-100 text-emerald-800",
  },
  GAME_REJECT: { label: "Từ chối game", color: "bg-red-100 text-red-800" },
  GAME_PUBLISH: { label: "Xuất bản", color: "bg-indigo-100 text-indigo-800" },
  GAME_UNPUBLISH: {
    label: "Gỡ xuất bản",
    color: "bg-orange-100 text-orange-800",
  },
  GAME_ARCHIVE: { label: "Lưu trữ", color: "bg-slate-100 text-slate-800" },
  USER_LOGIN: { label: "Đăng nhập", color: "bg-cyan-100 text-cyan-800" },
  USER_LOGOUT: { label: "Đăng xuất", color: "bg-gray-100 text-gray-800" },
  USER_CREATE: { label: "Tạo User", color: "bg-blue-100 text-blue-800" },
  USER_UPDATE: { label: "Cập nhật User", color: "bg-blue-100 text-blue-800" },
  USER_ROLE_CHANGE: {
    label: "Đổi Role",
    color: "bg-purple-100 text-purple-800",
  },
  USER_STATE_CHANGE: {
    label: "Đổi Trạng thái",
    color: "bg-orange-100 text-orange-800",
  },
  QC_ISSUE_CREATE: { label: "Tạo Issue QC", color: "bg-red-100 text-red-800" },
  QC_ISSUE_UPDATE: {
    label: "Cập nhật Issue",
    color: "bg-yellow-100 text-yellow-800",
  },
  DEFAULT: { label: "Hành động", color: "bg-gray-100 text-gray-800" },
};

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: sessionLoading } = useSession();
  const { logs, pagination, isLoading, isError } = useAuditLogs();
  const { setPage, setUserId, setAction, setIp, setStartDate, setEndDate } =
    useAuditLogFilterActions();
  const filters = useAuditLogFilters();
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Authorization check
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user) {
      const hasAccess =
        user.roles.includes("admin") ||
        user.roles.includes("cto") ||
        user.roles.includes("ceo");
      if (!hasAccess) {
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-slate-500 mt-1">
            Theo dõi tất cả hoạt động trong hệ thống
          </p>
        </div>
        <div className="text-sm text-slate-500">
          Tổng cộng:{" "}
          <span className="font-semibold text-slate-700">
            {pagination.total}
          </span>{" "}
          bản ghi
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            User (Email/ID)
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
            placeholder="Tìm user..."
            value={filters.userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Hành động
          </label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white"
            value={filters.action}
            onChange={(e) => setAction(e.target.value as ActionType | "")}
          >
            <option value="">Tất cả</option>
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
          <label className="block text-xs font-medium text-slate-500 mb-1">
            IP Address
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
            placeholder="127.0.0.1"
            value={filters.ip || ""}
            onChange={(e) => setIp(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Từ ngày
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
            value={filters.startDate || ""}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Đến ngày
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
            value={filters.endDate || ""}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Hành động
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Đối tượng
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Chi tiết
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {log.actor?.email || "Unknown"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {log.actor?.role || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionInfo.color}`}
                        >
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div>{log.target?.entity || "N/A"}</div>
                        {(log.metadata as any)?.gameId && (
                          <div className="text-xs text-slate-400 font-mono">
                            {String((log.metadata as any).gameId)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                        {log.actor?.ip || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-indigo-600 hover:text-indigo-900"
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
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Trang {pagination.page} / {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              {pagination.page > 1 && (
                <button
                  onClick={() => setPage(pagination.page - 1)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Trước
                </button>
              )}
              {pagination.page < pagination.totalPages && (
                <button
                  onClick={() => setPage(pagination.page + 1)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Tiếp
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
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Chi tiết Audit Log
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-gray-500 text-xs uppercase">
                        Thời gian
                      </span>
                      <span className="font-medium">
                        {new Date(selectedLog.createdAt).toLocaleString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs uppercase">
                        Hành động
                      </span>
                      <span className="font-medium">{selectedLog.action}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs uppercase">
                        Người thực hiện
                      </span>
                      <span className="font-medium">
                        {selectedLog.actor?.email} ({selectedLog.actor?.role})
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs uppercase">
                        IP Address
                      </span>
                      <span className="font-medium">
                        {selectedLog.actor?.ip || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Metadata
                    </h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>

                  {selectedLog.changes && selectedLog.changes.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Thay đổi
                      </h4>
                      <div className="space-y-2">
                        {selectedLog.changes.map((change, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 p-2 rounded text-xs"
                          >
                            <div className="font-semibold text-gray-700">
                              {change.field}
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div
                                className="text-red-600 truncate"
                                title={String(change.oldValue)}
                              >
                                - {JSON.stringify(change.oldValue)}
                              </div>
                              <div
                                className="text-green-600 truncate"
                                title={String(change.newValue)}
                              >
                                + {JSON.stringify(change.newValue)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
