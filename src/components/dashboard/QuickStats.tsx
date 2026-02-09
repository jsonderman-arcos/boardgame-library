import { BookOpen, TrendingUp, Star, Clock } from 'lucide-react';
import StatCard from './StatCard';
import { DashboardStats } from '../../lib/dashboard';

interface QuickStatsProps {
  stats: DashboardStats;
}

export default function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <StatCard
        icon={<BookOpen className="w-6 h-6" />}
        label="Total Games"
        value={stats.totalGames}
        gradient={true}
      />
      <StatCard
        icon={<TrendingUp className="w-6 h-6" />}
        label="Total Plays"
        value={stats.totalPlays}
        gradient={true}
      />
      <StatCard
        icon={<Star className="w-6 h-6" />}
        label="Favorites"
        value={stats.favoriteCount}
      />
      <StatCard
        icon={<Clock className="w-6 h-6" />}
        label="Unplayed"
        value={stats.unplayedCount}
        sublabel={stats.totalGames > 0 ? `${Math.round((stats.unplayedCount / stats.totalGames) * 100)}% of library` : undefined}
      />
    </div>
  );
}
