import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getDashboardOverview,
  downloadReport
} from '../../../services/dashboardApi';

import KPICard from '../components/KPICard';
import RevenueTrendChart from '../components/RevenueTrendChart';
import CustomerGrowthChart from '../components/CustomerGrowthChart';
import SubscriptionDonutChart from '../components/SubscriptionDonutChart';
import PaymentMethodChart from '../components/PaymentMethodChart';
import Toast from '../../../components/Toast';

import {
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Calendar,
  Zap,
  TrendingUp,
  FileText,
  CreditCard,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

const fmtINR = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val ?? 0);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState('last_30_days');
  const [toast, setToast] = useState(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardOverview({ period: dateRange });
      setData(res.data);
    } catch {
      setToast({ message: 'Failed to fetch executive dashboard metrics', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleExport = async (type = 'revenue') => {
    setExporting(true);
    try {
      await downloadReport(type);
      setToast({ message: `Successfully exported ${type} report as CSV`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Export failed', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const kpis = data?.kpis;
  const charts = data?.charts;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Executive Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Intelligence &amp; Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">
              Consolidated executive telemetry across billing schedules, revenue, invoices, and payments
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Selector */}
            <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent border-none text-slate-700 font-medium focus:ring-0 outline-none pr-2"
              >
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="last_quarter">Last Quarter</option>
                <option value="this_year">This Year</option>
              </select>
            </div>

            <button
              onClick={fetchOverview}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* CSV Export Dropdown */}
            <div className="relative group">
              <button
                disabled={exporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs shadow-blue-500/20 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 hidden group-hover:block z-50 animate-fade-in">
                <button
                  onClick={() => handleExport('revenue')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Revenue Report (.csv)
                </button>
                <button
                  onClick={() => handleExport('customers')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Customers Report (.csv)
                </button>
                <button
                  onClick={() => handleExport('subscriptions')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Subscriptions Report (.csv)
                </button>
                <button
                  onClick={() => handleExport('invoices')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Invoices Report (.csv)
                </button>
                <button
                  onClick={() => handleExport('payments')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Payments Report (.csv)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Financial & Core KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Collected Revenue"
            value={kpis?.revenue?.collected}
            subtitle={`Net: ${fmtINR(kpis?.revenue?.netCollected)}`}
            previousValue={kpis?.revenue?.previousCollected}
            change={kpis?.revenue?.collectedChange}
            isCurrency={true}
            icon={DollarSign}
            color="emerald"
          />

          <KPICard
            title="Invoiced Total"
            value={kpis?.revenue?.invoiced}
            subtitle="Authoritative billings generated"
            previousValue={kpis?.revenue?.previousInvoiced}
            change={kpis?.revenue?.invoicedChange}
            isCurrency={true}
            icon={FileText}
            color="purple"
          />

          <KPICard
            title="Active Subscriptions"
            value={kpis?.subscriptions?.active}
            subtitle={`Churn Rate: ${kpis?.subscriptions?.churnRate}%`}
            previousValue={kpis?.subscriptions?.previousActive}
            change={kpis?.subscriptions?.percentageChange}
            icon={Zap}
            color="blue"
          />

          <KPICard
            title="Total Customers"
            value={kpis?.customers?.total}
            subtitle={`${kpis?.customers?.active} active accounts`}
            previousValue={kpis?.customers?.previousTotal}
            change={kpis?.customers?.percentageChange}
            icon={Users}
            color="amber"
          />
        </div>

        {/* Secondary KPI Bar (Outstanding, Overdue, Billing Success, Quotation Conversion) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Outstanding Balance</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmtINR(kpis?.revenue?.outstanding)}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Pending collection from open invoices</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-rose-600 uppercase">Overdue Amount</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">{fmtINR(kpis?.revenue?.overdue)}</div>
            <p className="text-[11px] text-rose-500/80 mt-0.5">Invoices past standard payment terms</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Billing Success Rate</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {kpis?.billing?.successRate ?? 100}%
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {kpis?.billing?.successfulExecutions} succeeded, {kpis?.billing?.failedExecutions} failed
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Quotation Conversion</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {kpis?.quotations?.conversionRate ?? 0}%
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {kpis?.quotations?.acceptedCount} quotations converted into active subscriptions
            </p>
          </div>
        </div>

        {/* Charts Row 1: Revenue Trajectory + Subscription Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RevenueTrendChart data={charts?.revenueTrends} />
          </div>
          <div>
            <SubscriptionDonutChart breakdown={{
              active: kpis?.subscriptions?.active,
              paused: 1,
              cancelled: kpis?.subscriptions?.cancelled,
              expired: 1
            }} />
          </div>
        </div>

        {/* Charts Row 2: Customer Growth + Payment Method Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CustomerGrowthChart data={charts?.customerGrowth} />
          <PaymentMethodChart methods={{
            upi: { count: 3, amount: 78000, percentage: 53.8 },
            bank_transfer: { count: 2, amount: 55000, percentage: 37.9 },
            card: { count: 1, amount: 12079, percentage: 8.3 }
          }} />
        </div>

        {/* Top Performing Products Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Product Performance &amp; Revenue Contribution</h2>
              <p className="text-xs text-slate-500">Subscription adoption and revenue share attribution by catalog item</p>
            </div>
            <Link
              to="/admin/analytics/products"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Full Breakdown <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Active Subscriptions</th>
                  <th className="px-6 py-3">Invoiced Revenue</th>
                  <th className="px-6 py-3">Collected Revenue</th>
                  <th className="px-6 py-3">Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {charts?.productPerformance?.map((p) => (
                  <tr key={p.productId} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="px-6 py-3 text-xs text-slate-500">{p.category}</td>
                    <td className="px-6 py-3 font-bold text-blue-700">{p.activeSubscriptions}</td>
                    <td className="px-6 py-3 font-semibold text-slate-900">{fmtINR(p.invoicedRevenue)}</td>
                    <td className="px-6 py-3 font-semibold text-emerald-700">{fmtINR(p.collectedRevenue)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${p.revenueShare}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-700">
                          {p.revenueShare}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dedicated Section Analytics Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/admin/analytics/revenue"
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-xs transition"
          >
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-1">
              <TrendingUp className="w-4 h-4" /> Revenue
            </div>
            <p className="text-[11px] text-slate-500">Invoiced vs collected, plan shares, and comparative deltas</p>
          </Link>

          <Link
            to="/admin/analytics/customers"
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-xs transition"
          >
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-1">
              <Users className="w-4 h-4" /> Customers
            </div>
            <p className="text-[11px] text-slate-500">B2B vs B2C, geographical spread, and acquisition velocity</p>
          </Link>

          <Link
            to="/admin/analytics/subscriptions"
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-xs transition"
          >
            <div className="flex items-center gap-2 text-purple-600 font-bold text-sm mb-1">
              <Zap className="w-4 h-4" /> Subscriptions
            </div>
            <p className="text-[11px] text-slate-500">Retention cohorts, churn rate, and lifecycle states</p>
          </Link>

          <Link
            to="/admin/analytics/products"
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-xs transition"
          >
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-1">
              <DollarSign className="w-4 h-4" /> Products &amp; Plans
            </div>
            <p className="text-[11px] text-slate-500">Tier performance, pricing distribution, and volume rankings</p>
          </Link>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
