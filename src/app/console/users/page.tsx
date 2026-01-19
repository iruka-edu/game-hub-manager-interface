"use client";

import { useSession } from "@/features/auth";
import { UserManagement } from "@/features/users/components/UserManagement";

export default function UsersPage() {
  const { user, isLoading } = useSession();

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-64 mb-8"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Middleware handles auth, but check just in case
  if (!user) {
    return null;
  }

  const userRoles = user.roles as string[];
  const canManageUsers =
    userRoles.includes("admin") ||
    userRoles.includes("cto") ||
    userRoles.includes("ceo");

  // Access denied
  if (!canManageUsers) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700">
            Không có quyền truy cập
          </h2>
          <p className="text-red-600 mt-2">
            Bạn không có quyền truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 mt-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Quản lý người dùng
        </h1>
        <p className="text-slate-500 mt-1">
          Hệ thống quản lý người dùng Iruka Hub
        </p>
      </div>

      <UserManagement canManageUsers={canManageUsers} userRoles={user.roles} />
    </div>
  );
}
