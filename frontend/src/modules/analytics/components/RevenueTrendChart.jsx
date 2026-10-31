import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

const fmtINR = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val ?? 0);

export default function RevenueTrendChart({ data = [] }) {
  const [metric, setMetric] = useState('collected'); // 'collected' | 'invoiced' | 'net'

  const metricConfigs = {
    collected: { name: 'Collected Revenue', stroke: '#2563eb', fill: '#3b82f6', fillOpacity: 0.15 },
    invoiced: { name: 'Invoiced Revenue', stroke: '#8b5cf6', fill: '#a855f7', fillOpacity: 0.15 },
    net: { name: 'Net Collections', stroke: '#10b981', fill: '#34d399', fillOpacity: 0.15 }
  };

  const currentConfig = metricConfigs[metric];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Revenue Trajectory</h2>
          <p className="text-xs text-slate-500">Historical performance across monthly billing and payment cycles</p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setMetric('collected')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              metric === 'collected' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Collected
          </button>
          <button
            onClick={() => setMetric('invoiced')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              metric === 'invoiced' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Invoiced
          </button>
          <button
            onClick={() => setMetric('net')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              metric === 'net' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Net
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            No revenue trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentConfig.fill} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={currentConfig.fill} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val) => `₹${val / 1000}k`}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <Tooltip
                formatter={(val) => [fmtINR(val), currentConfig.name]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={currentConfig.stroke}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMetric)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
