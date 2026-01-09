import { Star, Trash2, Edit, DollarSign, Users, Clock } from 'lucide-react';
import { UserLibraryEntry, Game } from '../lib/supabase';

interface GameCardProps {
  entry: UserLibraryEntry & { game: Game };
  onToggleFavorite: (entryId: string, isFavorite: boolean) => void;
  onDelete: (entryId: string) => void;
  onEdit: (entry: UserLibraryEntry & { game: Game }) => void;
  layout?: 'grid' | 'list';
}

export default function GameCard({ entry, onToggleFavorite, onDelete, onEdit, layout = 'grid' }: GameCardProps) {
  const { game } = entry;

  if (layout === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition group flex">
        <div className="w-24 h-24 bg-slate-100 flex-shrink-0">
          {game.cover_image ? (
            <img
              src={game.cover_image}
              alt={game.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Library className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="flex-1 p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 truncate">{game.name}</h3>
              {game.is_expansion && (
                <span className="flex-shrink-0 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  Expansion
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 text-sm text-slate-600 mb-2">
              <span>{game.publisher || 'Unknown Publisher'}</span>
              {game.year && (
                <>
                  <span>•</span>
                  <span>{game.year}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              {(game.min_players || game.max_players) && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {game.min_players === game.max_players
                      ? `${game.min_players}`
                      : `${game.min_players || '?'}-${game.max_players || '?'}`}
                  </span>
                </div>
              )}
              {game.playtime_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{game.playtime_minutes} min</span>
                </div>
              )}
              {entry.played_dates && entry.played_dates.length > 0 && (
                <span className="text-xs">
                  Played {entry.played_dates.length}x
                </span>
              )}
            </div>
            {entry.personal_ranking && (
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                  entry.personal_ranking === 'high'
                    ? 'bg-green-100 text-green-800'
                    : entry.personal_ranking === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {entry.personal_ranking}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {entry.for_sale && (
              <div className="bg-green-500 text-white p-2 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            )}
            <button
              onClick={() => onToggleFavorite(entry.id, !entry.is_favorite)}
              className={`p-2 rounded-lg transition ${
                entry.is_favorite
                  ? 'bg-yellow-400 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-yellow-400 hover:text-white'
              }`}
            >
              <Star className="w-4 h-4" fill={entry.is_favorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => onEdit(entry)}
              className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition group">
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        {game.cover_image ? (
          <img
            src={game.cover_image}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Library className="w-8 h-8" />
          </div>
        )}

        <div className="absolute top-1 right-1 flex space-x-1">
          {entry.for_sale && (
            <div className="bg-green-500 text-white p-1 rounded shadow-lg">
              <DollarSign className="w-3 h-3" />
            </div>
          )}
          <button
            onClick={() => onToggleFavorite(entry.id, !entry.is_favorite)}
            className={`p-1 rounded shadow-lg transition ${
              entry.is_favorite
                ? 'bg-yellow-400 text-white'
                : 'bg-white/90 text-slate-600 hover:bg-yellow-400 hover:text-white'
            }`}
          >
            <Star className="w-3 h-3" fill={entry.is_favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="p-2">
        <div className="flex items-start gap-1 mb-0.5">
          <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight flex-1">{game.name}</h3>
          {game.is_expansion && (
            <span className="flex-shrink-0 px-1 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-medium rounded">
              EXP
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 truncate mb-1">{game.publisher || 'Unknown'}</p>

        {((game.min_players || game.max_players) || game.playtime_minutes) && (
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
            {(game.min_players || game.max_players) && (
              <div className="flex items-center gap-0.5">
                <Users className="w-3 h-3" />
                <span>
                  {game.min_players === game.max_players
                    ? `${game.min_players}`
                    : `${game.min_players || '?'}-${game.max_players || '?'}`}
                </span>
              </div>
            )}
            {game.playtime_minutes && (
              <div className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                <span>{game.playtime_minutes}m</span>
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(entry)}
            className="flex-1 flex items-center justify-center px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="flex items-center justify-center px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Library({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}
