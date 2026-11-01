import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBillingRunDetails, retryBillingRun } from '../../../services/billingApi';
import StatusBadge from '../../../components/StatusBadge';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, FileText, Clock } from 'lucide-react';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

export default function BillingRunDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await getBillingRunDetails(id);
      setData(res.data);
    } catch {
      setToast({ message: 'Failed to load billing run details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleRetryFailed = async () => {
    setConfirmOpen(false);
    setRetrying(true);
    try {
      const res = await retryBillingRun(id);
      setToast({
        message: res.message || 'Retry run initiated successfully',
        type: 'success'
      });
      loadDetails();
    } catch (err) {
      setToast({ message: err.message || 'Retry failed', type: 'error' });
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center text-slate-400">
        Loading run details…
      </div>
    );
  }

  if (!data?.run) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <p className="text-slate-600 font-semibold">Billing run not found</p>
        <button onClick={() => navigate('/admin/billing/runs')} className="text-sm text-blue-600 hover:underline">
          &larr; Back to Billing Runs
        </button>
      </div>
    );
  }

  const { run, executions = [], logs = [] } = data;

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            to="/admin/billing/runs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Billing Runs
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 font-mono">{run.runReference}</h1>
                <StatusBadge status={run.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Triggered: <span className="font-semibold capitalize text-slate-700">{run.triggerType}</span> by{' '}
                <span className="font-mono text-slate-700">{run.triggeredBy}</span>
              </p>
            </div>

            {run.failedCount > 0 && (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={retrying}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Retrying…' : `Retry ${run.failedCount} Failed`}
              </button>
            )}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-semibold">Total Examined</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{run.totalExamined}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-semibold">Successful</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{run.successCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-semibold">Failed</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">{run.failedCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-semibold">Skipped</span>
            <div className="text-2xl font-bold text-slate-600 mt-1">{run.skippedCount}</div>
          </div>
        </div>

        {/* Executions Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Subscription Executions ({executions.length})</h2>
            <p className="text-xs text-slate-500">Individual billing operations processed during this run</p>
          </div>

          {executions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No execution records for this run.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Subscription</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Source Ref</th>
                    <th className="px-6 py-3">Invoice Ref</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Error / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {executions.map((e) => (
                    <tr key={e._id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono font-medium text-blue-700">{e.subscriptionId}</td>
                      <td className="px-6 py-3 text-xs text-slate-700">{e.customerId}</td>
                      <td className="px-6 py-3 font-semibold text-slate-800">{fmt(e.billingAmount)}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-500">{e.sourceReference}</td>
                      <td className="px-6 py-3 font-mono text-xs text-emerald-700 font-semibold">
                        {e.invoiceReference ? (
                          <Link to={`/admin/invoices/${e.invoiceId || ''}`} className="hover:underline">
                            {e.invoiceReference}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="px-6 py-3 text-xs text-rose-600 max-w-[220px] truncate" title={e.errorMessage}>
                        {e.errorMessage || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit Event Logs */}
        {logs.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Execution Audit Logs ({logs.length})</h2>
              <p className="text-xs text-slate-500">Granular timeline of engine events and dispatch steps</p>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {logs.map((l) => (
                <div key={l._id} className="px-6 py-3 text-xs flex items-start gap-3">
                  <span className="font-mono text-slate-400 shrink-0">
                    {l.createdAt ? new Date(l.createdAt).toLocaleTimeString() : ''}
                  </span>
                  <span className="font-semibold text-slate-800 shrink-0 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                    {l.event}
                  </span>
                  <span className="text-slate-600 flex-1">{l.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Retry Failed Subscriptions?"
        message={`Trigger retry run for ${run.failedCount} failed subscriptions from ${run.runReference}? Original idempotency keys and attempt counts will be preserved.`}
        confirmText="Confirm Retry"
        confirmVariant="danger"
        onConfirm={handleRetryFailed}
        onCancel={() => setConfirmOpen(false)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
