import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import Library from './components/Library';
import AdminPanel from './components/AdminPanel';
import GameNiteTools from './components/GameNiteTools';
import Dashboard from './components/Dashboard';
import { Shield, BookOpen, Sparkles, BarChart3 } from 'lucide-react';

type Tool = 'game-chooser' | 'first-player' | 'turn-timer' | 'game-timer';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'gameNiteTools' | 'admin'>('dashboard');
  const [selectedTool, setSelectedTool] = useState<Tool | undefined>(undefined);

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
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'dashboard'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
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
              onClick={() => setActiveTab('gameNiteTools')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'gameNiteTools'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Sparkles className="w-5 h-5" />
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

      {activeTab === 'dashboard' && (
        <Dashboard
          onNavigate={(tab, params) => {
            setActiveTab(tab);
            if (tab === 'gameNiteTools' && params?.tool) {
              setSelectedTool(params.tool);
            }
          }}
        />
      )}
      {activeTab === 'library' && <Library />}
      {activeTab === 'gameNiteTools' && <GameNiteTools initialTool={selectedTool} />}
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
