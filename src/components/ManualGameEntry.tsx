import { useState } from 'react';
import { X, Save } from 'lucide-react';

interface ManualGameEntryProps {
  barcode: string;
  onSave: (gameData: {
    barcode: string;
    name: string;
    publisher?: string;
    year?: string;
    cover_image?: string;
  }) => void;
  onClose: () => void;
}

export default function ManualGameEntry({ barcode, onSave, onClose }: ManualGameEntryProps) {
  const [name, setName] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a game name');
      return;
    }

    onSave({
      barcode,
      name: name.trim(),
      publisher: publisher.trim() || undefined,
      year: year.trim() || undefined,
      cover_image: coverImage.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Add Game Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-700">
              We couldn't find this game in our database. Please enter the game details manually.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Barcode: <span className="font-mono">{barcode}</span>
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Game Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Catan"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="publisher" className="block text-sm font-medium text-slate-700 mb-2">
              Publisher
            </label>
            <input
              id="publisher"
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="e.g., Catan Studio"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-slate-700 mb-2">
              Year
            </label>
            <input
              id="year"
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., 1995"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-slate-700 mb-2">
              Cover Image URL
            </label>
            <input
              id="coverImage"
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center space-x-2 bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition"
            >
              <Save className="w-5 h-5" />
              <span>Save Game</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
