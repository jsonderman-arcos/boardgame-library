import { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats, getMostPlayedGames, getRecentlyAddedGames, getPlayActivityByMonth, DashboardStats, PlayedGameStat, PlayActivity } from '../lib/dashboard';
import QuickStats from './dashboard/QuickStats';
import QuickActions from './dashboard/QuickActions';
import MostPlayedGames from './dashboard/MostPlayedGames';
import RecentlyAddedGames from './dashboard/RecentlyAddedGames';
import PlayActivityChart from './dashboard/PlayActivityChart';
import { toast } from 'sonner';

interface DashboardProps {
  onNavigate?: (tab: 'library' | 'gameNiteTools', params?: { tool?: 'game-chooser' | 'first-player' }) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [mostPlayed, setMostPlayed] = useState<PlayedGameStat[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<PlayedGameStat[]>([]);
  const [playActivity, setPlayActivity] = useState<PlayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    if (!user) return;

    try {
      const [dashboardStats, mostPlayedGames, recentGames, activity] = await Promise.all([
        getDashboardStats(user.id),
        getMostPlayedGames(user.id, 5),
        getRecentlyAddedGames(user.id, 10),
        getPlayActivityByMonth(user.id, 12),
      ]);
      setStats(dashboardStats);
      setMostPlayed(mostPlayedGames);
      setRecentlyAdded(recentGames);
      setPlayActivity(activity);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    toast.success('Dashboard refreshed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Failed to load dashboard</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>

        {/* Quick Stats */}
        <QuickStats stats={stats} />

        {/* Quick Actions - Game Nite Tools Shortcuts */}
        {stats.totalGames > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <QuickActions
              onNavigateToGameNiteTools={(tool) => {
                if (onNavigate) {
                  onNavigate('gameNiteTools', { tool });
                } else {
                  toast.info('Switch to the Game Nite Tools tab');
                }
              }}
            />
          </div>
        )}

        {/* Most Played Games */}
        {stats.totalGames > 0 && (
          <div className="mt-6">
            <MostPlayedGames
              games={mostPlayed}
              maxPlayCount={mostPlayed[0]?.playCount || 0}
            />
          </div>
        )}

        {/* Recently Added Games */}
        {stats.totalGames > 0 && recentlyAdded.length > 0 && (
          <div className="mt-6">
            <RecentlyAddedGames games={recentlyAdded} />
          </div>
        )}

        {/* Play Activity Chart */}
        {stats.totalGames > 0 && playActivity.length > 0 && (
          <div className="mt-6">
            <PlayActivityChart activity={playActivity} />
          </div>
        )}

        {/* Empty State */}
        {stats.totalGames === 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Start Your Collection</h2>
              <p className="text-slate-600 mb-6">
                Add games to your library to see statistics about your collection and play history.
              </p>
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('library');
                  } else {
                    toast.info('Switch to the Library tab to add games');
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition"
              >
                Go to Library
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
