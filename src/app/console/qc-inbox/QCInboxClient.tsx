"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  useSubjects,
  useAgeBands,
} from "@/features/game-lessons/hooks/useGameLessons";

interface GameData {
  _id: string;
  gameId: string;
  title: string;
  description?: string;
  subject?: string; // subjectId hoặc code tuỳ API
  grade?: string;   // ageBandId hoặc code tuỳ API
  gameType?: string;
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
  version: string;
  versionId: string;
  liveVersionId: string | null;
  status: any;
  createdAt: string;
  updatedAt: string;
  ownerName: string;
  qcIssues: any[];
  tags: {
    level?: string;
    interest?: string[];
    skills?: string[];
    themes?: string[];
  };
}

interface QCInboxClientProps {
  allGames: GameData[];
  userRoles: string[];
}

const norm = (v: any) => (v ?? "").toString().toLowerCase().trim();

export function QCInboxClient({ allGames, userRoles }: QCInboxClientProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "published">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterIssue, setFilterIssue] = useState("all");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title">("updated");

  // ✅ lấy list môn + lớp từ API/hooks
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: ageBands = [], isLoading: ageBandsLoading } = useAgeBands();

  // ✅ build map id -> label (tự động)
  const subjectLabelById = useMemo(() => {
    const m = new Map<string, string>();
    (subjects ?? []).forEach((s: any) => {
      const id = (s?._id ?? s?.id ?? s?.code ?? "").toString();
      const name = (s?.name ?? s?.title ?? s?.label ?? "").toString();
      if (id) m.set(id, name || id);
    });
    return m;
  }, [subjects]);

  const gradeLabelById = useMemo(() => {
    const m = new Map<string, string>();
    (ageBands ?? []).forEach((g: any) => {
      const id = (g?._id ?? g?.id ?? g?.code ?? "").toString();
      const name =
        (g?.name ?? g?.title ?? g?.label ?? g?.displayName ?? "").toString();
      if (id) m.set(id, name || id);
    });
    return m;
  }, [ageBands]);

  const getSubjectLabel = (subject?: string) =>
    subject ? subjectLabelById.get(subject) || subject : "N/A";

  const getGradeLabel = (grade?: string) =>
    grade ? gradeLabelById.get(grade) || grade : "N/A";

  const filteredGames = useMemo(() => {
    const term = norm(searchTerm);

    return (allGames ?? [])
      .filter((game) => {
        const qcIssues = Array.isArray(game.qcIssues) ? game.qcIssues : [];
        const openIssues = qcIssues.filter((i) => i?.status !== "closed").length;

        // Tab filter
        const isPublished = !!game.liveVersionId;
        if (activeTab === "pending" && isPublished) return false;
        if (activeTab === "published" && !isPublished) return false;

        // Subject filter
        if (filterSubject !== "all" && game.subject !== filterSubject) return false;

        // Grade filter
        if (filterGrade !== "all" && game.grade !== filterGrade) return false;

        // Issue filter
        if (filterIssue === "has_issues" && openIssues === 0) return false;
        if (filterIssue === "no_issues" && openIssues > 0) return false;

        // Search filter (✅ thêm label môn/lớp + tránh undefined)
        if (term) {
          const subjectLabel = getSubjectLabel(game.subject);
          const gradeLabel = getGradeLabel(game.grade);

          const haystack = [
            game.title,
            game.gameId,
            game.ownerName,
            subjectLabel,
            gradeLabel,
            game.tags?.level,
            ...(game.tags?.skills ?? []),
            ...(game.tags?.themes ?? []),
            ...(game.tags?.interest ?? []),
          ];

          const matched = haystack.some((x) => norm(x).includes(term));
          if (!matched) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "title") return (a.title ?? "").localeCompare(b.title ?? "");
        const dateA = new Date(sortBy === "updated" ? a.updatedAt : a.createdAt).getTime();
        const dateB = new Date(sortBy === "updated" ? b.updatedAt : b.createdAt).getTime();
        return dateB - dateA;
      });
  }, [
    allGames,
    activeTab,
    searchTerm,
    filterSubject,
    filterGrade,
    filterIssue,
    sortBy,
    subjectLabelById,
    gradeLabelById,
  ]);

  const pendingCount = (allGames ?? []).filter((g) => !g.liveVersionId).length;
  const publishedCount = (allGames ?? []).filter((g) => !!g.liveVersionId).length;

  return (
    <div className="space-y-6">
      {/* Search and Filters Overlay */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Tìm tên game, ID, owner, môn/lớp, bài học..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* ✅ Subject select từ API */}
            <select
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              disabled={subjectsLoading}
            >
              <option value="all">{subjectsLoading ? "Đang tải môn..." : "Tất cả môn"}</option>
              {(subjects ?? []).map((s: any) => {
                const val = (s?._id ?? s?.id ?? s?.code ?? "").toString();
                const label = (s?.name ?? s?.title ?? s?.label ?? val).toString();
                return (
                  <option key={val} value={val}>
                    {label}
                  </option>
                );
              })}
            </select>

            {/* ✅ Grade/AgeBand select từ API */}
            <select
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              disabled={ageBandsLoading}
            >
              <option value="all">{ageBandsLoading ? "Đang tải lớp..." : "Tất cả lớp"}</option>
              {(ageBands ?? []).map((g: any) => {
                const val = (g?._id ?? g?.id ?? g?.code ?? "").toString();
                const label = (g?.name ?? g?.title ?? g?.label ?? g?.displayName ?? val).toString();
                return (
                  <option key={val} value={val}>
                    {label}
                  </option>
                );
              })}
            </select>

            <select
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              value={filterIssue}
              onChange={(e) => setFilterIssue(e.target.value)}
            >
              <option value="all">Trạng thái lỗi</option>
              <option value="has_issues">Có lỗi đang mở</option>
              <option value="no_issues">Sạch lỗi</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm("");
                setFilterSubject("all");
                setFilterGrade("all");
                setFilterIssue("all");
              }}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl w-fit border border-slate-200">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "pending" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Đang chờ ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("published")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "published" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Đã phát hành ({publishedCount})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Sắp xếp:
            <select
              className="bg-transparent text-indigo-600 outline-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="updated">Mới cập nhật</option>
              <option value="created">Mới tạo</option>
              <option value="title">Tên game A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4 text-left">Thông tin Game</th>
                <th className="px-6 py-4 text-left">Học liệu (Tags)</th>
                <th className="px-6 py-4 text-left">Vòng đời</th>
                <th className="px-6 py-4 text-left">Tình trạng Ch.Lượng</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredGames.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Không tìm thấy game</h3>
                      <p className="text-slate-500 max-w-xs mx-auto">
                        Vui lòng điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm của bạn.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilterSubject("all");
                          setFilterGrade("all");
                          setFilterIssue("all");
                        }}
                        className="mt-6 text-indigo-600 font-bold text-sm hover:underline"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGames.map((game) => {
                  const qcIssues = Array.isArray(game.qcIssues) ? game.qcIssues : [];
                  const openCount = qcIssues.filter((i) => i?.status !== "closed").length;

                  return (
                    <tr key={game._id} className="hover:bg-slate-50/80 transition-all">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-5">
                          <div className="w-24 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative shadow-sm">
                            {game.thumbnailDesktop ? (
                              <Image src={game.thumbnailDesktop} alt={game.title} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-200 bg-linear-to-br from-slate-50 to-slate-100">
                                <svg className="w-8 h-8 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 truncate text-[15px]">{game.title}</h4>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                                ID: {game.gameId}
                              </span>
                              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                v{game.version}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                              Bởi: <span className="text-slate-600 font-bold">{game.ownerName}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase border border-blue-100">
                              {getSubjectLabel(game.subject)}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase border border-emerald-100">
                              {getGradeLabel(game.grade)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-bold truncate max-w-[180px]">
                            <span className="text-slate-400">Bài:</span> {game.tags?.level || "Chưa gắn"}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="space-y-1.5">
                          <StatusChip status={game.status} />
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {new Date(game.updatedAt).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="space-y-2">
                          {qcIssues.length > 0 ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                <span className="text-xs font-bold text-rose-600">{openCount} Lỗi đang mở</span>
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-4">
                                Tổng: {qcIssues.length} issue
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-xs font-bold text-emerald-600 uppercase tracking-tight">Sạch lỗi</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-6 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/console/games/${game._id}/review?versionId=${game.versionId}`}
                            className="px-4 py-2 bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
                          >
                            Review QC
                          </Link>
                          <Link
                            href={`/console/games/${game._id}`}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                          >
                            Chi tiết
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
