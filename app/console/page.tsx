import { cookies } from 'next/headers';
import { verifySession } from '@/src/lib/session';
import { UserRepository } from '@/src/models/User';
import { GameRepository } from '@/src/models/Game';
import { GameVersionRepository } from '@/src/models/GameVersion';
import Link from 'next/link';

interface DashboardStats {
  totalGames: number;
  myGames: number;
  pendingQC: number;
  pendingApproval: number;
  published: number;
}

async function getDashboardStats(userId: string, roles: string[]): Promise<DashboardStats> {
  const gameRepo = await GameRepository.getInstance();
  const versionRepo = await GameVersionRepository.getInstance();
  
  const allGames = await gameRepo.findAll();
  
  // Count games by status
  let pendingQC = 0;
  let pendingApproval = 0;
  let published = 0;
  
  for (const game of allGames) {
    if (game.latestVersionId) {
      const version = await versionRepo.findById(game.latestVersionId.toString());
      if (version) {
        if (version.status === 'uploaded') pendingQC++;
        if (version.status === 'qc_passed') pendingApproval++;
        if (version.status === 'published') published++;
      }
    }
  }
  
  const myGames = allGames.filter(g => g.ownerId === userId).length;
  
  return {
    totalGames: allGames.length,
    myGames,
    pendingQC,
    pendingApproval,
    published,
  };
}

export default async function ConsoleDashboard() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('iruka_session');
  const session = verifySession(sessionCookie?.value || '');
  
  if (!session) {
    return null;
  }

  const userRepo = await UserRepository.getInstance();
  const user = await userRepo.findById(session.userId);
  
  if (!user) {
    return null;
  }

  const stats = await getDashboardStats(session.userId, user.roles);
  
  const hasRole = (role: string) => user.roles.includes(role as any);
  const isAdmin = hasRole('admin');
  const isDev = hasRole('dev');
  const isQC = hasRole('qc');
  const isCTO = hasRole('cto');
  const isCEO = hasRole('ceo');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Xin chào, {user.name || user.email}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(isDev || isAdmin) && (
          <Link href="/console/my-games" className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.myGames}</p>
                <p className="text-sm text-slate-500">Game của tôi</p>
              </div>
            </div>
          </Link>
        )}

        {(isQC || isAdmin) && (
          <Link href="/console/qc-inbox" className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingQC}</p>
                <p className="text-sm text-slate-500">Chờ QC</p>
              </div>
            </div>
          </Link>
        )}

        {(isCTO || isCEO || isAdmin) && (
          <Link href="/console/approval" className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingApproval}</p>
                <p className="text-sm text-slate-500">Chờ duyệt</p>
              </div>
            </div>
          </Link>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.published}</p>
              <p className="text-sm text-slate-500">Đã xuất bản</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Thao tác nhanh</h2>
        <div className="flex flex-wrap gap-3">
          {(isDev || isAdmin) && (
            <Link
              href="/console/my-games"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo game mới
            </Link>
          )}
          <Link
            href="/console/library"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Xem thư viện
          </Link>
        </div>
      </div>
    </div>
  );
}
