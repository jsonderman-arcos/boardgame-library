import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { PlayActivity } from '../../lib/dashboard';

interface PlayActivityChartProps {
  activity: PlayActivity[];
}

function getMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

export default function PlayActivityChart({ activity }: PlayActivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (activity.length === 0) {
    return null;
  }

  const maxPlays = Math.max(...activity.map(a => a.playCount), 1);
  const totalPlays = activity.reduce((sum, a) => sum + a.playCount, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold text-slate-900">Play Activity</h2>
        </div>
        <div className="text-sm text-slate-600">
          Last 12 months • <span className="font-semibold">{totalPlays}</span> total plays
        </div>
      </div>

      <div className="relative">
        {/* Chart */}
        <div className="flex items-end justify-between h-48 gap-2">
          {activity.map((item, index) => {
            const heightPercentage = maxPlays > 0 ? (item.playCount / maxPlays) * 100 : 0;

            return (
              <div
                key={item.month}
                className="flex-1 flex flex-col items-center justify-end group relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {hoveredIndex === index && item.playCount > 0 && (
                  <div className="absolute bottom-full mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap">
                    <div className="font-semibold">
                      {item.playCount} {item.playCount === 1 ? 'play' : 'plays'}
                    </div>
                    <div className="text-slate-300">
                      {getMonthLabel(item.month)} {item.month.split('-')[0]}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                  </div>
                )}

                {/* Bar */}
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-pink-600 transition-all duration-300 group-hover:from-purple-700 group-hover:to-pink-700 cursor-pointer"
                  style={{
                    height: `${heightPercentage}%`,
                    minHeight: item.playCount > 0 ? '4px' : '0px',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Month Labels */}
        <div className="flex items-center justify-between gap-2 mt-3">
          {activity.map((item) => (
            <div
              key={item.month}
              className="flex-1 text-center text-xs text-slate-500 font-medium"
            >
              {getMonthLabel(item.month)}
            </div>
          ))}
        </div>

        {/* Zero Line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-200" style={{ bottom: '28px' }}></div>
      </div>

      {/* Empty State */}
      {totalPlays === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90">
          <p className="text-slate-500 text-sm">No plays logged in the last 12 months</p>
        </div>
      )}
    </div>
  );
}
