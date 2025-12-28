import { useState, useEffect } from 'react';

interface DashboardStats {
  myGames: number;
  draftGames: number;
  qcFailedGames: number;
  uploadedGames: number;
  qcPassedGames: number;
  approvedGames: number;
  publishedGames: number;
  recentGames: Array<{
    _id: string;
    title?: string;
    gameId: string;
    status: string;
    updatedAt: string;
  }>;
}

interface Props {
  initialData?: DashboardStats;
  userRoles: string[];
  onDataLoaded?: (data: DashboardStats) => void;
}

export default function DashboardData({ initialData, userRoles, onDataLoaded }: Props) {
  const [data, setData] = useState<DashboardStats | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      onDataLoaded?.(initialData);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const dashboardData = await response.json();
        setData(dashboardData);
        onDataLoaded?.(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialData, onDataLoaded]);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Stats Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-12"></div>
                </div>
                <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-slate-200 animate-pulse">
            <div className="p-5 border-b border-slate-200">
              <div className="h-6 bg-slate-200 rounded w-32"></div>
            </div>
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-slate-200 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 animate-pulse">
            <div className="p-5 border-b border-slate-200">
              <div className="h-6 bg-slate-200 rounded w-32"></div>
            </div>
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-slate-200">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-slate-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return null; // Data is handled by parent component
}