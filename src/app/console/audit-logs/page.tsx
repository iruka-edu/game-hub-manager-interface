"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth";
import { useAuditLogs, useAuditLogFilterActions } from "@/features/audit-logs";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AuditLogEntry } from "@/features/audit-logs/types";

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
  GAME_PUBLISH: { label: "Xuất bản", color: "bg-indigo-100 text-indigo-800" },
  GAME_ARCHIVE: { label: "Lưu trữ", color: "bg-slate-100 text-slate-800" },
  USER_LOGIN: { label: "Đăng nhập", color: "bg-cyan-100 text-cyan-800" },
  USER_LOGOUT: { label: "Đăng xuất", color: "bg-gray-100 text-gray-800" },
  // Fallback default
  DEFAULT: { label: "Hành động", color: "bg-gray-100 text-gray-800" },
};

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: sessionLoading } = useSession();
  const { logs, pagination, isLoading, isError } = useAuditLogs();
  const { setPage } = useAuditLogFilterActions();

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
    </div>
  );
}
