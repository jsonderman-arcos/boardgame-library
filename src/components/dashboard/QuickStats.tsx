import { BookOpen, TrendingUp, Star, Clock } from 'lucide-react';
import StatCard from './StatCard';
import { DashboardStats } from '../../lib/dashboard';

interface QuickStatsProps {
  stats: DashboardStats;
}

export default function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0.5">
      <StatCard
        icon={<BookOpen className="w-5 h-5" strokeWidth={1.5} />}
        label="Total Entries"
        value={stats.totalGames}
        gradient={true}
      />
      <StatCard
        icon={<TrendingUp className="w-5 h-5" strokeWidth={1.5} />}
        label="Total Sessions"
        value={stats.totalPlays}
        gradient={true}
      />
      <StatCard
        icon={<Star className="w-5 h-5" strokeWidth={1.5} />}
        label="Starred"
        value={stats.favoriteCount}
      />
      <StatCard
        icon={<Clock className="w-5 h-5" strokeWidth={1.5} />}
        label="Unplayed"
        value={stats.unplayedCount}
        sublabel={stats.totalGames > 0 ? `${Math.round((stats.unplayedCount / stats.totalGames) * 100)}% of collection` : undefined}
      />
    </div>
  );
}
