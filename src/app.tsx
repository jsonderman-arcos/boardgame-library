import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import Library from './components/Library';
import AdminPanel from './components/AdminPanel';
import GameNiteTools from './components/GameNiteTools';
import { Shield, BookOpen, Dices } from 'lucide-react';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'library' | 'game-nite-tools' | 'admin'>('library');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={() => {}} />;
  }

  const isAdmin = profile?.is_admin || false;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'library'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>My Library</span>
            </button>
            <button
              onClick={() => setActiveTab('game-nite-tools')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'game-nite-tools'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Dices className="w-5 h-5" />
              <span>Game Nite Tools</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition ${
                  activeTab === 'admin'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Admin</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {activeTab === 'library' && <Library />}
      {activeTab === 'game-nite-tools' && <GameNiteTools />}
      {activeTab === 'admin' && <AdminPanel />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;