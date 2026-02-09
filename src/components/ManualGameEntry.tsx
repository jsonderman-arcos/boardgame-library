import { useState } from 'react';
import { X, Save, Search, Loader } from 'lucide-react';
import { searchBggGames, lookupBggGame, BggSearchResult, BggGameData } from '../lib/bgg';

interface ManualGameEntryProps {
  barcode: string;
  onSave: (gameData: {
    barcode: string;
    bgg_id?: number;
    name: string;
    publisher?: string;
    year?: number;
    cover_image?: string;
    min_players?: number;
    max_players?: number;
    playtime_minutes?: number;
    min_age?: number;
    game_type?: string[];
    game_category?: string[];
    game_mechanic?: string[];
    description?: string;
  }) => void;
  onClose: () => void;
}

export default function ManualGameEntry({ barcode, onSave, onClose }: ManualGameEntryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<BggSearchResult[]>([]);
  const [selectedBggId, setSelectedBggId] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<BggGameData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('Please enter a game name to search');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchResults([]);
    setSelectedGame(null);

    try {
      const results = await searchBggGames(searchQuery.trim());

      if (results.length === 0) {
        setError('No games found. Try a different search term.');
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      console.error('BGG search error:', err);
      setError('Failed to search BoardGameGeek. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectGame = async (result: BggSearchResult) => {
    setIsLoadingDetails(true);
    setError('');
    setSelectedBggId(result.bgg_id);

    try {
      const gameDetails = await lookupBggGame(result.bgg_id);
      setSelectedGame(gameDetails);
      setSearchResults([]); // Clear search results after selection
    } catch (err) {
      console.error('BGG details lookup error:', err);
      setError('Failed to load game details. Please try again.');
      setSelectedBggId(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedGame || !selectedBggId) {
      setError('Please search for and select a game from BoardGameGeek');
      return;
    }

    onSave({
      barcode,
      bgg_id: selectedBggId,
      name: selectedGame.name,
      publisher: selectedGame.publisher,
      year: selectedGame.year,
      cover_image: selectedGame.cover_image,
      min_players: selectedGame.min_players,
      max_players: selectedGame.max_players,
      playtime_minutes: selectedGame.playtime_minutes,
      min_age: selectedGame.min_age,
      game_type: selectedGame.game_type,
      game_category: selectedGame.game_category,
      game_mechanic: selectedGame.game_mechanic,
      description: selectedGame.description,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-slate-900">Find Game on BoardGameGeek</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {barcode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                We couldn't find this barcode in our database. Please search for the game on BoardGameGeek.
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                Barcode: <span className="font-mono font-semibold">{barcode}</span>
              </p>
            </div>
          )}

          {/* Search Form */}
          {!selectedGame && (
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="searchQuery" className="block text-sm font-medium text-slate-700 mb-2">
                  Game Name
                </label>
                <div className="flex gap-2">
                  <input
                    id="searchQuery"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., Ticket to Ride"
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                    autoFocus
                    disabled={isSearching}
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="flex items-center space-x-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    <span>{isSearching ? 'Searching...' : 'Search'}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </form>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-900">Select your game:</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.bgg_id}
                    onClick={() => handleSelectGame(result)}
                    disabled={isLoadingDetails}
                    className="w-full text-left p-4 border-2 border-slate-200 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-semibold text-slate-900">{result.name}</div>
                    <div className="text-sm text-slate-600">Year: {result.year} • BGG ID: {result.bgg_id}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Details */}
          {isLoadingDetails && (
            <div className="flex items-center justify-center py-8 space-x-2 text-slate-600">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Loading game details...</span>
            </div>
          )}

          {/* Selected Game Preview */}
          {selectedGame && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-semibold">Game Found!</p>
              </div>

              <div className="border-2 border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex gap-4">
                  {selectedGame.cover_image && (
                    <img
                      src={selectedGame.cover_image}
                      alt={selectedGame.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{selectedGame.name}</h3>
                    {selectedGame.year && (
                      <p className="text-sm text-slate-600">Published: {selectedGame.year}</p>
                    )}
                    {selectedGame.publisher && (
                      <p className="text-sm text-slate-600">Publisher: {selectedGame.publisher}</p>
                    )}
                  </div>
                </div>

                {(selectedGame.min_players || selectedGame.max_players || selectedGame.playtime_minutes) && (
                  <div className="flex gap-4 text-sm text-slate-700 pt-2 border-t border-slate-200">
                    {selectedGame.min_players && selectedGame.max_players && (
                      <span>👥 {selectedGame.min_players}-{selectedGame.max_players} players</span>
                    )}
                    {selectedGame.playtime_minutes && (
                      <span>⏱️ {selectedGame.playtime_minutes} min</span>
                    )}
                    {selectedGame.min_age && (
                      <span>🎂 {selectedGame.min_age}+</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGame(null);
                    setSelectedBggId(null);
                    setSearchResults([]);
                  }}
                  className="flex-1 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Search Again
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center space-x-2 bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition"
                >
                  <Save className="w-5 h-5" />
                  <span>Add to Library</span>
                </button>
              </div>
            </div>
          )}

          {/* Cancel Button (when no game selected) */}
          {!selectedGame && searchResults.length === 0 && !isSearching && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
