import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  sublabel?: string;
  gradient?: boolean;
}

export default function StatCard({ icon, label, value, sublabel, gradient = false }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
      <div className="flex items-center space-x-3">
        <div
          className={`p-3 rounded-lg ${
            gradient
              ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-600">{label}</div>
          <div className="text-2xl font-bold text-slate-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {sublabel && <div className="text-xs text-slate-500 mt-0.5">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}
