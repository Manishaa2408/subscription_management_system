import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getBillingSummary,
  getBillingStatus,
  getDueSchedules,
  triggerBillingRun
} from '../../../services/billingApi';
import StatusBadge from '../../../components/StatusBadge';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import { Play, RefreshCw, Calendar, AlertCircle, CheckCircle, Clock, Zap, ArrowRight } from 'lucide-react';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

export default function BillingDashboard() {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState(null);
  const [dueData, setDueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, statRes, dueRes] = await Promise.allSettled([
        getBillingSummary(),
        getBillingStatus(),
        getDueSchedules()
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
      if (statRes.status === 'fulfilled') setStatus(statRes.value.data);
      if (dueRes.status === 'fulfilled') setDueData(dueRes.value.data);
    } catch {
      setToast({ message: 'Failed to load billing telemetry', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunBillingNow = async () => {
    setConfirmOpen(false);
    setRunning(true);
    try {
      const res = await triggerBillingRun();
      const run = res.data?.run;
      setToast({
        message: `Billing run ${run?.runReference || 'executed'}: ${run?.successCount || 0} succeeded, ${run?.failedCount || 0} failed, ${run?.skippedCount || 0} skipped.`,
        type: 'success'
      });
      loadData();
    } catch (err) {
      setToast({
        message: err.message || 'Billing run failed',
        type: 'error'
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Module 9
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recurring Billing Engine</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Automated recurring schedules, due date processing, and M10 invoice generation requests
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => setConfirmOpen(true)}
              disabled={running}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {running ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Executing Billing Run…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Run Billing Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Engine Telemetry Status Banner */}
        {status && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Engine Status: Active &bull; Timezone: {status.scheduler?.timezone || 'Asia/Kolkata'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated Cron: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">{status.scheduler?.cronExpression}</code> &bull;{' '}
                  {status.scheduler?.enabled ? (
                    <span className="text-emerald-700 font-medium">Scheduler Enabled</span>
                  ) : (
                    <span className="text-amber-700 font-medium">Scheduler Standby (Manual & Test Mode)</span>
                  )}
                </p>
              </div>
            </div>

            {status.lastRun && (
              <div className="text-right text-xs text-slate-500">
                <span>Last Run: </span>
                <span className="font-mono font-semibold text-slate-800">{status.lastRun.runReference}</span>
                <span className="text-slate-400"> ({status.lastRun.status})</span>
              </div>
            )}
          </div>
        )}

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Schedules</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{summary?.totalSchedules ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Managed recurring subscriptions</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Due Subscriptions</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold text-amber-600">
              {dueData?.dueCount ?? summary?.dueSchedules ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Ready for invoice generation</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Billed Volume</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">
              {fmt(summary?.successAmount ?? 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">{summary?.successExecutions ?? 0} successful executions</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Failed / Retries</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-3xl font-extrabold text-rose-600">
              {(summary?.failedExecutions ?? 0) + (summary?.retryScheduledExecutions ?? 0)}
            </div>
            <Link to="/admin/billing/failed" className="text-xs text-rose-600 hover:underline mt-1 block font-medium">
              View failed executions &rarr;
            </Link>
          </div>
        </div>

        {/* Due Subscriptions Action List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Subscriptions Due for Billing</h2>
              <p className="text-xs text-slate-500">Subscriptions where next billing date is on or before today</p>
            </div>
            <Link
              to="/admin/billing/schedules"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              All Schedules <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {dueData?.adapterDueSubscriptions && dueData.adapterDueSubscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Subscription</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3">Frequency</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dueData.adapterDueSubscriptions.map((sub) => (
                    <tr key={sub.id || sub.subscriptionId} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono font-medium text-blue-700">
                        {sub.subscriptionNumber || sub.subscriptionId}
                      </td>
                      <td className="px-6 py-3 text-slate-700">{sub.customerId}</td>
                      <td className="px-6 py-3 text-slate-600">{sub.planId}</td>
                      <td className="px-6 py-3 capitalize">{sub.billingFrequency}</td>
                      <td className="px-6 py-3 text-amber-700 font-medium text-xs">
                        {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={sub.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              No subscriptions currently due. Next billing cycles will appear automatically.
            </div>
          )}
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/billing/runs"
            className="p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition group"
          >
            <div className="text-blue-600 font-bold text-sm group-hover:text-blue-700 flex items-center justify-between">
              <span>Billing Run Logs</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Inspect historical execution batches, trigger types, and detailed attempt trees.
            </p>
          </Link>

          <Link
            to="/admin/billing/history"
            className="p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition group"
          >
            <div className="text-blue-600 font-bold text-sm group-hover:text-blue-700 flex items-center justify-between">
              <span>Execution History</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Audit all individual subscription billing events, idempotency keys, and generated invoices.
            </p>
          </Link>

          <Link
            to="/admin/billing/failed"
            className="p-5 bg-white border border-slate-200 rounded-xl hover:border-rose-400 hover:shadow-md transition group"
          >
            <div className="text-rose-600 font-bold text-sm group-hover:text-rose-700 flex items-center justify-between">
              <span>Failed & Retries</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Review exceptions, monitor backoff retry schedules, and trigger manual retries.
            </p>
          </Link>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Execute Manual Recurring Billing Run?"
        message="This will scan all currently due subscriptions, generate deterministic idempotency keys, construct line items, and dispatch invoice-generation requests to M10 Invoice Management."
        confirmText="Execute Run"
        confirmVariant="primary"
        onConfirm={handleRunBillingNow}
        onCancel={() => setConfirmOpen(false)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
