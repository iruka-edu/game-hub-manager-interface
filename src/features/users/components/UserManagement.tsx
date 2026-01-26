"use client";

import { useState } from "react";
import Link from "next/link";
import { useUsers } from "../hooks/useUsers";
import {
  useCreateUser,
  useUpdateUser,
  useUpdateUserStatus,
  useDeleteUser,
} from "../hooks/useUserMutations";
import {
  useUserModal,
  useOpenAddModal,
  useOpenEditModal,
  useCloseModal,
  useSetSearch,
  useUserFilters,
  useUserFilterActions,
} from "../stores/useUserStore";
import type { User, CreateUserPayload, UpdateUserPayload } from "../types";
import type { Role } from "@/types/user-types";

interface UserManagementProps {
  canManageUsers: boolean;
  userRoles: Role[];
}

const roleLabels: Record<string, string> = {
  dev: "Developer (Dev)",
  qc: "Quality Control (QC)",
  reviewer: "Reviewer (Duyệt nội dung)",
  publisher: "Publisher (Xuất bản)",
  admin: "Administrator (Hệ thống)",
};

const roleDescriptions: Record<string, string> = {
  dev: "Tạo và hoàn thiện game",
  qc: "Kiểm soát chất lượng game",
  reviewer: "Duyệt nội dung (approve/reject)",
  publisher: "Kiểm soát hiển thị (publish/unpublish)",
  admin: "Quản trị hệ thống",
};

const availableRoles = Object.keys(roleLabels) as Role[];

