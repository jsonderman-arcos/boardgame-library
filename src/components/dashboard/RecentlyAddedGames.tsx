import { Clock, Gamepad2 } from 'lucide-react';
import { PlayedGameStat } from '../../lib/dashboard';

interface RecentlyAddedGamesProps {
  games: PlayedGameStat[];
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

export default function RecentlyAddedGames({ games }: RecentlyAddedGamesProps) {
  if (games.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Clock className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-slate-900">Recently Added</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {games.map((entry) => (
          <div
            key={entry.id}
            className="group cursor-pointer"
          >
            {/* Cover Image */}
            <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2 shadow-sm group-hover:shadow-md transition">
              {entry.game.cover_image ? (
                <img
                  src={entry.game.cover_image}
                  alt={entry.game.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gamepad2 className="w-12 h-12 text-slate-400" />
                </div>
              )}
            </div>

            {/* Game Info */}
            <div>
              <h3 className="font-semibold text-sm text-slate-900 truncate group-hover:text-purple-600 transition">
                {entry.game.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {getRelativeTime(entry.added_date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
