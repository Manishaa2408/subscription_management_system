import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue'
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  const iconClass = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconClass}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">
        {value}
      </div>

      <div className="mt-1 flex items-center gap-2 text-xs">
        {trend && (
          <span
            className={`font-semibold inline-flex items-center gap-0.5 ${
              trend > 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
        {(subtext || trendLabel) && (
          <span className="text-slate-500 truncate">
            {trendLabel || subtext}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
