import React, { useState, useEffect } from 'react';
import { Camera, Plus, Search, X, Filter, SlidersHorizontal, Settings, LogOut } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { lookupBarcode } from './utils/barcode-lookup';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import {
  // New optimized architecture functions
  loadUserLibrary,
  saveGameToLibrary,
  updateGameInLibrary,
  deleteGameFromLibrary,
  bulkAddGamesToLibrary,
  migrateToOptimizedArchitecture,
  // Legacy functions (for backward compatibility)
  migrateToSupabase,
  loadGames,
  saveGames,
  saveGame,
  deleteGame as deleteGameFromDB,
  saveBarcodes,
  loadBarcodes,
  generateSyncKey,
  setSyncKey,
  clearSyncKey
} from './utils/storage';
import { BarcodeScanner } from './components/barcode-scanner';
import { GameData, GameForm } from './components/game-form';
import { GameCard } from './components/game-card';
import { GameDetail } from './components/game-detail';
import { EmptyState } from './components/empty-state';
import { LoadingScreen } from './components/loading-screen';
import { FilterSort } from './components/filter-sort';
import { AuthScreen } from './components/auth-screen';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';

type Screen =
  | 'library'
  | 'scanner'
  | 'loading'
  | 'confirmation'
  | 'detail'
  | 'edit'
  | 'manual'
  | 'research'
  | 'debug'
  | 'settings';

interface AppState {
  screen: Screen;
  games: GameData[];
  currentGame: GameData | null;
  scannedBarcode: string | null;
  searchQuery: string;
  debugLogs: string[];
  showFilters: boolean;
  sortBy: 'name' | 'year' | 'publisher' | 'recent';
  filters: {
    types: string[];
    categories: string[];
    mechanisms: string[];
    families: string[];
  };
  databaseViewer: {
    isLoading: boolean;
    games: GameData[] | null;
    barcodes: Record<string, any> | null;
    error: string | null;
  };
}

