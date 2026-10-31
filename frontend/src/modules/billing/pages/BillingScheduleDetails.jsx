import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getScheduleById, getSubscriptionBillingHistory, processSubscriptionBilling } from '../../../services/billingApi';
import StatusBadge from '../../../components/StatusBadge';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import { ArrowLeft, Play, Calendar, Clock, DollarSign, User, ShieldCheck } from 'lucide-react';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

export default function BillingScheduleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const sRes = await getScheduleById(id);
      setSchedule(sRes.data);

      if (sRes.data?.subscriptionId) {
        const hRes = await getSubscriptionBillingHistory(sRes.data.subscriptionId);
        setHistory(hRes.data?.executions || []);
      }
    } catch {
      setToast({ message: 'Failed to load schedule details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleProcessNow = async () => {
    if (!schedule) return;
    setConfirmOpen(false);
    setProcessing(true);
    try {
      const res = await processSubscriptionBilling(schedule.subscriptionId);
      const outcome = res.data?.result;
      setToast({
        message: `Billing outcome: ${outcome?.status} - ${outcome?.invoiceNumber ? 'Invoice ' + outcome.invoiceNumber : outcome?.reason || outcome?.error || 'Processed'}`,
        type: outcome?.status === 'failed' ? 'error' : 'success'
      });
      loadDetails();
    } catch (err) {
      setToast({ message: err.message || 'Execution failed', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        Loading schedule…
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <p className="text-slate-600 font-semibold">Schedule not found</p>
        <button onClick={() => navigate('/admin/billing/schedules')} className="text-sm text-blue-600 hover:underline">
          &larr; Back to Schedules
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin/billing/schedules"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Schedules
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-mono">
                {schedule.subscriptionId}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Billing Schedule Record ID: {schedule._id}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={schedule.status} />
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {processing ? 'Processing…' : 'Bill Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Spec Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule Configuration</h2>
            
            <div className="flex justify-between text-sm py-2 border-b border-slate-100">
              <span className="text-slate-500">Billing Frequency</span>
              <span className="font-semibold text-slate-800 capitalize">
                {schedule.billingInterval > 1 ? `Every ${schedule.billingInterval} ` : ''}
                {schedule.billingFrequency}
              </span>
            </div>

            <div className="flex justify-between text-sm py-2 border-b border-slate-100">
              <span className="text-slate-500">Amount Snapshot</span>
              <span className="font-bold text-slate-900">{fmt(schedule.amountSnapshot)} ({schedule.currency})</span>
            </div>

            <div className="flex justify-between text-sm py-2 border-b border-slate-100">
              <span className="text-slate-500">Plan Identifier</span>
              <span className="font-mono text-xs text-slate-700">{schedule.planId}</span>
            </div>

            <div className="flex justify-between text-sm py-2">
              <span className="text-slate-500">Customer ID</span>
              <span className="font-mono text-xs text-blue-700">{schedule.customerId}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cycle & Due Dates</h2>
            
            <div className="flex justify-between text-sm py-2 border-b border-slate-100">
              <span className="text-slate-500">Current Period Start</span>
              <span className="text-xs font-medium text-slate-800">
                {schedule.currentPeriodStart ? new Date(schedule.currentPeriodStart).toLocaleDateString('en-IN') : '—'}
              </span>
            </div>

            <div className="flex justify-between text-sm py-2 border-b border-slate-100">
              <span className="text-slate-500">Current Period End</span>
              <span className="text-xs font-medium text-slate-800">
                {schedule.currentPeriodEnd ? new Date(schedule.currentPeriodEnd).toLocaleDateString('en-IN') : '—'}
              </span>
            </div>

            <div className="flex justify-between text-sm py-2 border-b border-slate-100">
              <span className="text-slate-500">Next Billing Date</span>
              <span className="text-xs font-bold text-amber-700">
                {schedule.nextBillingDate ? new Date(schedule.nextBillingDate).toLocaleDateString('en-IN') : '—'}
              </span>
            </div>

            <div className="flex justify-between text-sm py-2">
              <span className="text-slate-500">Last Billing Date</span>
              <span className="text-xs text-slate-600">
                {schedule.lastBillingDate ? new Date(schedule.lastBillingDate).toLocaleDateString('en-IN') : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Execution History for this subscription */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Execution History for this Subscription</h2>
            <p className="text-xs text-slate-500">All historical billing attempts and generated invoice references</p>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No executions recorded yet. Click "Bill Now" or wait for scheduled billing run.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Source Ref</th>
                    <th className="px-6 py-3">Period</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Invoice Ref</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h) => (
                    <tr key={h._id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono text-xs text-blue-700">{h.sourceReference}</td>
                      <td className="px-6 py-3 text-xs text-slate-600">
                        {new Date(h.billingPeriodStart).toLocaleDateString('en-IN')} &rarr;{' '}
                        {new Date(h.billingPeriodEnd).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-800">{fmt(h.billingAmount)}</td>
                      <td className="px-6 py-3 font-mono text-xs text-emerald-700">
                        {h.invoiceReference || '—'}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={h.status} />
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {h.createdAt ? new Date(h.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Execute Billing Cycle Now?"
        message={`Trigger manual billing for subscription ${schedule.subscriptionId}?`}
        confirmText="Confirm"
        confirmVariant="primary"
        onConfirm={handleProcessNow}
        onCancel={() => setConfirmOpen(false)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
