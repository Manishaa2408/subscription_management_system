import { useState, useEffect, useCallback } from 'react';
import {
  getReconciliationSummary,
  getBankTransactions,
  runAutoMatch,
  manualMatch,
  importBankTransactions,
} from '../../../services/paymentApi';
import Toast from '../../../components/Toast';
import StatusBadge from '../../../components/StatusBadge';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

const SummaryCard = ({ label, value, color }) => (
  <div className={`bg-white rounded-xl border-l-4 ${color} p-4 shadow-sm`}>
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
  </div>
);

const RECON_COLORS = {
  unmatched: 'amber',
  matched: 'emerald',
  discrepancy: 'rose',
  ignored: 'slate',
};

export default function ReconciliationDashboard() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const [importText, setImportText] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Manual match state
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ bankTransactionId: '', paymentId: '', notes: '' });
  const [manualLoading, setManualLoading] = useState(false);

  const [filter, setFilter] = useState('');

  const showToast = (message, type = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([
        getReconciliationSummary(),
        getBankTransactions(filter ? { reconciliationStatus: filter } : {}),
      ]);
      setSummary(sRes.data ?? null);
      setTransactions(tRes.data?.transactions ?? []);
    } catch {
      showToast('Failed to load reconciliation data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleAutoMatch = async () => {
    setAutoRunning(true);
    try {
      const res = await runAutoMatch();
      const d = res.data;
      showToast(`Auto-match complete: ${d?.matched ?? 0} matched, ${d?.skipped ?? 0} skipped`);
      load();
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Auto-match failed', 'error');
    } finally {
      setAutoRunning(false);
    }
  };

  const handleImport = async () => {
    let parsed;
    try { parsed = JSON.parse(importText); } catch {
      showToast('Invalid JSON — paste a valid JSON array', 'error'); return;
    }
    if (!Array.isArray(parsed)) { showToast('Expected a JSON array of transactions', 'error'); return; }
    setImporting(true);
    try {
      const res = await importBankTransactions(parsed);
      showToast(`${res.data?.imported ?? 0} transactions imported`);
      setImportText('');
      setImportOpen(false);
      load();
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleManualMatch = async () => {
    if (!manualForm.bankTransactionId || !manualForm.paymentId) {
      showToast('Both Bank Transaction ID and Payment ID are required', 'error'); return;
    }
    setManualLoading(true);
    try {
      await manualMatch(manualForm);
      showToast('Manual match created successfully');
      setManualForm({ bankTransactionId: '', paymentId: '', notes: '' });
      setManualOpen(false);
      load();
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Manual match failed', 'error');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bank Reconciliation</h1>
            <p className="text-sm text-gray-500 mt-0.5">Match bank transactions with recorded payments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setImportOpen((o) => !o)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              ↑ Import Transactions
            </button>
            <button
              onClick={handleAutoMatch}
              disabled={autoRunning}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {autoRunning ? 'Running…' : '⚡ Auto-Match'}
            </button>
            <button
              onClick={() => setManualOpen((o) => !o)}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              ✎ Manual Match
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard label="Total Transactions" value={summary.totalTransactions ?? 0} color="border-gray-400" />
            <SummaryCard label="Matched" value={summary.matched ?? 0} color="border-emerald-500" />
            <SummaryCard label="Unmatched" value={summary.unmatched ?? 0} color="border-amber-500" />
            <SummaryCard label="Discrepancies" value={summary.discrepancy ?? 0} color="border-rose-500" />
          </div>
        )}

        {/* Import panel */}
        {importOpen && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Import Bank Transactions (JSON)</h2>
            <p className="text-xs text-gray-400 mb-2">
              Paste a JSON array. Each object needs: <code>transactionId</code>, <code>amount</code> (credit/debit), <code>transactionDate</code>, optionally <code>description</code> and <code>reference</code>.
            </p>
            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[{"transactionId":"TXN001","creditAmount":5900,"transactionDate":"2026-10-01","description":"UPI Credit"}]'
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end gap-3 mt-3">
              <button onClick={() => setImportOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Importing…' : 'Import'}
              </button>
            </div>
          </div>
        )}

        {/* Manual match panel */}
        {manualOpen && (
          <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Manual Match</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bank Transaction ID *</label>
                <input
                  type="text"
                  value={manualForm.bankTransactionId}
                  onChange={(e) => setManualForm((f) => ({ ...f, bankTransactionId: e.target.value }))}
                  placeholder="MongoDB _id of bank transaction"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Payment ID *</label>
                <input
                  type="text"
                  value={manualForm.paymentId}
                  onChange={(e) => setManualForm((f) => ({ ...f, paymentId: e.target.value }))}
                  placeholder="MongoDB _id of payment"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <input
                type="text"
                value={manualForm.notes}
                onChange={(e) => setManualForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional reason for manual match"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 mt-3">
              <button onClick={() => setManualOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button
                onClick={handleManualMatch}
                disabled={manualLoading}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {manualLoading ? 'Matching…' : 'Create Match'}
              </button>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex gap-2 mb-3">
          {['', 'unmatched', 'matched', 'discrepancy', 'ignored'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                filter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Transactions table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p>No transactions</p>
              <p className="text-xs mt-1">Import bank statement transactions to begin reconciliation</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Txn ID', 'Date', 'Description', 'Credit', 'Debit', 'Reference', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.transactionId}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {t.transactionDate ? new Date(t.transactionDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{t.description || '—'}</td>
                    <td className="px-4 py-3 text-emerald-700 font-semibold">
                      {t.creditAmount > 0 ? fmt(t.creditAmount) : '—'}
                    </td>
                    <td className="px-4 py-3 text-rose-600 font-semibold">
                      {t.debitAmount > 0 ? fmt(t.debitAmount) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.reference || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.reconciliationStatus} color={RECON_COLORS[t.reconciliationStatus]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