export default function App() {
  const [state, setState] = useState<AppState>({
    screen: 'library',
    games: [],
    currentGame: null,
    scannedBarcode: null,
    searchQuery: '',
    debugLogs: [],
    showFilters: false,
    sortBy: 'name',
    filters: {
      types: [],
      categories: [],
      mechanisms: [],
      families: [],
    },
    databaseViewer: {
      isLoading: false,
      games: null,
      barcodes: null,
      error: null,
    },
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check for existing session on mount
  useEffect(() => {
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      try {
        const session = JSON.parse(userSession);
        if (session.user && session.session) {
          setIsAuthenticated(true);
          setCurrentUser(session.user);
          console.log('🔐 User session restored:', session.user.email);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('userSession');
      }
    }
  }, []);

  // Load games from Supabase on mount (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const initApp = async () => {
      try {
        // Check if user has migrated to optimized architecture
        const hasMigrated = localStorage.getItem('migratedToOptimized_' + (currentUser?.id || '')) === 'true';
        
        let games;
        if (hasMigrated) {
          // Use new optimized architecture
          console.log('📊 Attempting to load from optimized architecture...');
          games = await loadUserLibrary();
          
          // If we got here with an empty array and had the migration flag set,
          // it might mean tables don't exist - check and reload
          if (games.length === 0) {
            const stillHasMigrationFlag = localStorage.getItem('migratedToOptimized_' + (currentUser?.id || '')) === 'true';
            if (!stillHasMigrationFlag) {
              // Flag was cleared by loadUserLibrary, reload from legacy
              console.log('🔄 Migration flag was cleared, reloading from legacy...');
              await migrateToSupabase();
              games = await loadGames();
            }
          }
        } else {
          // Use legacy architecture
          console.log('📦 Loading from legacy architecture (kv_store)');
          await migrateToSupabase();
          games = await loadGames();
        }
        
        // Filter out null/invalid games before setting state
        const validGames = games.filter(game => game && game.id);
        console.log(`🎮 Setting state with ${validGames.length} valid games`);
        
        setState((prev) => ({ ...prev, games: validGames }));
      } catch (error) {
        console.error('Failed to initialize app:', error);
        toast.error('Failed to load your library');
      }
    };
    
    initApp();
  }, [isAuthenticated, currentUser?.id]);

  // Save games to Supabase whenever they change (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (state.games.length > 0) {
      saveGames(state.games);
    }
  }, [state.games, isAuthenticated]);

  // Handle successful authentication
  const handleAuthSuccess = async (user: any, session: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    toast.success(`Welcome, ${user.username || user.email}!`);
    
    // Load user's data
    try {
      // Check if user has migrated to optimized architecture
      const hasMigrated = localStorage.getItem('migratedToOptimized_' + user.id) === 'true';
      
      let games;
      if (hasMigrated) {
        console.log('📊 Loading from optimized architecture on auth');
        games = await loadUserLibrary();
      } else {
        console.log('📦 Loading from legacy architecture on auth');
        await migrateToSupabase();
        games = await loadGames();
      }
      
      setState((prev) => ({ ...prev, games }));
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load your library');
    }
  };

  // Handle logout
  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('userSession');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setState({
        screen: 'library',
        games: [],
        currentGame: null,
        scannedBarcode: null,
        searchQuery: '',
        debugLogs: [],
        showFilters: false,
        sortBy: 'name',
        filters: {
          types: [],
          categories: [],
          mechanisms: [],
          families: [],
        },
        databaseViewer: {
          isLoading: false,
          games: null,
          barcodes: null,
          error: null,
        },
      });
      toast.success('Logged out successfully');
    }
  };

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const handleBarcodeDetected = async (barcode: string) => {
    console.log('📷 Barcode detected:', barcode);
    console.log('📷 Setting screen to loading...');

    setState((prev) => ({ ...prev, screen: 'loading' }));

    const gameData = await lookupBarcode(barcode);
    
    console.log('📷 Barcode lookup result:', gameData);

    if (gameData) {
      // Show the game data directly without BGG enrichment
      setState((prev) => ({
        ...prev,
        screen: 'confirmation',
        currentGame: gameData,
      }));
      toast.success(`Found: ${gameData.name || 'Product'}`);
    } else {
      setState((prev) => ({
        ...prev,
        screen: 'manual',
        currentGame: {
          name: '',
          publisher: '',
          barcode,
        },
        scannedBarcode: barcode,
      }));
      toast.error(
        <div className="flex flex-col gap-2">
          <p className="font-medium">Barcode not found: {barcode}</p>
          <p className="text-sm opacity-80">Enter the game details manually</p>
        </div>,
        {
          duration: 6000,
        }
      );
    }
  };

  const addGame = async (gameData: GameData) => {
    // Check for duplicates
    const duplicates = state.games.filter((game) => {
      const nameMatch = game.name.toLowerCase().trim() === gameData.name.toLowerCase().trim();
      const barcodeMatch = gameData.barcode && game.barcode === gameData.barcode;
      return nameMatch || barcodeMatch;
    });

    if (duplicates.length > 0) {
      const duplicateReasons = duplicates.map((game) => {
        const reasons = [];
        if (game.name.toLowerCase().trim() === gameData.name.toLowerCase().trim()) {
          reasons.push('same name');
        }
        if (gameData.barcode && game.barcode === gameData.barcode) {
          reasons.push('same barcode');
        }
        return `\"${game.name}\" (${reasons.join(', ')})`;
      });

      const confirmMessage = `Possible duplicate detected!\n\nThis game might already be in your library:\n${duplicateReasons.join('\n')}\n\nDo you want to add it anyway?`;
      
      if (!confirm(confirmMessage)) {
        toast.info('Game not added');
        return;
      }
    }

    const newGame = {
      ...gameData,
      id: Date.now().toString(),
    };

    // If this game has a barcode, save it to the cloud barcode database
    if (gameData.barcode) {
      const userBarcodes = localStorage.getItem('userBarcodes');
      const barcodeDb = userBarcodes ? JSON.parse(userBarcodes) : {};
      
      // Save the barcode mapping (without the id, since that's specific to library entries)
      barcodeDb[gameData.barcode] = {
        name: gameData.name,
        publisher: gameData.publisher,
        year: gameData.year,
        edition: gameData.edition,
        coverImage: gameData.coverImage,
        barcode: gameData.barcode,
      };
      
      // Save to both localStorage and Supabase
      localStorage.setItem('userBarcodes', JSON.stringify(barcodeDb));
      await saveBarcodes(barcodeDb);
      console.log(`Saved barcode ${gameData.barcode} to cloud database for future lookups`);
    }

    // Update state with new game
    const updatedGames = [...state.games, newGame];

    // Save individual game to Supabase
    await saveGame(newGame);
    
    // Also update localStorage
    localStorage.setItem('boardgames', JSON.stringify(updatedGames));

    setState((prev) => ({
      ...prev,
      games: updatedGames,
      screen: 'library',
      currentGame: null,
      scannedBarcode: null,
    }));

    toast.success('Game added to library!');
  };

  const updateGame = async (gameData: GameData) => {
    const updatedGames = state.games.map((g) =>
      g.id === state.currentGame?.id ? { ...gameData, id: g.id } : g
    );

    // Save to Supabase immediately
    await saveGames(updatedGames);

    setState((prev) => ({
      ...prev,
      games: updatedGames,
      screen: 'detail',
      currentGame: { ...gameData, id: prev.currentGame?.id },
    }));

    toast.success('Game updated!');
  };

  const deleteGame = async () => {
    if (!state.currentGame?.id) return;

    if (confirm('Are you sure you want to delete this game?')) {
      const gameId = state.currentGame.id;
      
      // Delete from Supabase
      await deleteGameFromDB(gameId);
      
      // Update state
      const updatedGames = state.games.filter((g) => g.id !== gameId);
      
      // Update localStorage
      localStorage.setItem('boardgames', JSON.stringify(updatedGames));
      
      setState((prev) => ({
        ...prev,
        games: updatedGames,
        screen: 'library',
        currentGame: null,
      }));

      toast.success('Game deleted');
    }
  };

  const handleToggleFavorite = (gameId: string) => {
    setState((prev) => ({
      ...prev,
      games: prev.games.map((g) =>
        g.id === gameId ? { ...g, isFavorite: !g.isFavorite } : g
      ),
    }));
  };

  const handleToggleForSale = (gameId: string) => {
    setState((prev) => ({
      ...prev,
      games: prev.games.map((g) =>
        g.id === gameId ? { ...g, forSale: !g.forSale } : g
      ),
    }));
  };

  const handleSetRanking = (gameId: string, ranking: 'high' | 'medium' | 'low' | null) => {
    setState((prev) => ({
      ...prev,
      games: prev.games.map((g) =>
        g.id === gameId ? { ...g, personalRanking: ranking } : g
      ),
    }));
    
    if (ranking) {
      toast.success(`Ranking set to ${ranking}`);
    } else {
      toast.success('Ranking cleared');
    }
  };

  const handleMarkPlayed = (gameId: string) => {
    const today = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      games: prev.games.map((g) =>
        g.id === gameId 
          ? { ...g, playedDates: [...(g.playedDates || []), today] } 
          : g
      ),
    }));
    toast.success('Marked as played today!');
  };

  const handleUpdateGameDetails = (updatedGame: GameData) => {
    setState((prev) => ({
      ...prev,
      games: prev.games.map((g) =>
        g.id === updatedGame.id ? updatedGame : g
      ),
      currentGame: updatedGame,
    }));
  };

  // Get all unique classification values from all games
  const getAllClassifications = () => {
    const types = new Set<string>();
    const categories = new Set<string>();
    const mechanisms = new Set<string>();
    const families = new Set<string>();

    state.games.forEach((game) => {
      // Skip null/undefined games
      if (!game) return;
      
      game.gameType?.forEach((t) => types.add(t));
      game.gameCategory?.forEach((c) => categories.add(c));
      game.gameMechanism?.forEach((m) => mechanisms.add(m));
      game.gameFamily?.forEach((f) => families.add(f));
    });

    return {
      types: Array.from(types).sort(),
      categories: Array.from(categories).sort(),
      mechanisms: Array.from(mechanisms).sort(),
      families: Array.from(families).sort(),
    };
  };

  const allClassifications = getAllClassifications();

  // Toggle filter selection
  const toggleFilter = (category: 'types' | 'categories' | 'mechanisms' | 'families', value: string) => {
    setState((prev) => {
      const currentFilters = prev.filters[category];
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter((v) => v !== value)
        : [...currentFilters, value];
      
      return {
        ...prev,
        filters: {
          ...prev.filters,
          [category]: newFilters,
        },
      };
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setState((prev) => ({
      ...prev,
      filters: {
        types: [],
        categories: [],
        mechanisms: [],
        families: [],
      },
    }));
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      state.filters.types.length > 0 ||
      state.filters.categories.length > 0 ||
      state.filters.mechanisms.length > 0 ||
      state.filters.families.length > 0
    );
  };

  // Filter and sort games
  const filteredGames = state.games
    .filter((game) => {
      // Skip null/undefined games
      if (!game) return false;
      
      // Search filter
      const matchesSearch =
        game.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        game.publisher.toLowerCase().includes(state.searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Classification filters
      if (state.filters.types.length > 0) {
        const hasMatchingType = game.gameType?.some((t) => state.filters.types.includes(t));
        if (!hasMatchingType) return false;
      }

      if (state.filters.categories.length > 0) {
        const hasMatchingCategory = game.gameCategory?.some((c) => state.filters.categories.includes(c));
        if (!hasMatchingCategory) return false;
      }

      if (state.filters.mechanisms.length > 0) {
        const hasMatchingMechanism = game.gameMechanism?.some((m) => state.filters.mechanisms.includes(m));
        if (!hasMatchingMechanism) return false;
      }

      if (state.filters.families.length > 0) {
        const hasMatchingFamily = game.gameFamily?.some((f) => state.filters.families.includes(f));
        if (!hasMatchingFamily) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (state.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'year':
          const yearA = a.year ? parseInt(a.year) : 0;
          const yearB = b.year ? parseInt(b.year) : 0;
          return yearB - yearA; // Newest first
        case 'publisher':
          return a.publisher.localeCompare(b.publisher);
        case 'recent':
          // Sort by ID (which is timestamp-based)
          return (b.id || '0').localeCompare(a.id || '0');
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />
      
      {state.screen === 'scanner' && (
        <BarcodeScanner
          onScan={handleBarcodeDetected}
          onClose={() => setState((prev) => ({ ...prev, screen: 'library' }))}
          onManualEntry={() => setState((prev) => ({ ...prev, screen: 'manual' }))}
        />
      )}

      {state.screen === 'library' && (
        <>
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="m-0">Board Game Library</h1>
                <div className="flex gap-2">
                  <button
                    onClick={() => setState((prev) => ({ ...prev, screen: 'settings' }))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Settings"
                  >
                    <Settings className="h-5 w-5 text-gray-600" />
                  </button>
                  <Button
                    onClick={() =>
                      setState((prev) => ({ ...prev, screen: 'scanner' }))
                    }
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Game
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search games..."
                  value={state.searchQuery}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      searchQuery: e.target.value,
                    }))
                  }
                  className="pl-10 h-12"
                />
                {state.searchQuery && (
                  <button
                    onClick={() =>
                      setState((prev) => ({ ...prev, searchQuery: '' }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter/Sort section - only show when there are games */}
            {state.games.length > 0 && (
              <div className="px-4 pb-4">
                <FilterSort
                  showFilters={state.showFilters}
                  onToggleFilters={() =>
                    setState((prev) => ({ ...prev, showFilters: !prev.showFilters }))
                  }
                  sortBy={state.sortBy}
                  onSortChange={(sortBy) => setState((prev) => ({ ...prev, sortBy }))}
                  filters={state.filters}
                  availableFilters={allClassifications}
                  onToggleFilter={toggleFilter}
                  onClearFilters={clearAllFilters}
                  hasActiveFilters={hasActiveFilters()}
                  totalGames={state.games.length}
                  filteredCount={filteredGames.length}
                />
              </div>
            )}
          </div>

          <div className="p-4">
            {filteredGames.length === 0 ? (
              state.searchQuery ? (
                <EmptyState
                  title="No games found"
                  description={`No games match "${state.searchQuery}"`}
                  actionLabel="Clear Search"
                  onAction={() =>
                    setState((prev) => ({ ...prev, searchQuery: '' }))
                  }
                />
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm">
                    <p className="text-blue-900 font-medium mb-1">
                      📱 How it works
                    </p>
                    <p className="text-blue-800 text-xs leading-relaxed">
                      Scan a barcode → Get product info from your barcode database. \n                      Add game details manually to build your personalized library!
                    </p>
                  </div>
                  <EmptyState
                    title="No games yet"
                    description="Scan a barcode or add a game manually to get started"
                    actionLabel="Scan Barcode"
                    onAction={() =>
                      setState((prev) => ({ ...prev, screen: 'scanner' }))
                    }
                  />
                </>
              )
            ) : (
              <div className="space-y-3">
                {filteredGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        screen: 'detail',
                        currentGame: game,
                      }))
                    }
                    onEdit={() =>
                      setState((prev) => ({
                        ...prev,
                        screen: 'edit',
                        currentGame: game,
                      }))
                    }
                    onDelete={() => {
                      if (confirm('Are you sure you want to delete this game?')) {
                        setState((prev) => ({
                          ...prev,
                          games: prev.games.filter((g) => g.id !== game.id),
                        }));
                        toast.success('Game deleted');
                      }
                    }}
                    onToggleFavorite={() => handleToggleFavorite(game.id!)}
                    onToggleForSale={() => handleToggleForSale(game.id!)}
                    onSetRanking={(ranking) => handleSetRanking(game.id!, ranking)}
                    onMarkPlayed={() => handleMarkPlayed(game.id!)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {state.screen === 'loading' && (
        <div className="min-h-screen flex flex-col">
          <div className="bg-white border-b border-gray-200 p-4">
            <h1>Scanning Barcode</h1>
          </div>
          <LoadingScreen message="Looking up game details" />
        </div>
      )}

      {state.screen === 'confirmation' && state.currentGame && (
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b border-gray-200 p-4">
            <h1>Confirm Game Details</h1>
          </div>
          <div className="p-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                ✅ Game found! Review and confirm the details below.
              </p>
            </div>
            <GameForm
              initialData={state.currentGame}
              onSubmit={addGame}
              onCancel={() =>
                setState((prev) => ({
                  ...prev,
                  screen: 'library',
                  currentGame: null,
                }))
              }
              submitLabel="Add to Library"
              onRefreshData={async (barcode: string) => {
                try {
                  toast.info('Fetching updated data...');
                  const newData = await lookupBarcode(barcode);
                  if (newData) {
                    toast.success('Data fetched! Review changes below.');
                    return newData;
                  } else {
                    toast.error('No data found for this barcode.');
                    return null;
                  }
                } catch (error) {
                  console.error('Error refreshing data:', error);
                  toast.error('Failed to refresh data.');
                  return null;
                }
              }}
            />
          </div>
        </div>
      )}

      {state.screen === 'manual' && (
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b border-gray-200 p-4">
            <h1>Add Game Manually</h1>
          </div>
          <div className="p-4">
            {state.scannedBarcode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm mb-2">
                  <span className="font-medium">No match found for barcode: </span>
                  <span className="font-mono">{state.scannedBarcode}</span>
                </p>
                <p className="text-yellow-700 text-xs mb-3">
                  💡 Look up this barcode at{' '}
                  <a 
                    href={`https://www.barcodelookup.com/${state.scannedBarcode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    barcodelookup.com
                  </a>
                  {' '}to find the game details, then enter them below. They'll be saved for future scans!
                </p>
              </div>
            )}
            
            <GameForm
              initialData={state.currentGame || undefined}
              onSubmit={addGame}
              onCancel={() =>
                setState((prev) => ({
                  ...prev,
                  screen: 'library',
                  currentGame: null,
                  scannedBarcode: null,
                }))
              }
              submitLabel="Add to Library"
            />
          </div>
        </div>
      )}

      {state.screen === 'detail' && state.currentGame && (
        <GameDetail
          game={state.currentGame}
          onBack={() =>
            setState((prev) => ({ ...prev, screen: 'library', currentGame: null }))
          }
          onEdit={() => setState((prev) => ({ ...prev, screen: 'edit' }))}
          onDelete={deleteGame}
          onUpdate={handleUpdateGameDetails}
        />
      )}

      {state.screen === 'edit' && state.currentGame && (
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b border-gray-200 p-4">
            <h1>Edit Game</h1>
          </div>
          <div className="p-4">
            <GameForm
              initialData={state.currentGame}
              onSubmit={updateGame}
              onCancel={() => setState((prev) => ({ ...prev, screen: 'detail' }))}
              submitLabel="Save Changes"
              onRefreshData={async (barcode: string) => {
                try {
                  toast.info('Fetching updated data...');
                  const newData = await lookupBarcode(barcode);
                  if (newData) {
                    toast.success('Data fetched! Review changes below.');
                    return newData;
                  } else {
                    toast.error('No data found for this barcode.');
                    return null;
                  }
                } catch (error) {
                  console.error('Error refreshing data:', error);
                  toast.error('Failed to refresh data.');
                  return null;
                }
              }}
            />
          </div>
        </div>
      )}

      {state.screen === 'research' && (
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b border-gray-200 p-4">
            <h1>Research Game Details</h1>
          </div>
          <div className="p-4">
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-gray-800">Debug logs for the last BGG API test:</p>
              <pre className="text-sm text-gray-600 mt-2">
                {state.debugLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </pre>
            </div>
            {state.currentGame && (
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-gray-800">Game data retrieved:</p>
                <pre className="text-sm text-gray-600 mt-2">
                  {JSON.stringify(state.currentGame, null, 2)}
                </pre>
              </div>
            )}
            <Button
              onClick={() => setState((prev) => ({ ...prev, screen: 'library' }))}
              className="w-full h-10 gap-2 mt-3 text-xs"
            >
              Back to Library
            </Button>
          </div>
        </div>
      )}

      {state.screen === 'settings' && (
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b border-gray-200 p-4">
            <h1>Settings</h1>
          </div>
          <div className="p-4 space-y-4">
            {/* Account Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-3">👤 Account</h2>
              
              {/* Editable Profile Form */}
              <div className="space-y-4 mb-4">
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    defaultValue={currentUser?.username || ''}
                    placeholder="Enter your username"
                    className="w-full"
                    onBlur={async (e) => {
                      const newUsername = e.target.value.trim();
                      if (!newUsername) {
                        toast.error('Username cannot be empty');
                        e.target.value = currentUser?.username || '';
                        return;
                      }
                      
                      if (newUsername === currentUser?.username) {
                        return; // No change
                      }
                      
                      try {
                        const response = await fetch(
                          `https://${projectId}.supabase.co/functions/v1/make-server-6e36f0d2/profile/${currentUser?.id}`,
                          {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${publicAnonKey}`,
                            },
                            body: JSON.stringify({ username: newUsername }),
                          }
                        );
                        
                        if (response.ok) {
                          // Update local state
                          setState((prev) => ({
                            ...prev,
                            currentUser: prev.currentUser ? { ...prev.currentUser, username: newUsername } : null,
                          }));
                          
                          // Update localStorage session
                          const userSession = localStorage.getItem('userSession');
                          if (userSession) {
                            const session = JSON.parse(userSession);
                            session.user.username = newUsername;
                            localStorage.setItem('userSession', JSON.stringify(session));
                          }
                          setCurrentUser((prev: any) => prev ? { ...prev, username: newUsername } : null);
                          
                          toast.success('✅ Username updated!');
                        } else {
                          const data = await response.json();
                          toast.error(data.error || 'Failed to update username');
                          e.target.value = currentUser?.username || '';
                        }
                      } catch (error) {
                        console.error('Error updating username:', error);
                        toast.error('Failed to update username');
                        e.target.value = currentUser?.username || '';
                      }
                    }}
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={currentUser?.email || ''}
                    placeholder="Enter your email"
                    className="w-full"
                    onBlur={async (e) => {
                      const newEmail = e.target.value.trim();
                      
                      // Validate email format
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!newEmail) {
                        toast.error('Email cannot be empty');
                        e.target.value = currentUser?.email || '';
                        return;
                      }
                      
                      if (!emailRegex.test(newEmail)) {
                        toast.error('Please enter a valid email address');
                        e.target.value = currentUser?.email || '';
                        return;
                      }
                      
                      if (newEmail === currentUser?.email) {
                        return; // No change
                      }
                      
                      try {
                        const response = await fetch(
                          `https://${projectId}.supabase.co/functions/v1/make-server-6e36f0d2/profile/${currentUser?.id}`,
                          {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${publicAnonKey}`,
                            },
                            body: JSON.stringify({ email: newEmail }),
                          }
                        );
                        
                        if (response.ok) {
                          // Update local state
                          setState((prev) => ({
                            ...prev,
                            currentUser: prev.currentUser ? { ...prev.currentUser, email: newEmail } : null,
                          }));
                          
                          // Update localStorage session
                          const userSession = localStorage.getItem('userSession');
                          if (userSession) {
                            const session = JSON.parse(userSession);
                            session.user.email = newEmail;
                            localStorage.setItem('userSession', JSON.stringify(session));
                          }
                          setCurrentUser((prev: any) => prev ? { ...prev, email: newEmail } : null);
                          
                          toast.success('✅ Email updated!');
                        } else {
                          const data = await response.json();
                          toast.error(data.error || 'Failed to update email');
                          e.target.value = currentUser?.email || '';
                        }
                      } catch (error) {
                        console.error('Error updating email:', error);
                        toast.error('Failed to update email');
                        e.target.value = currentUser?.email || '';
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Changes are saved automatically when you click outside the field
                  </p>
                </div>
              </div>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full gap-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </div>

            {/* Database Optimization Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-3">⚡ Database Optimization</h2>
              
              {localStorage.getItem('migratedToOptimized_' + (currentUser?.id || '')) === 'true' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-900 text-sm">
                    ✅ <strong>Already Optimized!</strong>
                  </p>
                  <p className="text-green-800 text-xs mt-1">
                    You're using the new high-speed architecture with shared game database.
                  </p>
                </div>
              ) : (
                <>
                  {/* Step 1: Setup Database Tables */}
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                    <p className="text-yellow-900 text-sm font-bold mb-2">
                      📋 Step 1: Setup Database Tables
                    </p>
                    <p className="text-yellow-800 text-xs mb-3">
                      Before migrating, you need to create the database tables. Copy the SQL below and run it in your Supabase SQL Editor.
                    </p>
                    
                    <div className="bg-white rounded border border-yellow-300 p-3 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-700">SQL Migration Script:</p>
                        <button
                          onClick={() => {
                            const sql = `-- Drop old triggers and functions first (clean slate)
DROP TRIGGER IF EXISTS update_boardgames_timestamp ON boardgames;
DROP FUNCTION IF EXISTS update_boardgames_updated_at();

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default studio profile
INSERT INTO profiles (id, email, username, password_hash)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::UUID,
  'studio@blue148.com',
  'studio',
  '$2a$10$defaulthashfordemopurposes' -- Placeholder hash, update via app settings
)
ON CONFLICT (email) DO NOTHING;

-- Sync existing Supabase Auth users to profiles table
-- This will automatically add any existing authenticated users (like sonderman)
INSERT INTO profiles (id, email, username, password_hash)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)) as username,
  '$2a$10$syncedfromsupabaseauth' as password_hash
FROM auth.users
ON CONFLICT (email) DO UPDATE SET
  username = COALESCE(EXCLUDED.username, profiles.username),
  id = EXCLUDED.id;

-- Add new columns to existing boardgames table (keep existing 'value' column)
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS publisher TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS edition TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS game_type TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS game_category TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS game_mechanism TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS game_family TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS for_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS personal_ranking TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS played_dates TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_boardgames_user_id ON boardgames(user_id);
CREATE INDEX IF NOT EXISTS idx_boardgames_barcode ON boardgames(barcode);
CREATE INDEX IF NOT EXISTS idx_boardgames_name ON boardgames(name);
CREATE INDEX IF NOT EXISTS idx_boardgames_user_barcode ON boardgames(user_id, barcode);

-- Trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_boardgames_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_boardgames_timestamp
  BEFORE UPDATE ON boardgames
  FOR EACH ROW
  EXECUTE FUNCTION update_boardgames_updated_at();`;
                            
                            // Try clipboard API first, fallback to textarea selection
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              navigator.clipboard.writeText(sql)
                                .then(() => toast.success('✅ SQL copied to clipboard!'))
                                .catch(() => {
                                  // Fallback to textarea method
                                  const textarea = document.createElement('textarea');
                                  textarea.value = sql;
                                  textarea.style.position = 'fixed';
                                  textarea.style.opacity = '0';
                                  document.body.appendChild(textarea);
                                  textarea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textarea);
                                  toast.success('✅ SQL copied to clipboard!');
                                });
                            } else {
                              // Direct fallback to textarea method
                              const textarea = document.createElement('textarea');
                              textarea.value = sql;
                              textarea.style.position = 'fixed';
                              textarea.style.opacity = '0';
                              document.body.appendChild(textarea);
                              textarea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textarea);
                              toast.success('✅ SQL copied to clipboard!');
                            }
                          }}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                        >
                          📋 Copy SQL
                        </button>
                      </div>
                      <textarea
                        readOnly
                        className="w-full h-32 text-xs font-mono bg-gray-50 border border-gray-300 rounded p-2 resize-none"
                        value={`-- Drop old triggers and functions first (clean slate)
DROP TRIGGER IF EXISTS update_boardgames_timestamp ON boardgames;
DROP FUNCTION IF EXISTS update_boardgames_updated_at();

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default studio profile
INSERT INTO profiles (id, email, username, password_hash)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::UUID,
  'studio@blue148.com',
  'studio',
  '$2a$10$defaulthashfordemopurposes' -- Placeholder hash, update via app settings
)
ON CONFLICT (email) DO NOTHING;

-- Sync existing Supabase Auth users to profiles table
-- This will automatically add any existing authenticated users (like sonderman)
INSERT INTO profiles (id, email, username, password_hash)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)) as username,
  '$2a$10$syncedfromsupabaseauth' as password_hash
FROM auth.users
ON CONFLICT (email) DO UPDATE SET
  username = COALESCE(EXCLUDED.username, profiles.username),
  id = EXCLUDED.id;

-- Add new columns to existing boardgames table (keep existing 'value' column)
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS publisher TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS edition TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS game_type TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS game_category TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS game_mechanism TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS game_family TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS for_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS personal_ranking TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS played_dates TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_boardgames_user_id ON boardgames(user_id);
CREATE INDEX IF NOT EXISTS idx_boardgames_barcode ON boardgames(barcode);
CREATE INDEX IF NOT EXISTS idx_boardgames_name ON boardgames(name);
CREATE INDEX IF NOT EXISTS idx_boardgames_user_barcode ON boardgames(user_id, barcode);

-- Trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_boardgames_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_boardgames_timestamp
  BEFORE UPDATE ON boardgames
  FOR EACH ROW
  EXECUTE FUNCTION update_boardgames_updated_at();

👆 Click "Copy SQL" button above to copy the full script`}
                      />
                    </div>
                    
                    <ol className="text-xs text-yellow-800 space-y-1 ml-4 list-decimal">
                      <li>Click "📋 Copy SQL" button above</li>
                      <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">Supabase Dashboard</a></li>
                      <li>Navigate to: Your Project → SQL Editor</li>
                      <li>Click "New Query" and paste the SQL</li>
                      <li>Click "Run" to create the tables</li>
                      <li>Come back here and click "Migrate Now" below</li>
                    </ol>
                  </div>

                  {/* Step 2: Migrate Data */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <p className="text-purple-900 text-sm font-bold mb-2">
                      🚀 Step 2: Migrate Your {state.games.length} Games
                    </p>
                    <p className="text-purple-800 text-xs mb-2">
                      After setting up the tables, click below to migrate your library to the optimized architecture.
                    </p>
                    <ul className="text-xs text-purple-700 space-y-1 ml-4 list-disc">
                      <li>10-20x faster loading times</li>
                      <li>Shared games benefit all users</li>
                      <li>Your personal settings remain private</li>
                    </ul>
                  </div>

                  <Button
                    onClick={async () => {
                      try {
                        toast.info('🔄 Migrating to optimized architecture...');
                        
                        const result = await migrateToOptimizedArchitecture();
                        
                        if (result.success) {
                          if (result.migrated > 0) {
                            toast.success(`✅ Migrated ${result.migrated} games! Loading optimized library...`);
                            
                            // Load from new architecture
                            const games = await loadUserLibrary();
                            setState((prev) => ({ ...prev, games }));
                          } else {
                            toast.info('✅ Already using optimized architecture!');
                          }
                        } else {
                          // Show detailed error with instructions
                          if (result.message.includes('relation') || result.message.includes('table')) {
                            toast.error(
                              <div>
                                <p className="font-bold">❌ Database tables not set up</p>
                                <p className="text-sm mt-1">Please complete Step 1 above first - run the SQL in your Supabase dashboard.</p>
                              </div>,
                              { duration: 8000 }
                            );
                          } else {
                            toast.error(`❌ Migration failed: ${result.message}`);
                          }
                        }
                      } catch (error) {
                        console.error('Migration failed:', error);
                        toast.error('Migration failed. Check console for details.');
                      }
                    }}
                    className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Settings className="h-4 w-4" />
                    Migrate Now
                  </Button>
                  
                  <p className="text-xs text-gray-600 mt-2">
                    This is a one-time migration to upgrade your library to the new architecture.
                  </p>
                </>
              )}
            </div>

            {/* Back Button */}
            <Button
              onClick={() => setState((prev) => ({ ...prev, screen: 'library' }))}
              variant="outline"
              className="w-full"
            >
              Back to Library
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}