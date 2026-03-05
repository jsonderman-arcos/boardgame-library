import { useState } from 'react';
import { LogOut, User, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProfileDrawer from './ProfileDrawer';

export default function Header() {
  const { profile, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="bg-cream border-b thin-rule rule-line sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-20 gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <BookOpen className="w-7 h-7 text-terracotta-600 flex-shrink-0" strokeWidth={1.5} />
              <div className="border-l thin-rule rule-line h-10" />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-display font-light text-slate-900 tracking-wide">
                  The Catalogue
                </h1>
                {profile && (
                  <p className="text-xs font-body text-slate-500 mt-0.5 tracking-wider">
                    {profile.total_games} {profile.total_games === 1 ? 'Entry' : 'Entries'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {profile && (
                <>
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 border thin-rule rule-line hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-600 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm font-body text-slate-900 hidden sm:inline">{profile.username}</span>
                  </button>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-cream hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm font-body hidden sm:inline">Exit</span>
                  </button>
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
