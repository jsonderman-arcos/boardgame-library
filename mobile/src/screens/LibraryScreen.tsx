import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserLibrary,
  updateLibraryEntry,
  removeGameFromLibrary,
  addGameToLibrary,
  createSharedGame,
  getGameByBarcode,
  lookupBarcode,
} from '../lib/games';
import { UserLibraryEntry, Game } from '../lib/supabase';
import GameCard from '../components/GameCard';
import BarcodeScanner from '../components/BarcodeScanner';

export default function LibraryScreen() {
  const { user } = useAuth();
  const [library, setLibrary] = useState<(UserLibraryEntry & { game: Game })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [processingBarcode, setProcessingBarcode] = useState(false);

  const loadLibrary = useCallback(async () => {
    if (!user) return;

    try {
      const data = await getUserLibrary(user.id);
      setLibrary(data);
    } catch (error) {
      console.error('Error loading library:', error);
      Alert.alert('Error', 'Failed to load library');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLibrary();
  };

  const handleToggleFavorite = async (entryId: string, isFavorite: boolean) => {
    try {
      await updateLibraryEntry(entryId, { is_favorite: isFavorite });
      setLibrary(prev =>
        prev.map(entry =>
          entry.id === entryId ? { ...entry, is_favorite: isFavorite } : entry
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const handleToggleForSale = async (entryId: string, forSale: boolean) => {
    try {
      await updateLibraryEntry(entryId, { for_sale: forSale });
      setLibrary(prev =>
        prev.map(entry =>
          entry.id === entryId ? { ...entry, for_sale: forSale } : entry
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update for sale status');
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await removeGameFromLibrary(entryId);
      setLibrary(prev => prev.filter(entry => entry.id !== entryId));
    } catch (error) {
      Alert.alert('Error', 'Failed to remove game');
    }
  };

  const handleEdit = (entry: UserLibraryEntry & { game: Game }) => {
    // TODO: Implement edit modal
    Alert.alert('Edit', 'Edit functionality coming soon');
  };

  const handleAddPlay = async (entryId: string) => {
    const entry = library.find(e => e.id === entryId);
    if (!entry) return;

    try {
      const newPlayDate = new Date().toISOString();
      const updatedPlayDates = [...(entry.played_dates || []), newPlayDate];
      await updateLibraryEntry(entryId, { played_dates: updatedPlayDates });

      setLibrary(prev =>
        prev.map(e =>
          e.id === entryId ? { ...e, played_dates: updatedPlayDates } : e
        )
      );

      Alert.alert('Success', 'Play logged!');
    } catch (error) {
      Alert.alert('Error', 'Failed to log play');
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    // Prevent multiple simultaneous scans
    if (processingBarcode) {
      console.log('Already processing a barcode, ignoring...');
      return;
    }

    setProcessingBarcode(true);
    setShowScanner(false);

    if (!user) {
      setProcessingBarcode(false);
      return;
    }

    try {
      console.log('Scanned barcode:', barcode);

      // Check if game exists in shared database
      let game = await getGameByBarcode(barcode);
      console.log('Game found in database:', !!game);

      if (!game) {
        // Look up barcode online
        console.log('Looking up barcode online...');
        const gameData = await lookupBarcode(barcode);
        console.log('Lookup result:', gameData);

        // Create new shared game
        game = await createSharedGame({
          barcode,
          name: gameData.name || 'Unknown Game',
          publisher: gameData.publisher,
          year: gameData.year,
          cover_image: gameData.cover_image,
        });
        console.log('Created shared game:', game);
      }

      // Check if game is already in user's library
      const alreadyInLibrary = library.some(entry => entry.game_id === game.id);
      if (alreadyInLibrary) {
        Alert.alert('Already in Library', `${game.name} is already in your library!`);
        setProcessingBarcode(false);
        return;
      }

      // Add to user's library
      await addGameToLibrary(user.id, game.id);

      // Refresh library
      await loadLibrary();

      Alert.alert('Success', `Added ${game.name} to your library!`);
    } catch (error) {
      console.error('Error adding game:', error);

      // Handle duplicate key error specifically
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        Alert.alert('Already in Library', 'This game is already in your library!');
        setProcessingBarcode(false);
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to add game to library';
      Alert.alert('Error', errorMessage);
    } finally {
      setProcessingBarcode(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e293b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Library</Text>
        <Text style={styles.subtitle}>{library.length} games</Text>
      </View>

      {library.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No games yet</Text>
          <Text style={styles.emptySubtext}>Tap + to add your first game</Text>
        </View>
      ) : (
        <FlatList
          data={library}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <GameCard
              entry={item}
              onToggleFavorite={handleToggleFavorite}
              onToggleForSale={handleToggleForSale}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onAddPlay={handleAddPlay}
            />
          )}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowScanner(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {showScanner && (
        <View style={styles.scannerModal}>
          <BarcodeScanner
            onScan={handleBarcodeScan}
            onClose={() => setShowScanner(false)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#94a3b8',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
  scannerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
