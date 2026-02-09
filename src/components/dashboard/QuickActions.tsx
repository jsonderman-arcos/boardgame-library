import { Dice6, Users, Timer, Clock, Sparkles } from 'lucide-react';

type Tool = 'game-chooser' | 'first-player' | 'turn-timer' | 'game-timer';

interface QuickActionsProps {
  onNavigateToGameNiteTools: (tool?: Tool) => void;
}

export default function QuickActions({ onNavigateToGameNiteTools }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Game Chooser Shortcut */}
      <button
        onClick={() => onNavigateToGameNiteTools('game-chooser')}
        className="group bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-purple-300 transition text-left"
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-purple-600 transition">
              Choose a Game
            </h3>
            <p className="text-sm text-slate-600">
              Spin the wheel to pick your next game
            </p>
          </div>
        </div>
      </button>

      {/* First Player Chooser Shortcut */}
      <button
        onClick={() => onNavigateToGameNiteTools('first-player')}
        className="group bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-purple-300 transition text-left"
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg group-hover:scale-110 transition-transform">
            <Dice6 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-purple-600 transition">
              Choose First Player
            </h3>
            <p className="text-sm text-slate-600">
              Randomly select who goes first
            </p>
          </div>
        </div>
      </button>

      {/* Turn Timer Shortcut */}
      <button
        onClick={() => onNavigateToGameNiteTools('turn-timer')}
        className="group bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-purple-300 transition text-left"
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg group-hover:scale-110 transition-transform">
            <Timer className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-purple-600 transition">
              Turn Timer
            </h3>
            <p className="text-sm text-slate-600">
              Countdown each player's turn
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
