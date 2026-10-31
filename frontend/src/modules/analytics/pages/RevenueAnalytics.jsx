import React, { useState, useEffect, useCallback } from 'react';
import {
  getRevenueSummary,
  getRevenueTrends,
  getRevenueByProduct,
  getRevenueByPlan,
  getRevenueComparison,
  getInvoiceTax,
  downloadReport
} from '../../../services/dashboardApi';
import RevenueTrendChart from '../components/RevenueTrendChart';
import Toast from '../../../components/Toast';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  PieChart as PieIcon,
  Download,
  RefreshCw,
  FileText,
  Percent,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const fmtINR = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val ?? 0);

export default function RevenueAnalytics() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [byProduct, setByProduct] = useState([]);
  const [byPlan, setByPlan] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [tax, setTax] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, trRes, prodRes, planRes, compRes, taxRes] = await Promise.all([
        getRevenueSummary(),
        getRevenueTrends(),
        getRevenueByProduct(),
        getRevenueByPlan(),
        getRevenueComparison(),
        getInvoiceTax()
      ]);
      setSummary(sumRes.data);
      setTrends(trRes.data?.timeline || []);
      setByProduct(prodRes.data?.breakdown || []);
      setByPlan(planRes.data?.breakdown || []);
      setComparison(compRes.data);
      setTax(taxRes.data);
    } catch {
      setToast({ message: 'Failed to load revenue analytics', type: 'error' });
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
      setToast({ message: `Exported ${type.toUpperCase()} analytics to CSV`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to export report', type: 'error' });
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Module M12 • Analytics
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Revenue & Financial Analytics</h1>
          <p className="text-sm text-gray-500">
            Deep dive into invoiced revenue, gross collections, net cash flow, tax breakdown, and product performance.
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
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export Revenue CSV'}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Collected Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {fmtINR(summary?.collectedRevenue ?? 0)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Realized payments across all channels</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Net Collected Revenue</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {fmtINR(summary?.netCollectedRevenue ?? 0)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Gross Collections minus processed refunds</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Invoiced Revenue</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {fmtINR(summary?.invoicedRevenue ?? 0)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Total invoiced value issued to customers</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
            <span>Period Comparison</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {comparison?.percentageChange != null ? `${comparison.percentageChange}%` : '+0.0%'}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            vs Previous Period ({fmtINR(comparison?.previousPeriodRevenue ?? 0)})
          </p>
        </div>
      </div>

      {/* Main Revenue Timeline Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Revenue Trajectory</h2>
        <p className="text-sm text-gray-500 mb-4">
          Compare invoiced value against cash collections and net revenue across billing periods.
        </p>
        <RevenueTrendChart data={trends} />
      </div>

      {/* Products & Plans Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Product Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Revenue by Product</h2>
              <p className="text-xs text-gray-500">Contribution per catalog offering</p>
            </div>
            <PieIcon className="w-5 h-5 text-gray-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byProduct} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip formatter={(val) => fmtINR(val)} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-3 space-y-2">
            {byProduct.slice(0, 4).map((p, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700 truncate max-w-[200px]">{p.name}</span>
                <span className="font-semibold text-gray-900">{fmtINR(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Plan Tier */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Revenue by Plan Tier</h2>
              <p className="text-xs text-gray-500">Breakdown by subscription tier pricing</p>
            </div>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4 pt-2">
            {byPlan.map((plan, idx) => {
              const maxRev = Math.max(...byPlan.map((p) => p.revenue || 0), 1);
              const pct = Math.round(((plan.revenue || 0) / maxRev) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-800">{plan.name}</span>
                    <span className="font-semibold text-gray-900">{fmtINR(plan.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{plan.subscribersCount || 0} active subscribers</span>
                    <span>{plan.sharePercentage ?? 0}% of plan revenue</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tax Breakdown & Compliance Panel */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">GST & Tax Compliance Snapshot</h2>
            <p className="text-xs text-gray-500">Aggregated CGST, SGST, IGST liability from invoices</p>
          </div>
          <button
            onClick={() => handleExport('invoices')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Export Invoices CSV
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tax Collected</span>
            <div className="text-xl font-bold text-gray-900 mt-1">{fmtINR(tax?.totalTax ?? 0)}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">CGST (Central GST)</span>
            <div className="text-xl font-bold text-gray-900 mt-1">{fmtINR(tax?.cgst ?? 0)}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">SGST (State GST)</span>
            <div className="text-xl font-bold text-gray-900 mt-1">{fmtINR(tax?.sgst ?? 0)}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">IGST (Integrated GST)</span>
            <div className="text-xl font-bold text-gray-900 mt-1">{fmtINR(tax?.igst ?? 0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
