import React, { useState, useEffect, useCallback } from 'react';
import {
  getSubscriptionSummary,
  getSubscriptionGrowth,
  getSubscriptionStatus,
  getSubscriptionChurn,
  downloadReport
} from '../../../services/dashboardApi';
import SubscriptionDonutChart from '../components/SubscriptionDonutChart';
import Toast from '../../../components/Toast';
import {
  RefreshCw,
  Download,
  Activity,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function SubscriptionAnalytics() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [statusCounts, setStatusCounts] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, grRes, stRes, chRes] = await Promise.all([
        getSubscriptionSummary(),
        getSubscriptionGrowth(),
        getSubscriptionStatus(),
        getSubscriptionChurn()
      ]);
      setSummary(sumRes.data);
      setGrowth(grRes.data?.timeline || []);
      setStatusCounts(stRes.data);
      setChurnData(chRes.data);
    } catch {
      setToast({ message: 'Failed to load subscription analytics', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (type = 'subscriptions') => {
    setExporting(true);
    try {
      await downloadReport(type);
      setToast({ message: `Exported ${type.toUpperCase()} to CSV`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to export subscription report', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Module M12 • Subscription Health
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Subscription Lifecycle & Retention</h1>
          <p className="text-sm text-gray-500">
            Track active subscriber cohorts, monitor churn rate velocity, and visualize renewal health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium border border-gray-200 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => handleExport('subscriptions')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export Subscriptions CSV'}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Active Subscriptions</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summary?.activeSubscriptions ?? 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Generating recurring billing cycles</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Customer Churn Rate</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {summary?.churnRate != null ? `${summary.churnRate}%` : '0%'}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {churnData?.cancelledCount ?? 0} cancelled of {churnData?.totalBase ?? 0} total base
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Retention Rate</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            {summary?.retentionRate != null ? `${summary.retentionRate}%` : '100%'}
          </div>
          <p className="text-xs text-gray-400 mt-1">Healthy recurring renewal benchmark</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Trial & Paused</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <PauseCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {(summary?.trialSubscriptions ?? 0) + (summary?.pausedSubscriptions ?? 0)}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {summary?.trialSubscriptions ?? 0} trial • {summary?.pausedSubscriptions ?? 0} paused
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth vs Churn Timeline (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Subscriber Trajectory</h2>
          <p className="text-sm text-gray-500 mb-4">
            New activations vs cancelled subscriptions over time.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSubCancel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="activeSubscriptions"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSubActive)"
                  name="Active Subscriptions"
                />
                <Area
                  type="monotone"
                  dataKey="cancelledSubscriptions"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSubCancel)"
                  name="Cancelled"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut (1 Col) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Status Distribution</h2>
            <p className="text-sm text-gray-500 mb-4">Current state of all contracts</p>
            <SubscriptionDonutChart data={statusCounts} />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Active: {statusCounts?.active || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Paused: {statusCounts?.paused || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Cancelled: {statusCounts?.cancelled || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Trial: {statusCounts?.trial || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
