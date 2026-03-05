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
    <div className="bg-cream linen-texture border thin-rule rule-line p-6 hover:shadow-sm transition">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{label}</span>
          <div className={gradient ? 'text-terracotta-600' : 'text-slate-400'}>
            {icon}
          </div>
        </div>
        <div className="text-3xl font-display font-light text-slate-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {sublabel && <div className="text-xs font-mono text-slate-500 mt-2">{sublabel}</div>}
      </div>
    </div>
  );
}
