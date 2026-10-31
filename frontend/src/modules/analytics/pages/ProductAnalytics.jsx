import React, { useState, useEffect, useCallback } from 'react';
import {
  getProductPerformance,
  getRevenueByProduct,
  downloadReport
} from '../../../services/dashboardApi';
import Toast from '../../../components/Toast';
import {
  Package,
  DollarSign,
  TrendingUp,
  Download,
  RefreshCw,
  Award,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const fmtINR = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val ?? 0);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

export default function ProductAnalytics() {
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState([]);
  const [byProduct, setByProduct] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [perfRes, revRes] = await Promise.all([
        getProductPerformance(),
        getRevenueByProduct()
      ]);
      setPerformance(perfRes.data?.products || []);
      setByProduct(revRes.data);
    } catch {
      setToast({ message: 'Failed to load product analytics', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (type = 'revenue') => {
    setExporting(true);
    try {
      await downloadReport(type);
      setToast({ message: 'Exported product revenue performance to CSV', type: 'success' });
    } catch {
      setToast({ message: 'Failed to export report', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const topProduct = performance[0] || null;
  const totalCatalogRev = byProduct?.totalRevenue || performance.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Module M12 • Product Performance
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Catalog & Product Analytics</h1>
          <p className="text-sm text-gray-500">
            Analyze subscription plan profitability, revenue share attribution, and top-tier product drivers.
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
            onClick={() => handleExport('revenue')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Total Offerings</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{performance.length}</div>
          <p className="text-xs text-gray-400 mt-1">Catalog subscriptions in market</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Top Performing Product</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 truncate">
            {topProduct?.name || 'Enterprise Suite'}
          </div>
          <p className="text-xs text-gray-400 mt-1">{topProduct?.sharePercentage ?? 0}% revenue share</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Total Product Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{fmtINR(totalCatalogRev)}</div>
          <p className="text-xs text-gray-400 mt-1">Combined lifetime & recurring</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Top Product Subscriptions</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {topProduct?.activeSubscriptions ?? 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Active recurring subscriber licenses</p>
        </div>
      </div>

      {/* Product Revenue Share Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Product Revenue Distribution</h2>
          <p className="text-sm text-gray-500 mb-4">Total revenue contributed per product</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={120} />
                <Tooltip formatter={(val) => fmtINR(val)} />
                <Bar dataKey="totalRevenue" fill="#6366f1" radius={[0, 4, 4, 0]} name="Total Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Revenue Share % Attribution</h2>
            <p className="text-sm text-gray-500 mb-4">Proportionate breakdown of top revenue generators</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performance}
                    dataKey="totalRevenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {performance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => fmtINR(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
            {performance.slice(0, 4).map((p, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="truncate">{p.name}: {p.sharePercentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comprehensive Product Performance Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Product Performance Matrix</h2>
          <p className="text-xs text-gray-500">In-depth unit economics and customer subscription density</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Active Subscriptions</th>
                <th className="py-3 px-4">Total Revenue</th>
                <th className="py-3 px-4">Revenue Share</th>
                <th className="py-3 px-4">ARPU (Est.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {performance.map((prod, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    {prod.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-gray-500">{prod.sku}</td>
                  <td className="py-3.5 px-4 font-medium">{prod.activeSubscriptions}</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-700">{fmtINR(prod.totalRevenue)}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${prod.sharePercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{prod.sharePercentage}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-gray-600">
                    {fmtINR(prod.arpu || (prod.activeSubscriptions > 0 ? prod.totalRevenue / prod.activeSubscriptions : 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
