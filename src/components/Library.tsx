import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Star, Filter, Grid3x3, List, ChevronDown, X, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserLibrary,
  getGameByBarcode,
  createSharedGame,
  addGameToLibrary,
  updateLibraryEntry,
  removeGameFromLibrary,
  lookupBarcode,
} from '../lib/games';
import { UserLibraryEntry, Game } from '../lib/supabase';
import Header from './Header';
import GameCard from './GameCard';
import BarcodeScanner from './BarcodeScanner';
import EditGameModal from './EditGameModal';
import SearchSharedGamesModal from './SearchSharedGamesModal';

type SortOption = 'name-asc' | 'name-desc' | 'date-added-desc' | 'date-added-asc' | 'plays-desc' | 'plays-asc';

export default function Library() {
  const { user, refreshProfile } = useAuth();
  const [library, setLibrary] = useState<(UserLibraryEntry & { game: Game })[]>([]);
  const [filteredLibrary, setFilteredLibrary] = useState<(UserLibraryEntry & { game: Game })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingGame, setEditingGame] = useState<(UserLibraryEntry & { game: Game }) | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterForSale, setFilterForSale] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  const [filters, setFilters] = useState({
    publishers: [] as string[],
    gameTypes: [] as string[],
    gameCategories: [] as string[],
    rankings: [] as string[],
    minPlays: 0,
    maxPlays: Infinity,
    years: [] as string[],
    playerCounts: [] as number[],
  });

  const availableFilters = useMemo(() => {
    const publishers = new Set<string>();
    const gameTypes = new Set<string>();
    const gameCategories = new Set<string>();
    const years = new Set<string>();

    library.forEach((entry) => {
      if (entry.game.publisher) publishers.add(entry.game.publisher);
      if (entry.game.year) years.add(entry.game.year);
      entry.game.game_type?.forEach((type) => gameTypes.add(type));
      entry.game.game_category?.forEach((cat) => gameCategories.add(cat));
    });

    return {
      publishers: Array.from(publishers).sort(),
      gameTypes: Array.from(gameTypes).sort(),
      gameCategories: Array.from(gameCategories).sort(),
      years: Array.from(years).sort(),
    };
  }, [library]);

  useEffect(() => {
    if (user) {
      loadLibrary();
    }
  }, [user]);

  useEffect(() => {
    let filtered = [...library];

    if (searchQuery) {
      filtered = filtered.filter(
        (entry) =>
          entry.game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.game.publisher?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.game.barcode.includes(searchQuery)
      );
    }

    if (filterFavorites) {
      filtered = filtered.filter((entry) => entry.is_favorite);
    }

    if (filterForSale) {
      filtered = filtered.filter((entry) => entry.for_sale);
    }

    if (filters.publishers.length > 0) {
      filtered = filtered.filter(
        (entry) => entry.game.publisher && filters.publishers.includes(entry.game.publisher)
      );
    }

    if (filters.gameTypes.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.game.game_type?.some((type) => filters.gameTypes.includes(type))
      );
    }

    if (filters.gameCategories.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.game.game_category?.some((cat) => filters.gameCategories.includes(cat))
      );
    }

    if (filters.rankings.length > 0) {
      filtered = filtered.filter(
        (entry) => entry.personal_ranking && filters.rankings.includes(entry.personal_ranking)
      );
    }

    if (filters.years.length > 0) {
      filtered = filtered.filter((entry) => entry.game.year && filters.years.includes(entry.game.year));
    }

    const playsCount = (entry: UserLibraryEntry & { game: Game }) =>
      entry.played_dates?.length || 0;

    if (filters.minPlays > 0) {
      filtered = filtered.filter((entry) => playsCount(entry) >= filters.minPlays);
    }

    if (filters.maxPlays !== Infinity) {
      filtered = filtered.filter((entry) => playsCount(entry) <= filters.maxPlays);
    }

    if (filters.playerCounts.length > 0) {
      filtered = filtered.filter((entry) => {
        const minPlayers = entry.game.min_players;
        const maxPlayers = entry.game.max_players;

        if (!minPlayers && !maxPlayers) return false;

        return filters.playerCounts.some((count) => {
          if (count === 6) {
            if (!minPlayers && maxPlayers) return maxPlayers >= 6;
            if (minPlayers && !maxPlayers) return true;
            return maxPlayers >= 6 || minPlayers >= 6;
          }

          if (!minPlayers && maxPlayers) return count <= maxPlayers;
          if (minPlayers && !maxPlayers) return count >= minPlayers;
          return count >= minPlayers && count <= maxPlayers;
        });
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.game.name.localeCompare(b.game.name);
        case 'name-desc':
          return b.game.name.localeCompare(a.game.name);
        case 'date-added-desc':
          return new Date(b.added_date).getTime() - new Date(a.added_date).getTime();
        case 'date-added-asc':
          return new Date(a.added_date).getTime() - new Date(b.added_date).getTime();
        case 'plays-desc':
          return playsCount(b) - playsCount(a);
        case 'plays-asc':
          return playsCount(a) - playsCount(b);
        default:
          return 0;
      }
    });

    setFilteredLibrary(filtered);
  }, [library, searchQuery, filterFavorites, filterForSale, filters, sortBy]);

  const loadLibrary = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserLibrary(user.id);
      setLibrary(data);
    } catch (error) {
      console.error('Error loading library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameAdded = async () => {
    await loadLibrary();
    await refreshProfile();
  };

  const handleScanBarcode = async (barcode: string) => {
    if (!user) return;

    try {
      let game = await getGameByBarcode(barcode);

      if (!game) {
        const gameData = await lookupBarcode(barcode);
        game = await createSharedGame({
          barcode,
          name: gameData.name || 'Unknown Game',
          publisher: gameData.publisher,
          year: gameData.year,
          cover_image: gameData.cover_image,
        });
      }

      await addGameToLibrary(user.id, game.id);
      await loadLibrary();
      await refreshProfile();
      setShowScanner(false);
    } catch (error) {
      console.error('Error adding game:', error);
      alert('Failed to add game. It may already be in your library.');
    }
  };

  const handleToggleFavorite = async (entryId: string, isFavorite: boolean) => {
    try {
      await updateLibraryEntry(entryId, { is_favorite: isFavorite });
      await loadLibrary();
      await refreshProfile();
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleDeleteGame = async (entryId: string) => {
    if (!confirm('Are you sure you want to remove this game from your library?')) {
      return;
    }

    try {
      await removeGameFromLibrary(entryId);
      await loadLibrary();
      await refreshProfile();
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const handleSaveEdit = async (entryId: string, updates: Partial<UserLibraryEntry>) => {
    try {
      await updateLibraryEntry(entryId, updates);
      await loadLibrary();
      await refreshProfile();
      setEditingGame(null);
    } catch (error) {
      console.error('Error updating game:', error);
    }
  };

  const handleAddPlay = async (entryId: string) => {
    const entry = library.find((e) => e.id === entryId);
    if (!entry) return;

    const today = new Date().toISOString().split('T')[0];
    const currentDates = entry.played_dates || [];
    const updatedDates = [...currentDates, today].sort().reverse();

    try {
      await updateLibraryEntry(entryId, { played_dates: updatedDates });
      await loadLibrary();
      await refreshProfile();
    } catch (error) {
      console.error('Error adding play:', error);
    }
  };

  const toggleFilterValue = (category: keyof typeof filters, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[category] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [category]: newValues };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      publishers: [],
      gameTypes: [],
      gameCategories: [],
      rankings: [],
      minPlays: 0,
      maxPlays: Infinity,
      years: [],
      playerCounts: [],
    });
    setFilterFavorites(false);
    setFilterForSale(false);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterFavorites) count++;
    if (filterForSale) count++;
    count += filters.publishers.length;
    count += filters.gameTypes.length;
    count += filters.gameCategories.length;
    count += filters.rankings.length;
    count += filters.years.length;
    count += filters.playerCounts.length;
    if (filters.minPlays > 0) count++;
    if (filters.maxPlays !== Infinity) count++;
    return count;
  }, [filterFavorites, filterForSale, filters]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
              />
            </div>

            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center justify-center space-x-2 bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Add Game</span>
            </button>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-white text-slate-900 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFilterFavorites(!filterFavorites)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition ${
                  filterFavorites
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-900'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Star className="w-4 h-4" fill={filterFavorites ? 'currentColor' : 'none'} />
                <span className="text-sm font-medium">Favorites</span>
              </button>

              <button
                onClick={() => setFilterForSale(!filterForSale)}
                className={`px-4 py-2 rounded-lg border transition text-sm font-medium ${
                  filterForSale
                    ? 'bg-green-50 border-green-300 text-green-900'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                For Sale
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-slate-600 hover:text-slate-900 underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="date-added-desc">Recently Added</option>
                  <option value="date-added-asc">Oldest First</option>
                  <option value="plays-desc">Most Played</option>
                  <option value="plays-asc">Least Played</option>
                </select>
                <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="flex items-center space-x-1 border border-slate-300 rounded-lg p-1">
                <button
                  onClick={() => setLayout('grid')}
                  className={`p-2 rounded transition ${
                    layout === 'grid'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayout('list')}
                  className={`p-2 rounded transition ${
                    layout === 'list'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableFilters.publishers.length > 0 && (
                  <FilterSection
                    title="Publisher"
                    options={availableFilters.publishers}
                    selected={filters.publishers}
                    onToggle={(value) => toggleFilterValue('publishers', value)}
                  />
                )}

                {availableFilters.gameTypes.length > 0 && (
                  <FilterSection
                    title="Game Type"
                    options={availableFilters.gameTypes}
                    selected={filters.gameTypes}
                    onToggle={(value) => toggleFilterValue('gameTypes', value)}
                  />
                )}

                {availableFilters.gameCategories.length > 0 && (
                  <FilterSection
                    title="Category"
                    options={availableFilters.gameCategories}
                    selected={filters.gameCategories}
                    onToggle={(value) => toggleFilterValue('gameCategories', value)}
                  />
                )}

                {availableFilters.years.length > 0 && (
                  <FilterSection
                    title="Year"
                    options={availableFilters.years}
                    selected={filters.years}
                    onToggle={(value) => toggleFilterValue('years', value)}
                  />
                )}

                <FilterSection
                  title="Ranking"
                  options={['high', 'medium', 'low']}
                  selected={filters.rankings}
                  onToggle={(value) => toggleFilterValue('rankings', value)}
                />

                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-3">Number of Plays</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-slate-600">Minimum</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.minPlays}
                        onChange={(e) =>
                          setFilters({ ...filters, minPlays: parseInt(e.target.value) || 0 })
                        }
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Maximum</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.maxPlays === Infinity ? '' : filters.maxPlays}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            maxPlays: e.target.value ? parseInt(e.target.value) : Infinity,
                          })
                        }
                        placeholder="No limit"
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-3">Number of Players</h4>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <label key={count} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.playerCounts.includes(count)}
                          onChange={() => {
                            setFilters((prev) => ({
                              ...prev,
                              playerCounts: prev.playerCounts.includes(count)
                                ? prev.playerCounts.filter((c) => c !== count)
                                : [...prev.playerCounts, count],
                            }));
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900">
                          {count === 6 ? '6+' : count} {count === 1 ? 'player' : 'players'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          </div>
        ) : filteredLibrary.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {library.length === 0 ? 'No games yet' : 'No games match your filters'}
            </h3>
            <p className="text-slate-600 mb-6">
              {library.length === 0
                ? 'Start building your collection by scanning a barcode'
                : 'Try adjusting your search or filters'}
            </p>
            {library.length === 0 && (
              <button
                onClick={() => setShowSearchModal(true)}
                className="inline-flex items-center space-x-2 bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Game</span>
              </button>
            )}
          </div>
        ) : layout === 'list' ? (
          <div className="space-y-3">
            {filteredLibrary.map((entry) => (
              <GameCard
                key={entry.id}
                entry={entry}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteGame}
                onEdit={setEditingGame}
                onAddPlay={handleAddPlay}
                layout="list"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {filteredLibrary.map((entry) => (
              <GameCard
                key={entry.id}
                entry={entry}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteGame}
                onEdit={setEditingGame}
                layout="grid"
              />
            ))}
          </div>
        )}
      </main>

      {showSearchModal && user && (
        <SearchSharedGamesModal
          userId={user.id}
          onClose={() => setShowSearchModal(false)}
          onGameAdded={handleGameAdded}
          onAddNew={() => {
            setShowSearchModal(false);
            setShowScanner(true);
          }}
        />
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={handleScanBarcode}
          onClose={() => setShowScanner(false)}
        />
      )}

      {editingGame && (
        <EditGameModal
          entry={editingGame}
          onSave={handleSaveEdit}
          onClose={() => setEditingGame(null)}
        />
      )}
    </div>
  );
}

function FilterSection({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayOptions = showAll ? options : options.slice(0, 5);

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {displayOptions.map((option) => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
            />
            <span className="text-sm text-slate-700 group-hover:text-slate-900 capitalize">
              {option}
            </span>
          </label>
        ))}
        {options.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-slate-600 hover:text-slate-900 underline"
          >
            {showAll ? 'Show less' : `Show ${options.length - 5} more`}
          </button>
        )}
      </div>
    </div>
  );
}
