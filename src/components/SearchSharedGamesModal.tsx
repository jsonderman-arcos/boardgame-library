import { useState, useEffect } from 'react';
import { X, Search, Plus, Loader, Users, Clock } from 'lucide-react';
import { searchSharedGames, addGameToLibrary } from '../lib/games';
import { Game } from '../lib/supabase';

interface SearchSharedGamesModalProps {
  onClose: () => void;
  onGameAdded: () => void;
  onAddNew: () => void;
  userId: string;
}

export default function SearchSharedGamesModal({
  onClose,
  onGameAdded,
  onAddNew,
  userId,
}: SearchSharedGamesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingGameId, setAddingGameId] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const results = await searchSharedGames(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGame = async (gameId: string) => {
    setAddingGameId(gameId);
    try {
      await addGameToLibrary(userId, gameId);
      onGameAdded();
      onClose();
    } catch (error) {
      console.error('Error adding game:', error);
      alert('Failed to add game. It may already be in your library.');
    } finally {
      setAddingGameId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Search Game Library</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a game by name..."
              autoFocus
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : searchQuery.trim() === '' ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">Start typing to search the game library</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 text-lg mb-2">No games found</p>
              <p className="text-slate-500 text-sm">Try a different search or add a new game</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  {game.cover_image ? (
                    <img
                      src={game.cover_image}
                      alt={game.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                      <span className="text-2xl text-slate-400">🎲</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">{game.name}</h3>
                      {game.is_expansion && (
                        <span className="flex-shrink-0 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Expansion
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      {game.publisher && <span>{game.publisher}</span>}
                      {game.year && (
                        <>
                          <span>•</span>
                          <span>{game.year}</span>
                        </>
                      )}
                    </div>
                    {((game.min_players || game.max_players) || game.playtime_minutes) && (
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        {(game.min_players || game.max_players) && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>
                              {game.min_players === game.max_players
                                ? `${game.min_players}`
                                : `${game.min_players || '?'}-${game.max_players || '?'}`}
                            </span>
                          </div>
                        )}
                        {game.playtime_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{game.playtime_minutes} min</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddGame(game.id)}
                    disabled={addingGameId === game.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingGameId === game.id ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onAddNew}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-lg hover:bg-slate-50 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Can't find it? Scan a barcode instead</span>
          </button>
        </div>
      </div>
    </div>
  );
}
