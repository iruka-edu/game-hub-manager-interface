"use client";

import { useState, useMemo, Fragment } from "react";
import {
  useGCSFolders,
  useDeleteGCSFile,
  useRefreshGCS,
} from "../hooks/useGCS";
import type {
  GCSGameFolder,
  GCSFile,
  GCSFolderFilter,
  GCSSortField,
  GCSSortOrder,
} from "../types";

interface GCSManagementProps {
  isAdmin: boolean;
}

export function GCSManagement({ isAdmin }: GCSManagementProps) {
  const [filter, setFilter] = useState<GCSFolderFilter>("all");
  const [sortField, setSortField] = useState<GCSSortField>("lastUpdated");
  const [sortOrder, setSortOrder] = useState<GCSSortOrder>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    folder: GCSGameFolder | null;
    file: GCSFile | null;
    isMultiple: boolean;
  }>({ isOpen: false, folder: null, file: null, isMultiple: false });

  // Hooks
  const { data: gcsData, isLoading, isError, error } = useGCSFolders();
  const deleteFileMutation = useDeleteGCSFile();
  const refreshMutation = useRefreshGCS();

  // Filtered and sorted folders
  const filteredFolders = useMemo(() => {
    if (!gcsData?.folders) return [];

    let filtered = gcsData.folders;

    // Apply filter
    switch (filter) {
      case "orphaned":
        filtered = filtered.filter((f) => !f.inDatabase);
        break;
      case "in-database":
        filtered = filtered.filter((f) => f.inDatabase);
        break;
      default:
        // 'all' - no filtering
        break;
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.gameId.toLowerCase().includes(term) ||
          f.gameTitle?.toLowerCase().includes(term) ||
          f.versions.some((v) => v.toLowerCase().includes(term)),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case "gameId":
          aVal = a.gameId;
          bVal = b.gameId;
          break;
        case "totalSize":
          aVal = a.totalSize;
          bVal = b.totalSize;
          break;
        case "lastUpdated":
          aVal = new Date(a.lastUpdated).getTime();
          bVal = new Date(b.lastUpdated).getTime();
          break;
        case "gameTitle":
          aVal = a.gameTitle || "";
          bVal = b.gameTitle || "";
          break;
        case "totalFiles":
          aVal = a.totalFiles;
          bVal = b.totalFiles;
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [gcsData?.folders, filter, searchTerm, sortField, sortOrder]);

  // Utility functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const handleSort = (field: GCSSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleSelectFolder = (gameId: string, checked: boolean) => {
    const newSelected = new Set(selectedFolders);
    if (checked) {
      newSelected.add(gameId);
    } else {
      newSelected.delete(gameId);
    }
    setSelectedFolders(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFolders(new Set(filteredFolders.map((f) => f.gameId)));
    } else {
      setSelectedFolders(new Set());
    }
  };

  const handleToggleFolder = (gameId: string) => {
    setExpandedFolder(expandedFolder === gameId ? null : gameId);
  };

  const handleDeleteFolder = (folder: GCSGameFolder) => {
    setDeleteConfirm({ isOpen: true, folder, file: null, isMultiple: false });
  };

  const handleDeleteFile = (file: GCSFile) => {
    setDeleteConfirm({ isOpen: true, folder: null, file, isMultiple: false });
  };

  const handleDeleteSelected = () => {
    setDeleteConfirm({
      isOpen: true,
      folder: null,
      file: null,
      isMultiple: true,
    });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.isMultiple) {
      // Delete multiple folders
      for (const gameId of selectedFolders) {
        try {
          await deleteFileMutation.mutateAsync(`games/${gameId}/`);
        } catch (error) {
          console.error(`Failed to delete folder ${gameId}:`, error);
        }
      }
      setSelectedFolders(new Set());
    } else if (deleteConfirm.folder) {
      // Delete entire folder
      await deleteFileMutation.mutateAsync(
        `games/${deleteConfirm.folder.gameId}/`,
      );
    } else if (deleteConfirm.file) {
      // Delete single file
      await deleteFileMutation.mutateAsync(deleteConfirm.file.name);
    }

    setDeleteConfirm({
      isOpen: false,
      folder: null,
      file: null,
      isMultiple: false,
    });
  };

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-slate-500">
          Chỉ Admin mới có thể truy cập quản lý GCS.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600">Đang tải dữ liệu GCS...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <h3 className="font-medium">Lỗi khi tải dữ liệu GCS</h3>
          <p className="mt-1 text-sm">
            {error instanceof Error
              ? error.message
              : "Đã xảy ra lỗi không xác định"}
          </p>
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {gcsData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7a4 4 0 00-4 4z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Game folders
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {gcsData.stats.totalFolders}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Tổng files</p>
                <p className="text-2xl font-bold text-slate-900">
                  {gcsData.stats.totalFiles}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Có trong DB
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {gcsData.stats.inDatabase}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Folders rác
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {gcsData.stats.orphaned}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Tổng dung lượng
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatFileSize(gcsData.stats.totalSize)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm kiếm game ID, tên game, version..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as GCSFolderFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả folders</option>
              <option value="in-database">Có trong DB</option>
              <option value="orphaned">Folders rác</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshMutation.isPending}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {refreshMutation.isPending ? "Đang tải..." : "Làm mới"}
            </button>

            {selectedFolders.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleteFileMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Xóa đã chọn ({selectedFolders.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Folders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      filteredFolders.length > 0 &&
                      selectedFolders.size === filteredFolders.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expand
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("gameId")}
                >
                  <div className="flex items-center">
                    Game ID
                    {sortField === "gameId" && (
                      <svg
                        className={`ml-1 w-4 h-4 ${sortOrder === "asc" ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("gameTitle")}
                >
                  <div className="flex items-center">
                    Tên Game
                    {sortField === "gameTitle" && (
                      <svg
                        className={`ml-1 w-4 h-4 ${sortOrder === "asc" ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Versions
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("totalFiles")}
                >
                  <div className="flex items-center">
                    Files
                    {sortField === "totalFiles" && (
                      <svg
                        className={`ml-1 w-4 h-4 ${sortOrder === "asc" ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("totalSize")}
                >
                  <div className="flex items-center">
                    Kích thước
                    {sortField === "totalSize" && (
                      <svg
                        className={`ml-1 w-4 h-4 ${sortOrder === "asc" ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("lastUpdated")}
                >
                  <div className="flex items-center">
                    Cập nhật
                    {sortField === "lastUpdated" && (
                      <svg
                        className={`ml-1 w-4 h-4 ${sortOrder === "asc" ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFolders.map((folder) => (
                <Fragment key={folder.gameId}>
                  {/* Folder Row */}
                  <tr key={folder.gameId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedFolders.has(folder.gameId)}
                        onChange={(e) =>
                          handleSelectFolder(folder.gameId, e.target.checked)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleFolder(folder.gameId)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${expandedFolder === folder.gameId ? "rotate-90" : ""}`}
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
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {folder.gameId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {folder.gameTitle || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {folder.versions.slice(0, 3).map((version) => (
                          <span
                            key={version}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {version}
                          </span>
                        ))}
                        {folder.versions.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{folder.versions.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {folder.totalFiles}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(folder.totalSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(folder.lastUpdated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          folder.inDatabase
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {folder.inDatabase ? "Có trong DB" : "Folder rác"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleDeleteFolder(folder)}
                        disabled={deleteFileMutation.isPending}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium disabled:opacity-50"
                      >
                        Xóa folder
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Files */}
                  {expandedFolder === folder.gameId && (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">
                            Files trong folder {folder.gameId}:
                          </h4>
                          <div className="max-h-60 overflow-y-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="text-xs text-gray-500 uppercase">
                                  <th className="text-left py-2">Tên file</th>
                                  <th className="text-left py-2">Version</th>
                                  <th className="text-left py-2">Kích thước</th>
                                  <th className="text-left py-2">Cập nhật</th>
                                  <th className="text-left py-2">Thao tác</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {folder.files.map((file) => (
                                  <tr
                                    key={file.name}
                                    className="hover:bg-gray-100"
                                  >
                                    <td className="py-2 text-gray-900 break-all">
                                      {file.name.split("/").pop()}
                                    </td>
                                    <td className="py-2 text-gray-600">
                                      {file.version || "-"}
                                    </td>
                                    <td className="py-2 text-gray-600">
                                      {formatFileSize(file.size)}
                                    </td>
                                    <td className="py-2 text-gray-600">
                                      {formatDate(file.updated)}
                                    </td>
                                    <td className="py-2">
                                      <button
                                        onClick={() => handleDeleteFile(file)}
                                        disabled={deleteFileMutation.isPending}
                                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs disabled:opacity-50"
                                      >
                                        Xóa
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {filteredFolders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || filter !== "all"
                ? "Không tìm thấy folder nào phù hợp với bộ lọc"
                : "Không có folder nào trong GCS"}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() =>
                  setDeleteConfirm({
                    isOpen: false,
                    folder: null,
                    file: null,
                    isMultiple: false,
                  })
                }
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
                      Xác nhận xóa
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {deleteConfirm.isMultiple
                          ? `Bạn có chắc chắn muốn xóa ${selectedFolders.size} folder đã chọn?`
                          : deleteConfirm.folder
                            ? `Bạn có chắc chắn muốn xóa toàn bộ folder "${deleteConfirm.folder.gameId}" và tất cả files bên trong?`
                            : `Bạn có chắc chắn muốn xóa file "${deleteConfirm.file?.name}"?`}
                        <br />
                        <strong className="text-red-600">
                          Hành động này không thể hoàn tác.
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleteFileMutation.isPending}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {deleteFileMutation.isPending ? "Đang xóa..." : "Xóa"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirm({
                      isOpen: false,
                      folder: null,
                      file: null,
                      isMultiple: false,
                    })
                  }
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
