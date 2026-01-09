import { useState } from 'react';
import { LogOut, User, Library } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProfileDrawer from './ProfileDrawer';

export default function Header() {
  const { profile, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-2 rounded-lg">
                <Library className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Board Game Library</h1>
                {profile && (
                  <p className="text-sm text-slate-600">
                    {profile.total_games} {profile.total_games === 1 ? 'game' : 'games'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {profile && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center space-x-2 bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-900">{profile.username}</span>
                  </button>
                  <button
                    onClick={signOut}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