export function UserManagement({
  canManageUsers,
  userRoles,
}: UserManagementProps) {
  // Server State (React Query)
  const { users, isLoading, isError, error } = useUsers();

  // Client State (Zustand)
  const modal = useUserModal();
  const filters = useUserFilters();
  const openAddModal = useOpenAddModal();
  const openEditModal = useOpenEditModal();
  const closeModal = useCloseModal();
  const { setSearch, setRoleFilter, setStatusFilter } = useUserFilterActions();

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const updateStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  // Local form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    roles: [] as Role[],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });

  // Check if current user can delete users (admin only as per new requirements)
  const canDeleteUsers = userRoles.some((role) => ["admin"].includes(role));

  const handleOpenAddModal = () => {
    setFormData({ full_name: "", email: "", password: "", roles: [] });
    setFormError(null);
    openAddModal();
  };

  const handleOpenEditModal = (user: User) => {
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: "",
      roles: user.roles,
    });
    setFormError(null);
    openEditModal(user);
  };

  const handleOpenDeleteConfirm = (user: User) => {
    setDeleteConfirm({ isOpen: true, user });
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false, user: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (modal.mode === "add") {
        const payload: CreateUserPayload = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          roles: formData.roles,
        };
        await createUserMutation.mutateAsync(payload);
      } else if (modal.selectedUser) {
        const payload: UpdateUserPayload = {
          full_name: formData.full_name,
          email: formData.email,
          roles: formData.roles,
        };
        await updateUserMutation.mutateAsync({
          userId: modal.selectedUser.id,
          payload,
        });
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateStatusMutation.mutateAsync({
        userId,
        payload: { is_active: !currentStatus },
      });
    } catch (err) {
      console.error("Không thể cập nhật trạng thái:", err);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm.user) return;

    try {
      await deleteUserMutation.mutateAsync(deleteConfirm.user.id);
      handleCloseDeleteConfirm();
    } catch (err) {
      console.error("Không thể xóa người dùng:", err);
    }
  };

  const toggleRole = (role: Role) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const isFormLoading =
    createUserMutation.isPending || updateUserMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error instanceof Error ? error.message : "Đã xảy ra lỗi"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Add Button */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filters.roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
            >
              <option value="all">Tất cả vai trò</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filters.statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm khóa</option>
            </select>
          </div>
        </div>
        {canManageUsers && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
          >
            + Thêm User
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tên
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                Ngày tạo
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                Đăng nhập cuối
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Trạng thái
              </th>
              {canManageUsers && (
                <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-slate-900">
                    {user.full_name}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-500">{user.email}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        {roleLabels[role] || role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("vi-VN")
                    : "N/A"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 hidden lg:table-cell">
                  {(user as any).last_login_at
                    ? new Date((user as any).last_login_at).toLocaleString(
                        "vi-VN",
                      )
                    : "Chưa đăng nhập"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                      user.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {user.is_active ? "Hoạt động" : "Tạm khóa"}
                  </span>
                </td>
                {canManageUsers && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Link
                      href={`/console/audit-logs?userId=${user.email}`}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-700 text-xs font-semibold"
                    >
                      Logs
                    </Link>
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-xs font-semibold"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() =>
                        handleToggleStatus(user.id, user.is_active)
                      }
                      disabled={updateStatusMutation.isPending}
                      className={`px-3 py-1 rounded text-white text-xs font-medium disabled:opacity-50 ${
                        user.is_active
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {user.is_active ? "Khóa" : "Mở khóa"}
                    </button>
                    {canDeleteUsers && (
                      <button
                        onClick={() => handleOpenDeleteConfirm(user)}
                        disabled={deleteUserMutation.isPending}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white text-xs font-medium disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy người dùng nào
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={closeModal}
              ></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-10">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {modal.mode === "add"
                      ? "Thêm người dùng mới"
                      : "Sửa thông tin người dùng"}
                  </h3>

                  {formError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded text-sm">
                      {formError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Họ và Tên
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            full_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Email liên kết
                      </label>
                      <div
                        className={`mt-1 flex rounded-xl shadow-sm overflow-hidden border ${modal.mode === "edit" ? "bg-slate-50 border-slate-200" : "bg-white border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all"}`}
                      >
                        <input
                          type="text"
                          required
                          readOnly={modal.mode === "edit"}
                          pattern="[a-zA-Z0-9._\-]+"
                          placeholder="son.nguyen"
                          className={`block w-full py-2.5 px-3 text-sm focus:outline-none bg-transparent ${modal.mode === "edit" ? "text-slate-500 cursor-not-allowed" : "text-slate-900"}`}
                          value={formData.email.replace("@iruka.com", "")}
                          onChange={(e) => {
                            const username = e.target.value.replace(/@/g, "");
                            setFormData({
                              ...formData,
                              email: username ? `${username}@iruka.com` : "",
                            });
                          }}
                        />
                        <span className="inline-flex items-center px-4 border-l border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold font-mono">
                          @iruka.com
                        </span>
                      </div>
                      {modal.mode === "add" ? (
                        <p className="mt-1.5 text-[10px] text-slate-500 font-medium">
                          Nhập tên người dùng IRUKA (vd: son.nguyen). Đây sẽ là
                          định danh đăng nhập duy nhất.
                        </p>
                      ) : (
                        <p className="mt-1.5 text-[10px] text-amber-600 font-bold uppercase tracking-tight">
                          Email không thể thay đổi sau khi tạo tài khoản
                        </p>
                      )}
                    </div>

                    {modal.mode === "add" && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Mật khẩu khởi tạo
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Vai trò thao tác
                      </label>
                      <div className="grid grid-cols-1 gap-2.5">
                        {availableRoles.map((role) => (
                          <label
                            key={role}
                            className={`flex items-start p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                              formData.roles.includes(role)
                                ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                checked={formData.roles.includes(role)}
                                onChange={() => toggleRole(role)}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <span
                                className={`block font-bold ${
                                  formData.roles.includes(role)
                                    ? "text-indigo-900"
                                    : "text-slate-900"
                                }`}
                              >
                                {roleLabels[role]}
                              </span>
                              <span className="text-slate-500 text-xs">
                                {roleDescriptions[role]}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        * Bạn có thể gán nhiều vai trò cho một người dùng. Hệ
                        thống sẽ kết hợp tất cả các quyền tương ứng.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isFormLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isFormLoading ? "Đang lưu..." : "Lưu"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.user && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={handleCloseDeleteConfirm}
              ></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Xác nhận xóa người dùng
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa người dùng{" "}
                        <span className="font-medium">
                          {deleteConfirm.user.full_name}
                        </span>
                        ? Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={deleteUserMutation.isPending}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {deleteUserMutation.isPending ? "Đang xóa..." : "Xóa"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseDeleteConfirm}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
