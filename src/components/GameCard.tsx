import { useState } from 'react';
import { Star, Trash2, Edit, DollarSign, Users, Clock, Plus, MoreVertical } from 'lucide-react';
import { UserLibraryEntry, Game } from '../lib/supabase';

interface GameCardProps {
  entry: UserLibraryEntry & { game: Game };
  onToggleFavorite: (entryId: string, isFavorite: boolean) => void;
  onToggleForSale?: (entryId: string, forSale: boolean) => void;
  onDelete: (entryId: string) => void;
  onEdit: (entry: UserLibraryEntry & { game: Game }) => void;
  onAddPlay?: (entryId: string) => void;
  layout?: 'grid' | 'list';
}

export default function GameCard({ entry, onToggleFavorite, onToggleForSale, onDelete, onEdit, onAddPlay, layout = 'grid' }: GameCardProps) {
  const { game } = entry;
  const playCount = entry.played_dates?.length || 0;
  const [showMenu, setShowMenu] = useState(false);

  if (layout === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition group flex relative">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 flex-shrink-0 overflow-hidden rounded-l-lg">
          {game.cover_image ? (
            <img
              src={game.cover_image}
              alt={game.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Library className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          )}
        </div>

        <div className="flex-1 p-3 sm:p-4 flex items-center min-w-0">
          <div className="flex-1 min-w-0 mr-2 sm:mr-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base">{game.name}</h3>
              {game.is_expansion && (
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  EXP
                </span>
              )}
              {entry.for_sale && (
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span className="hidden sm:inline">Sale</span>
                </span>
              )}
            </div>
            {(game.min_players || game.max_players) && (
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-600 mb-1">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>
                    {game.min_players === game.max_players
                      ? `${game.min_players} player${game.min_players > 1 ? 's' : ''}`
                      : `${game.min_players || '?'}-${game.max_players || '?'} players`}
                  </span>
                </div>
                {game.year && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{game.year}</span>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-600 flex-wrap">
              {game.playtime_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="hidden sm:inline">{game.playtime_minutes} min</span>
                  <span className="sm:hidden">{game.playtime_minutes}m</span>
                </div>
              )}
              {entry.personal_ranking && (
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
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
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 sm:p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                title="More options"
              >
                <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-[101]">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(entry);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Details</span>
                    </button>
                    {onToggleForSale && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onToggleForSale(entry.id, !entry.for_sale);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>{entry.for_sale ? 'Unmark Sale' : 'Mark for Sale'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(entry.id);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => onToggleFavorite(entry.id, !entry.is_favorite)}
              className={`p-1.5 sm:p-2 rounded-lg transition ${
                entry.is_favorite
                  ? 'bg-yellow-400 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-yellow-400 hover:text-white'
              }`}
              title={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={entry.is_favorite ? 'currentColor' : 'none'} />
            </button>
            {onAddPlay && (
              <button
                onClick={() => onAddPlay(entry.id)}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium"
                title="Log a play"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-semibold">{playCount}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition group flex flex-col">
      <div className="aspect-square bg-slate-100 relative overflow-hidden rounded-t-lg">
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

        {entry.for_sale && (
          <div className="absolute top-1 right-1 bg-green-500 text-white p-1 rounded shadow-lg">
            <DollarSign className="w-3 h-3" />
          </div>
        )}
      </div>

      <div className="p-2 flex flex-col flex-1">
        <div className="flex items-start gap-1 mb-0.5">
          <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight flex-1">{game.name}</h3>
          {game.is_expansion && (
            <span className="flex-shrink-0 px-1 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-medium rounded">
              EXP
            </span>
          )}
        </div>

        {(game.min_players || game.max_players) && (
          <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
            <Users className="w-3 h-3" />
            <span>
              {game.min_players === game.max_players
                ? `${game.min_players} player${game.min_players > 1 ? 's' : ''}`
                : `${game.min_players || '?'}-${game.max_players || '?'} players`}
            </span>
          </div>
        )}

        {game.playtime_minutes && (
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
            <Clock className="w-3 h-3" />
            <span>{game.playtime_minutes}m</span>
          </div>
        )}

        <div className="flex items-center justify-end space-x-1 mt-auto pt-2">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center justify-center px-2 py-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
              title="More options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-[100]"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute left-0 bottom-full mb-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-[101]">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(entry);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Details</span>
                  </button>
                  {onToggleForSale && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onToggleForSale(entry.id, !entry.for_sale);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>{entry.for_sale ? 'Unmark Sale' : 'Mark for Sale'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(entry.id);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => onToggleFavorite(entry.id, !entry.is_favorite)}
            className={`flex items-center justify-center px-2 py-1.5 rounded transition ${
              entry.is_favorite
                ? 'bg-yellow-400 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-yellow-400 hover:text-white'
            }`}
            title={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className="w-3.5 h-3.5" fill={entry.is_favorite ? 'currentColor' : 'none'} />
          </button>
          {onAddPlay && (
            <button
              onClick={() => onAddPlay(entry.id)}
              className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition font-medium"
              title="Log a play"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{playCount}</span>
            </button>
          )}
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
