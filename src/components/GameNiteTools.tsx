import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserLibrary } from '../lib/games';
import { UserLibraryEntry, Game } from '../lib/supabase';
import Header from './Header';
import { Sparkles, Users, Clock, Grid3x3 } from 'lucide-react';

export default function GameNiteTools() {
  const { user } = useAuth();
  const [library, setLibrary] = useState<(UserLibraryEntry & { game: Game })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [maxPlaytime, setMaxPlaytime] = useState<number | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<(UserLibraryEntry & { game: Game }) | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  useEffect(() => {
    loadLibrary();
  }, [user]);

  async function loadLibrary() {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getUserLibrary(user.id);
      setLibrary(data);
    } catch (err) {
      setError('Failed to load your library');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Get all unique game types from library
  const allGameTypes = useMemo(() => {
    const types = new Set<string>();
    library.forEach(entry => {
      entry.game?.game_type?.forEach(type => types.add(type));
    });
    return Array.from(types).sort();
  }, [library]);

  // Filter games based on criteria
  const filteredGames = useMemo(() => {
    return library.filter(entry => {
      const game = entry.game;
      if (!game) return false;

      // Player count filter
      if (playerCount) {
        const minPlayers = game.min_players || 1;
        const maxPlayers = game.max_players || 99;
        if (playerCount < minPlayers || playerCount > maxPlayers) {
          return false;
        }
      }

      // Playtime filter
      if (maxPlaytime && game.playtime_minutes) {
        if (game.playtime_minutes > maxPlaytime) {
          return false;
        }
      }

      // Game type filter
      if (selectedTypes.length > 0) {
        if (!game.game_type || !game.game_type.some(type => selectedTypes.includes(type))) {
          return false;
        }
      }

      return true;
    });
  }, [library, playerCount, maxPlaytime, selectedTypes]);

  function spinWheel() {
    if (filteredGames.length === 0) {
      setError('No games match your criteria!');
      return;
    }

    setError(null);

    // If there's already a selected entry, animate it out first
    if (selectedEntry) {
      setIsTransitioning(true);
      setSelectedEntry(null);

      // Wait for fade-out animation before spinning
      setTimeout(() => {
        setIsTransitioning(false);
        startSpin();
      }, 500);
    } else {
      startSpin();
    }
  }

  function startSpin() {
    setIsSpinning(true);

    // Random game selection
    const randomIndex = Math.floor(Math.random() * filteredGames.length);
    const chosen = filteredGames[randomIndex];

    // Spin animation (3-5 full rotations + random offset)
    const spins = 3 + Math.random() * 2;
    const finalRotation = rotationDegrees + (360 * spins);
    setRotationDegrees(finalRotation);

    // Show result after animation
    setTimeout(() => {
      setSelectedEntry(chosen);
      setIsSpinning(false);
    }, 3000);
  }

  function resetFilters() {
    setPlayerCount(null);
    setMaxPlaytime(null);
    setSelectedTypes([]);
    setSelectedEntry(null);
  }

  function toggleGameType(type: string) {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Game Nite Tools
          </h1>
          <p className="text-slate-600 mt-2">
            Let the wheel of destiny choose your next game night adventure!
          </p>
        </div>

        {/* Filters Section */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Game Criteria</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Player Count */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Users className="w-4 h-4" />
                Number of Players
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={playerCount || ''}
                onChange={(e) => setPlayerCount(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Any"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Max Playtime */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Clock className="w-4 h-4" />
                Max Playtime (minutes)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={maxPlaytime || ''}
                onChange={(e) => setMaxPlaytime(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Any"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Game Types */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Grid3x3 className="w-4 h-4" />
                Game Types
              </label>
              {allGameTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allGameTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleGameType(type)}
                      className={`px-3 py-1.5 text-sm rounded-full transition ${
                        selectedTypes.includes(type)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No game types available</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'} match your criteria
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Wheel Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col items-center">
            {/* Wheel or Card Container */}
            <div className="mb-8 min-h-[320px] flex items-center justify-center">
              {/* Wheel Container */}
              {(!selectedEntry || isSpinning) && (
                <div className={`relative w-80 h-80 transition-all duration-500 ${
                  isSpinning ? 'opacity-100 scale-100' : selectedEntry ? 'opacity-0 scale-0' : 'opacity-100 scale-100 animate-[fadeIn_0.5s_ease-in]'
                }`}>
                  <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 shadow-lg transition-transform duration-[3000ms] ease-out ${
                      isSpinning ? 'scale-105' : 'scale-100'
                    }`}
                    style={{
                      transform: `rotate(${rotationDegrees}deg)`,
                    }}
                  >
                    {/* Wheel segments decoration */}
                    <div className="absolute inset-4 rounded-full bg-white/10 backdrop-blur-sm"></div>
                    <div className="absolute inset-8 rounded-full bg-white/10 backdrop-blur-sm"></div>
                    <div className="absolute inset-12 rounded-full bg-white/10 backdrop-blur-sm"></div>

                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-16 h-16 text-white" />
                    </div>
                  </div>

                  {/* Pointer */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-slate-900 z-10"></div>
                </div>
              )}

              {/* Selected Game Display */}
              {selectedEntry && !isSpinning && (
                <div className="w-full max-w-md bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg overflow-hidden border-2 border-purple-300 shadow-xl animate-[fadeIn_0.5s_ease-in]">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                    <h3 className="text-2xl font-bold text-white text-center">
                      🎉 Your Game Tonight!
                    </h3>
                  </div>

                  <div className="p-6">
                    {/* Game Card */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      {selectedEntry.game.cover_image ? (
                        <img
                          src={selectedEntry.game.cover_image}
                          alt={selectedEntry.game.name}
                          className="w-full h-64 object-cover"
                        />
                      ) : (
                        <div className="w-full h-64 bg-slate-100 flex items-center justify-center">
                          <div className="text-slate-400 text-center">
                            <Grid3x3 className="w-16 h-16 mx-auto mb-2" />
                            <p className="text-sm">No image available</p>
                          </div>
                        </div>
                      )}

                      <div className="p-4">
                        <h4 className="text-2xl font-bold text-slate-900 mb-2">
                          {selectedEntry.game.name}
                        </h4>

                        {selectedEntry.game.publisher && (
                          <p className="text-sm text-slate-600 mb-3">
                            by {selectedEntry.game.publisher}
                            {selectedEntry.game.year && ` (${selectedEntry.game.year})`}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-sm mb-3">
                          {(selectedEntry.game.min_players || selectedEntry.game.max_players) && (
                            <div className="flex items-center gap-1 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full">
                              <Users className="w-4 h-4" />
                              <span>
                                {selectedEntry.game.min_players === selectedEntry.game.max_players
                                  ? `${selectedEntry.game.min_players} players`
                                  : `${selectedEntry.game.min_players || '?'}-${selectedEntry.game.max_players || '?'} players`}
                              </span>
                            </div>
                          )}

                          {selectedEntry.game.playtime_minutes && (
                            <div className="flex items-center gap-1 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full">
                              <Clock className="w-4 h-4" />
                              <span>{selectedEntry.game.playtime_minutes} min</span>
                            </div>
                          )}
                        </div>

                        {selectedEntry.game.game_type && selectedEntry.game.game_type.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedEntry.game.game_type.map(type => (
                              <span
                                key={type}
                                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Spin Button */}
            <button
              onClick={spinWheel}
              disabled={isSpinning || isTransitioning || filteredGames.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              {isSpinning ? 'Spinning...' : isTransitioning ? 'Spinning...' : selectedEntry ? 'Spin Again!' : 'Spin the Wheel!'}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
