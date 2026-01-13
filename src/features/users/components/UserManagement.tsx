"use client";

import { useState } from "react";
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
} from "../stores/useUserStore";
import type { User, CreateUserPayload, UpdateUserPayload } from "../types";
import type { Role } from "@/types/user-types";

interface UserManagementProps {
  canManageUsers: boolean;
  userRoles: Role[];
}

const roleLabels: Record<string, string> = {
  dev: "Nhà phát triển",
  qc: "Kiểm thử QC",
  cto: "CTO",
  ceo: "CEO",
  admin: "Quản trị viên",
};

const availableRoles = Object.keys(roleLabels) as Role[];

export function UserManagement({ canManageUsers, userRoles }: UserManagementProps) {
  // Server State (React Query)
  const { users, isLoading, isError, error } = useUsers();

  // Client State (Zustand)
  const modal = useUserModal();
  const filters = useUserFilters();
  const openAddModal = useOpenAddModal();
  const openEditModal = useOpenEditModal();
  const closeModal = useCloseModal();
  const setSearch = useSetSearch();

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const updateStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  // Local form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roles: [] as Role[],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });

  // Check if current user can delete users (admin, cto, ceo only)
  const canDeleteUsers = userRoles.some(role => ['admin', 'cto', 'ceo'].includes(role));

  const handleOpenAddModal = () => {
    setFormData({ name: "", email: "", password: "", roles: [] });
    setFormError(null);
    openAddModal();
  };

  const handleOpenEditModal = (user: User) => {
    setFormData({
      name: user.name,
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
          name: formData.name,
          roles: formData.roles,
        };
        await createUserMutation.mutateAsync(payload);
      } else if (modal.selectedUser) {
        const payload: UpdateUserPayload = {
          name: formData.name,
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
        payload: { isActive: !currentStatus },
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
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canManageUsers && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Thêm người dùng mới
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              {canManageUsers && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {roleLabels[role] || role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? "Hoạt động" : "Không hoạt động"}
                  </span>
                </td>
                {canManageUsers && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-xs font-medium"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      disabled={updateStatusMutation.isPending}
                      className={`px-3 py-1 rounded text-white text-xs font-medium disabled:opacity-50 ${
                        user.isActive
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
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
          <div className="text-center py-8 text-gray-500">Không tìm thấy người dùng nào</div>
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
                    {modal.mode === "add" ? "Thêm người dùng mới" : "Sửa thông tin người dùng"}
                  </h3>

                  {formError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded text-sm">
                      {formError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tên
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    {modal.mode === "add" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Mật khẩu
                        </label>
                        <input
                          type="password"
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vai trò
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableRoles.map((role) => (
                          <label
                            key={role}
                            className="inline-flex items-center"
                          >
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-blue-600"
                              checked={formData.roles.includes(role)}
                              onChange={() => toggleRole(role)}
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {roleLabels[role]}
                            </span>
                          </label>
                        ))}
                      </div>
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
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
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
                        <span className="font-medium">{deleteConfirm.user.name}</span>?
                        Hành động này không thể hoàn tác.
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
