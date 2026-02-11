import { useState } from 'react';
import Header from './Header';
import GameChooser from './GameChooser';
import FirstPlayerChooser from './FirstPlayerChooser';
import TurnTimer from './TurnTimer';
import GameTimer from './GameTimer';
import { Sparkles, Dice6, Timer, Clock } from 'lucide-react';

type Tool = 'game-chooser' | 'first-player' | 'turn-timer' | 'game-timer';

interface GameNiteToolsProps {
  initialTool?: Tool;
}

export default function GameNiteTools({ initialTool = 'game-chooser' }: GameNiteToolsProps) {
  const [activeTool, setActiveTool] = useState<Tool>(initialTool);

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Game Nite Tools
          </h1>
          <p className="text-slate-600 mt-2">
            Make your game night planning easy and fun!
          </p>
        </div>

        {/* Subnav Tabs */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
          <div className="flex border-b border-slate-200 min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTool('game-chooser')}
              className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium transition-all ${
                activeTool === 'game-chooser'
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base whitespace-nowrap">Game Chooser</span>
              </div>
              <p className="text-xs mt-1 opacity-75 hidden md:block">
                Spin the wheel to pick a game
              </p>
            </button>

            <button
              onClick={() => setActiveTool('first-player')}
              className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium transition-all ${
                activeTool === 'first-player'
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <Dice6 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base whitespace-nowrap">First Player</span>
              </div>
              <p className="text-xs mt-1 opacity-75 hidden md:block">
                Randomly pick who goes first
              </p>
            </button>

            <button
              onClick={() => setActiveTool('turn-timer')}
              className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium transition-all ${
                activeTool === 'turn-timer'
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base whitespace-nowrap">Turn Timer</span>
              </div>
              <p className="text-xs mt-1 opacity-75 hidden md:block">
                Countdown each player turn
              </p>
            </button>

            <button
              onClick={() => setActiveTool('game-timer')}
              className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium transition-all ${
                activeTool === 'game-timer'
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base whitespace-nowrap">Game Timer</span>
              </div>
              <p className="text-xs mt-1 opacity-75 hidden md:block">
                Track a game session
              </p>
            </button>
          </div>
        </div>

        {/* Tool Content */}
        <div>
          {activeTool === 'game-chooser' && <GameChooser />}
          {activeTool === 'first-player' && <FirstPlayerChooser />}
          {activeTool === 'turn-timer' && <TurnTimer />}
          {activeTool === 'game-timer' && <GameTimer />}
        </div>
      </div>
    </>
  );
}
