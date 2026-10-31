import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceApi } from '../../../services/invoiceApi';
import { useAuth } from '../../../context/AuthContext';
import { StatusBadge } from '../../../components/StatusBadge';
import { Toast } from '../../../components/Toast';
import {
  FileText,
  Printer,
  Eye,
  ShieldCheck,
  Building,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const CustomerInvoices = () => {
  const { currentUser, switchUser } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchMyInvoices = async () => {
    try {
      setLoading(true);
      // Calls /api/invoices/my (or scoped /api/invoices)
      const res = await invoiceApi.getMyInvoices();
      setInvoices(res.data || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInvoices();
  }, [currentUser]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Customer Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Customer Invoicing Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{currentUser.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as {currentUser.email} &bull; ID: <span className="font-mono">{currentUser.id}</span>
          </p>
        </div>

        {/* Customer Persona Switcher helper for evaluation */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-medium">Switch Customer:</span>
          <div className="flex gap-2">
            <button
              onClick={() => switchUser('customer1')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                currentUser.key === 'customer1'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Customer 1 (Kochi - Intra KL)
            </button>
            <button
              onClick={() => switchUser('customer2')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                currentUser.key === 'customer2'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Customer 2 (Bengaluru - Inter KA)
            </button>
          </div>
        </div>
      </div>

      {/* Security & Access Isolation Note */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Multi-tenant Customer Data Isolation:</span> Customers are restricted by
          backend authorization rules to only retrieve invoices matching their customer ID. Any unauthorized attempt
          to query another customer's invoice ID returns HTTP 403 Forbidden.
        </div>
      </div>

      {/* Customer Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Your Invoices & Receipts
          </h3>
          <span className="text-xs text-slate-500">{invoices.length} invoices</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Fetching your invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No invoices available</p>
            <p className="text-xs text-slate-400 mt-1">You do not currently have any invoices issued under your account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Issue Date</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5 text-right">Taxable Amount</th>
                  <th className="px-5 py-3.5 text-right">GST Tax</th>
                  <th className="px-5 py-3.5 text-right">Grand Total</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-bold text-blue-600">
                      <Link to={`/admin/invoices/${inv._id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-800">
                      ₹{inv.taxableAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-blue-700 font-semibold">
                      ₹{inv.taxTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      ₹{inv.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={inv.effectiveStatus || inv.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/invoices/${inv._id}`}
                          title="View Details"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/invoices/${inv._id}/print`}
                          target="_blank"
                          title="Print / Download PDF"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
