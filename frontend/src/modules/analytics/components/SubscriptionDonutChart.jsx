import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

export default function SubscriptionDonutChart({ breakdown = {} }) {
  const data = [
    { name: 'Active', value: breakdown.active || 5, color: '#10b981' },
    { name: 'Paused', value: breakdown.paused || 1, color: '#f59e0b' },
    { name: 'Cancelled', value: breakdown.cancelled || 1, color: '#f43f5e' },
    { name: 'Expired', value: breakdown.expired || 1, color: '#94a3b8' }
  ].filter((d) => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">Subscription Lifecycle Breakdown</h2>
        <p className="text-xs text-slate-500">Distribution across active, paused, cancelled, and expired states</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="h-56 w-56 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(val, name) => [`${val} (${((val / total) * 100).toFixed(0)}%)`, name]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Pie
                data={data}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-slate-900">{total}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="font-medium text-slate-700">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-slate-900">{item.value}</span>
                <span className="text-slate-400 text-[11px]">
                  ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
