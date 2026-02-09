import { Trophy, Gamepad2 } from 'lucide-react';
import { PlayedGameStat } from '../../lib/dashboard';

interface MostPlayedGamesProps {
  games: PlayedGameStat[];
  maxPlayCount: number;
}

export default function MostPlayedGames({ games, maxPlayCount }: MostPlayedGamesProps) {
  // Filter out games with 0 plays
  const playedGames = games.filter(game => game.playCount > 0);

  if (playedGames.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Plays Yet</h3>
          <p className="text-slate-600">
            Start logging plays to see your most played games here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Trophy className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-slate-900">Most Played Games</h2>
      </div>

      <div className="space-y-4">
        {playedGames.map((entry, index) => {
          const percentage = maxPlayCount > 0 ? (entry.playCount / maxPlayCount) * 100 : 0;

          return (
            <div
              key={entry.id}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50 transition"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 text-center">
                <span className={`text-lg font-bold ${
                  index === 0 ? 'text-yellow-600' :
                  index === 1 ? 'text-slate-400' :
                  index === 2 ? 'text-orange-600' :
                  'text-slate-600'
                }`}>
                  {index + 1}
                </span>
              </div>

              {/* Cover Image */}
              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
                {entry.game.cover_image ? (
                  <img
                    src={entry.game.cover_image}
                    alt={entry.game.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gamepad2 className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Game Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {entry.game.name}
                </h3>
                <p className="text-sm text-slate-600 truncate">
                  {entry.game.publisher}
                  {entry.game.year && ` • ${entry.game.year}`}
                </p>
              </div>

              {/* Play Count & Bar */}
              <div className="flex-shrink-0 w-32">
                <div className="flex items-center justify-end space-x-2 mb-1">
                  <span className="text-sm font-semibold text-slate-900">
                    {entry.playCount}
                  </span>
                  <span className="text-xs text-slate-500">
                    {entry.playCount === 1 ? 'play' : 'plays'}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
