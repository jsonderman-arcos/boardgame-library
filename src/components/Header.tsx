import { useState } from 'react';
import { LogOut, User, Library } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProfileDrawer from './ProfileDrawer';
import Tooltip from './Tooltip';

export default function Header() {
  const { profile, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-2 sm:py-0 sm:h-16 gap-2">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="bg-slate-900 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <Library className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-slate-900 truncate">Board Game Library</h1>
                {profile && (
                  <p className="text-xs sm:text-sm text-slate-600">
                    {profile.total_games} {profile.total_games === 1 ? 'game' : 'games'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {profile && (
                <>
                  <Tooltip content="Profile">
                    <button
                      onClick={() => setIsDrawerOpen(true)}
                      className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-slate-900 hidden xs:inline truncate max-w-[80px] sm:max-w-none">{profile.username}</span>
                    </button>
                  </Tooltip>
                  <Tooltip content="Sign out">
                    <button
                      onClick={signOut}
                      className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                    >
                      <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium hidden xs:inline">Sign Out</span>
                    </button>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
