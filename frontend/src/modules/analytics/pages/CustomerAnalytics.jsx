import React, { useState, useEffect, useCallback } from 'react';
import {
  getCustomerSummary,
  getCustomerGrowth,
  getCustomerDistribution,
  downloadReport
} from '../../../services/dashboardApi';
import CustomerGrowthChart from '../components/CustomerGrowthChart';
import Toast from '../../../components/Toast';
import {
  Users,
  UserPlus,
  UserCheck,
  Building,
  User,
  Download,
  RefreshCw,
  TrendingUp,
  Percent
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function CustomerAnalytics() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, grRes, distRes] = await Promise.all([
        getCustomerSummary(),
        getCustomerGrowth(),
        getCustomerDistribution()
      ]);
      setSummary(sumRes.data);
      setGrowth(grRes.data?.timeline || []);
      setDistribution(distRes.data);
    } catch {
      setToast({ message: 'Failed to load customer analytics', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (type = 'customers') => {
    setExporting(true);
    try {
      await downloadReport(type);
      setToast({ message: `Exported ${type.toUpperCase()} to CSV`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to export customer report', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const typeData = [
    { name: 'Corporate (B2B)', value: distribution?.byType?.corporate || 0, color: '#6366f1' },
    { name: 'Individual (B2C)', value: distribution?.byType?.individual || 0, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Module M12 • Customer Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Customer Growth & Segmentation</h1>
          <p className="text-sm text-gray-500">
            Monitor client acquisition, corporate vs individual distribution, and active customer base health.
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
            onClick={() => handleExport('customers')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export Customers CSV'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Total Customers</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summary?.totalCustomers ?? 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Total registered accounts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Active Customers</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summary?.activeCustomers ?? 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Currently holding active subscriptions</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>New Customers (Month)</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summary?.newCustomersThisMonth ?? 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Acquired during the current month</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Growth Rate</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summary?.growthRate != null ? `${summary.growthRate}%` : '+0.0%'}
          </div>
          <p className="text-xs text-gray-400 mt-1">Month-over-month acquisition</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Acquisition Timeline (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Customer Acquisition Trend</h2>
          <p className="text-sm text-gray-500 mb-4">
            New customer sign-ups recorded month by month.
          </p>
          <CustomerGrowthChart data={growth} />
        </div>

        {/* Customer Type Distribution (1 Col) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Account Segmentation</h2>
            <p className="text-sm text-gray-500 mb-4">
              Corporate (B2B) vs Individual (B2C) clients.
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-sm font-medium text-gray-700">Corporate (B2B)</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {distribution?.byType?.corporate || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Individual (B2C)</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {distribution?.byType?.individual || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
