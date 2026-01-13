import { redirect } from "next/navigation";
import { getUserFromCookies } from "@/lib/auth";
import { UserManagement } from "@/features/users/components/UserManagement";

export default async function UsersPage() {
  const user = await getUserFromCookies();

  if (!user) {
    redirect("/login?redirect=/console/users");
  }

  const canManageUsers =
    user.roles.includes("admin") ||
    user.roles.includes("cto") ||
    user.roles.includes("ceo");
  if (!canManageUsers) {
    redirect("/403");
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
        <p className="text-slate-500 mt-1">
          Hệ thống quản lý người dùng Iruka Hub
        </p>
      </div>

      <UserManagement canManageUsers={canManageUsers} userRoles={user.roles} />
    </div>
  );
}
