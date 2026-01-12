import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { UserRepository } from "@/models/User";
import { AuditLogger } from "@/lib/audit";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AuditLogsPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 50;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("iruka_session");

  if (!sessionCookie?.value) {
    redirect("/login");
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    redirect("/login");
  }

  const userRepo = await UserRepository.getInstance();
  const user = await userRepo.findById(session.userId);

  if (!user) {
    redirect("/login");
  }

  // Only Admin, CTO, and CEO can view audit logs
  const hasAccess =
    user.roles.includes("admin") ||
    user.roles.includes("cto") ||
    user.roles.includes("ceo");
  if (!hasAccess) {
    redirect("/console");
  }

  // Fetch logs
  const skip = (page - 1) * limit;
  const logs = await AuditLogger.getLogs({}, limit, skip);
  const total = await AuditLogger.getLogsCount({});
  const totalPages = Math.ceil(total / limit);

  const breadcrumbItems = [
    { label: "Console", href: "/console" },
    { label: "Audit Logs" },
  ];

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
  };

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
          <span className="font-semibold text-slate-700">{total}</span> bản ghi
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
                logs.map((log: any) => {
                  const actionInfo = actionLabels[log.action] || {
                    label: log.action,
                    color: "bg-gray-100 text-gray-800",
                  };

                  return (
                    <tr key={log._id?.toString()} className="hover:bg-slate-50">
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
                        {log.metadata?.gameId && (
                          <div className="text-xs text-slate-400 font-mono">
                            {log.metadata.gameId}
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
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Trang {page} / {totalPages}
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`/console/audit-logs?page=${page - 1}`}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Trước
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`/console/audit-logs?page=${page + 1}`}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Tiếp
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
