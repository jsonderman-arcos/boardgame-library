import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, X, Save } from 'lucide-react';
import { supabase, Game } from '../lib/supabase';

export default function AdminPanel() {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredGames(
        games.filter(
          (game) =>
            game.name.toLowerCase().includes(query) ||
            game.barcode.includes(query) ||
            game.publisher?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredGames(games);
    }
  }, [searchQuery, games]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shared_games')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setGames(data || []);
      setFilteredGames(data || []);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game? This will remove it from all user libraries.')) {
      return;
    }

    try {
      const { error } = await supabase.from('shared_games').delete().eq('id', gameId);

      if (error) throw error;
      await loadGames();
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Failed to delete game');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-slate-600 mt-1">Manage shared games database</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Game</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, barcode, or publisher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        <div className="mt-4 text-sm text-slate-600">
          Showing {filteredGames.length} of {games.length} games
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-600">
            {searchQuery ? 'No games found matching your search.' : 'No games in database.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Game
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Barcode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Publisher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredGames.map((game) => (
                  <tr key={game.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {game.cover_image ? (
                          <img
                            src={game.cover_image}
                            alt={game.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center">
                            <span className="text-slate-400 text-xs">No img</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{game.name}</div>
                          {game.edition && (
                            <div className="text-xs text-slate-500">{game.edition}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{game.barcode}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {game.publisher || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{game.year || '-'}</div>
                      {game.is_expansion && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Expansion
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingGame(game)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded transition"
                          title="Edit game"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete game"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingGame && (
        <EditGameModal
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSave={() => {
            setEditingGame(null);
            loadGames();
          }}
        />
      )}

      {showAddModal && (
        <AddGameModal
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            loadGames();
          }}
        />
      )}
    </div>
  );
}

function EditGameModal({
  game,
  onClose,
  onSave,
}: {
  game: Game;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: game.name,
    barcode: game.barcode,
    publisher: game.publisher || '',
    year: game.year || '',
    edition: game.edition || '',
    cover_image: game.cover_image || '',
    min_players: game.min_players || '',
    max_players: game.max_players || '',
    playtime_minutes: game.playtime_minutes || '',
    is_expansion: game.is_expansion || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('shared_games')
        .update({
          name: formData.name,
          publisher: formData.publisher || null,
          year: formData.year || null,
          edition: formData.edition || null,
          cover_image: formData.cover_image || null,
          min_players: formData.min_players ? parseInt(formData.min_players as string) : null,
          max_players: formData.max_players ? parseInt(formData.max_players as string) : null,
          playtime_minutes: formData.playtime_minutes ? parseInt(formData.playtime_minutes as string) : null,
          is_expansion: formData.is_expansion,
        })
        .eq('id', game.id);

      if (error) throw error;
      onSave();
    } catch (error) {
      console.error('Error updating game:', error);
      alert('Failed to update game');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Edit Game</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Game Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Barcode (read-only)
            </label>
            <input
              type="text"
              value={formData.barcode}
              disabled
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Publisher
              </label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Edition</label>
            <input
              type="text"
              value={formData.edition}
              onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cover Image URL
            </label>
            <input
              type="url"
              value={formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Min Players
              </label>
              <input
                type="number"
                min="1"
                value={formData.min_players}
                onChange={(e) => setFormData({ ...formData, min_players: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Players
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_players}
                onChange={(e) => setFormData({ ...formData, max_players: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Playtime (min)
              </label>
              <input
                type="number"
                min="1"
                value={formData.playtime_minutes}
                onChange={(e) => setFormData({ ...formData, playtime_minutes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_expansion}
                onChange={(e) => setFormData({ ...formData, is_expansion: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">This is an expansion</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddGameModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    publisher: '',
    year: '',
    edition: '',
    cover_image: '',
    min_players: '',
    max_players: '',
    playtime_minutes: '',
    is_expansion: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from('shared_games').insert({
        name: formData.name,
        barcode: formData.barcode,
        publisher: formData.publisher || null,
        year: formData.year || null,
        edition: formData.edition || null,
        cover_image: formData.cover_image || null,
        min_players: formData.min_players ? parseInt(formData.min_players) : null,
        max_players: formData.max_players ? parseInt(formData.max_players) : null,
        playtime_minutes: formData.playtime_minutes ? parseInt(formData.playtime_minutes) : null,
        is_expansion: formData.is_expansion,
      });

      if (error) throw error;
      onSave();
    } catch (error) {
      console.error('Error adding game:', error);
      alert('Failed to add game. Make sure the barcode is unique.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Add New Game</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Game Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Barcode *
            </label>
            <input
              type="text"
              required
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="UPC/EAN barcode"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Publisher
              </label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Edition</label>
            <input
              type="text"
              value={formData.edition}
              onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cover Image URL
            </label>
            <input
              type="url"
              value={formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Min Players
              </label>
              <input
                type="number"
                min="1"
                value={formData.min_players}
                onChange={(e) => setFormData({ ...formData, min_players: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Players
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_players}
                onChange={(e) => setFormData({ ...formData, max_players: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Playtime (min)
              </label>
              <input
                type="number"
                min="1"
                value={formData.playtime_minutes}
                onChange={(e) => setFormData({ ...formData, playtime_minutes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_expansion}
                onChange={(e) => setFormData({ ...formData, is_expansion: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">This is an expansion</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Game</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
