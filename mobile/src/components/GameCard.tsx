import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { UserLibraryEntry, Game } from '../lib/supabase';

interface GameCardProps {
  entry: UserLibraryEntry & { game: Game };
  onToggleFavorite: (entryId: string, isFavorite: boolean) => void;
  onToggleForSale?: (entryId: string, forSale: boolean) => void;
  onDelete: (entryId: string) => void;
  onEdit: (entry: UserLibraryEntry & { game: Game }) => void;
  onAddPlay?: (entryId: string) => void;
}

export default function GameCard({
  entry,
  onToggleFavorite,
  onToggleForSale,
  onDelete,
  onEdit,
  onAddPlay,
}: GameCardProps) {
  const { game } = entry;
  const playCount = entry.played_dates?.length || 0;
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Remove Game',
      `Remove ${game.name} from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onDelete(entry.id),
        },
      ]
    );
  };

  const playerText = () => {
    if (game.min_players === game.max_players) {
      return `${game.min_players} player${game.min_players > 1 ? 's' : ''}`;
    }
    return `${game.min_players || '?'}-${game.max_players || '?'} players`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {game.cover_image ? (
          <Image source={{ uri: game.cover_image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>📚</Text>
          </View>
        )}
        {entry.for_sale && (
          <View style={styles.forSaleBadge}>
            <Text style={styles.forSaleBadgeText}>$</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {game.name}
          </Text>
          {game.is_expansion && (
            <View style={styles.expansionBadge}>
              <Text style={styles.expansionBadgeText}>EXP</Text>
            </View>
          )}
        </View>

        {(game.min_players || game.max_players) && (
          <Text style={styles.info}>{playerText()}</Text>
        )}

        {game.playtime_minutes && (
          <Text style={styles.info}>{game.playtime_minutes} min</Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, entry.is_favorite && styles.favoriteButton]}
            onPress={() => onToggleFavorite(entry.id, !entry.is_favorite)}
          >
            <Text style={styles.actionIcon}>{entry.is_favorite ? '★' : '☆'}</Text>
          </TouchableOpacity>

          {onAddPlay && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => onAddPlay(entry.id)}
            >
              <Text style={styles.playButtonText}>+ {playCount}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(entry)}
          >
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDelete}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f1f5f9',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  forSaleBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 6,
  },
  forSaleBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 18,
  },
  expansionBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  expansionBadgeText: {
    color: '#1e40af',
    fontSize: 10,
    fontWeight: '600',
  },
  info: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  favoriteButton: {
    backgroundColor: '#fbbf24',
  },
  actionIcon: {
    fontSize: 16,
  },
  playButton: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  playButtonText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
  },
});
