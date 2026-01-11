import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { UserLibraryEntry, Game } from '../lib/supabase';

interface EditGameModalProps {
  entry: UserLibraryEntry & { game: Game };
  onSave: (entryId: string, updates: Partial<UserLibraryEntry>) => void;
  onClose: () => void;
}

export default function EditGameModal({ entry, onSave, onClose }: EditGameModalProps) {
  const [forSale, setForSale] = useState(entry.for_sale);
  const [ranking, setRanking] = useState(entry.personal_ranking || '');
  const [notes, setNotes] = useState(entry.notes || '');
  const [playedDates, setPlayedDates] = useState<string[]>(entry.played_dates || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(entry.id, {
      for_sale: forSale,
      personal_ranking: ranking as 'high' | 'medium' | 'low' | undefined,
      notes: notes || undefined,
      played_dates: playedDates.length > 0 ? playedDates : undefined,
    });
  };

  const addPlayedDate = () => {
    const today = new Date().toISOString().split('T')[0];
    if (!playedDates.includes(today)) {
      setPlayedDates([...playedDates, today].sort().reverse());
    }
  };

  const removePlayedDate = (date: string) => {
    setPlayedDates(playedDates.filter(d => d !== date));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{entry.game.name}</h2>
            <p className="text-slate-600">{entry.game.publisher}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={forSale}
                onChange={(e) => setForSale(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-slate-700 font-medium">For Sale</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition resize-none"
              placeholder="Add notes about this game..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700">
                Play History
              </label>
              <button
                type="button"
                onClick={addPlayedDate}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Add Play</span>
              </button>
            </div>
            {playedDates.length > 0 && (
              <div className="space-y-2">
                {playedDates.map(date => (
                  <div
                    key={date}
                    className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm text-slate-700">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePlayedDate(date)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
