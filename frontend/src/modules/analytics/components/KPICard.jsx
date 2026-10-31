import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function KPICard({
  title,
  value,
  subtitle,
  previousValue,
  change,
  isCurrency = false,
  currency = 'INR',
  icon: Icon,
  color = 'blue'
}) {
  const isPositive = typeof change === 'number' && change > 0;
  const isNegative = typeof change === 'number' && change < 0;
  const isNeutral = typeof change === 'number' && change === 0;

  const colorStyles = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    rose: 'text-rose-600 bg-rose-50 border-rose-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200'
  };

  const fmt = (n) => {
    if (typeof n !== 'number') return n ?? '—';
    if (isCurrency) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(n);
    }
    return new Intl.NumberFormat('en-IN').format(n);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${colorStyles[color] || colorStyles.blue}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        {fmt(value)}
      </div>

      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}

      {typeof change === 'number' && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div
            className={`inline-flex items-center gap-1 font-semibold ${
              isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-slate-500'
            }`}
          >
            {isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
            {isNegative && <ArrowDownRight className="w-3.5 h-3.5" />}
            {isNeutral && <Minus className="w-3.5 h-3.5" />}
            <span>
              {change > 0 ? `+${change}%` : `${change}%`}
            </span>
            <span className="text-slate-400 font-normal">vs prev period</span>
          </div>

          {previousValue !== undefined && (
            <span className="text-slate-400 font-mono">
              Prev: {fmt(previousValue)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
