import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceApi } from '../../../services/invoiceApi';
import { useAuth } from '../../../context/AuthContext';
import { StatusBadge } from '../../../components/StatusBadge';
import { Toast } from '../../../components/Toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Printer,
  CheckCircle,
  XCircle,
  FileEdit,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  IndianRupee
} from 'lucide-react';

export const InvoiceList = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser.role === 'admin';

  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);

  // Modal actions
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceApi.getInvoices({
        search: searchTerm,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        page,
        limit: 10
      });

      setInvoices(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      setToast({ type: 'error', message: err.message, errors: err.errors });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await invoiceApi.getAnalyticsSummary();
      if (res.data) setAnalytics(res.data);
    } catch (err) {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchAnalytics();
  }, [searchTerm, selectedStatus, page, currentUser]);

  const handleIssue = (invoice) => {
    setModalConfig({
      isOpen: true,
      title: 'Issue Invoice',
      message: `Are you sure you want to officially issue invoice ${invoice.invoiceNumber}? Once issued, financial calculations are locked.`,
      confirmText: 'Issue Invoice',
      confirmVariant: 'primary',
      onConfirm: async () => {
        try {
          await invoiceApi.issueInvoice(invoice._id);
          setToast({ type: 'success', message: `Invoice ${invoice.invoiceNumber} issued successfully!` });
          fetchInvoices();
          fetchAnalytics();
        } catch (err) {
          setToast({ type: 'error', message: err.message, errors: err.errors });
        } finally {
          setModalConfig({ isOpen: false });
        }
      }
    });
  };

  const handleCancel = (invoice) => {
    setModalConfig({
      isOpen: true,
      title: 'Cancel Invoice',
      message: `Please provide a reason to cancel invoice ${invoice.invoiceNumber}. This operation will be permanently recorded in the audit log.`,
      confirmText: 'Confirm Cancellation',
      confirmVariant: 'danger',
      requiresInput: true,
      inputLabel: 'Reason for Cancellation',
      inputPlaceholder: 'e.g., Quotation revised, customer requested cancellation',
      onConfirm: async (reason) => {
        try {
          await invoiceApi.cancelInvoice(invoice._id, reason);
          setToast({ type: 'success', message: `Invoice ${invoice.invoiceNumber} has been cancelled.` });
          fetchInvoices();
          fetchAnalytics();
        } catch (err) {
          setToast({ type: 'error', message: err.message, errors: err.errors });
        } finally {
          setModalConfig({ isOpen: false });
        }
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage subscription billings, GST breakdown, lifecycle states, and customer payments.
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/admin/invoices/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Create Manual Invoice
          </Link>
        )}
      </div>

      {/* Analytics Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Billed</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 flex items-center">
              ₹{analytics.totalBilled.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">{analytics.totalInvoices} total invoices</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total GST Tax</span>
            <div className="mt-2 text-2xl font-bold text-blue-600 flex items-center">
              ₹{analytics.totalTaxCollected.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">CGST + SGST + IGST</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Collected Revenue</span>
            <div className="mt-2 text-2xl font-bold text-emerald-600 flex items-center">
              ₹{analytics.totalPaid.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-emerald-600 font-medium mt-1 block">Reconciled payments</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outstanding Balance</span>
            <div className="mt-2 text-2xl font-bold text-rose-600 flex items-center">
              ₹{analytics.totalOutstanding.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-rose-600 font-medium mt-1 block">
              {analytics.statusCounts?.overdue || 0} overdue invoices
            </span>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search invoice #, customer..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['all', 'draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedStatus(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
          <button
            onClick={() => {
              fetchInvoices();
              fetchAnalytics();
            }}
            title="Refresh"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading invoices from MongoDB...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="font-semibold text-slate-700">No invoices found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or create a new invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Dates</th>
                  <th className="px-5 py-3.5 text-right">Taxable</th>
                  <th className="px-5 py-3.5 text-right">GST Tax</th>
                  <th className="px-5 py-3.5 text-right">Grand Total</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 font-semibold text-blue-600">
                      <Link to={`/admin/invoices/${inv._id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                      {inv.sourceReference && (
                        <span className="block text-[11px] text-slate-400 font-normal">
                          Ref: {inv.sourceReference}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{inv.customerSnapshot?.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-medium text-slate-600">
                          {inv.customerSnapshot?.state || 'Kerala'}
                        </span>
                        {inv.customerSnapshot?.gstin && (
                          <span className="text-[11px] text-slate-400">GSTIN: {inv.customerSnapshot.gstin}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      <div>Issued: {new Date(inv.issueDate).toLocaleDateString()}</div>
                      <div className="text-slate-400 mt-0.5">Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-700">
                      ₹{inv.taxableAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right text-xs">
                      <div className="font-medium text-blue-700">
                        ₹{inv.taxTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {inv.taxBreakdown?.igstTotal > 0
                          ? 'IGST'
                          : 'CGST+SGST'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="font-bold text-slate-900">
                        ₹{inv.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      {inv.outstandingAmount > 0 && inv.status !== 'cancelled' && (
                        <div className="text-[11px] text-rose-600 font-medium">
                          Bal: ₹{inv.outstandingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={inv.effectiveStatus || inv.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                          title="Print Invoice"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>

                        {isAdmin && inv.status === 'draft' && (
                          <>
                            <Link
                              to={`/admin/invoices/${inv._id}/edit`}
                              title="Edit Draft"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <FileEdit className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => handleIssue(inv)}
                              title="Issue Invoice"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {isAdmin && (inv.status === 'draft' || inv.status === 'issued') && inv.amountPaid === 0 && (
                          <button
                            onClick={() => handleCancel(inv)}
                            title="Cancel Invoice"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} invoices)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-md font-medium disabled:opacity-40 hover:bg-slate-100 transition"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-md font-medium disabled:opacity-40 hover:bg-slate-100 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation and Action Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        confirmVariant={modalConfig.confirmVariant}
        requiresInput={modalConfig.requiresInput}
        inputLabel={modalConfig.inputLabel}
        inputPlaceholder={modalConfig.inputPlaceholder}
        onConfirm={modalConfig.onConfirm}
        onClose={() => setModalConfig({ isOpen: false })}
      />

      {/* Notification Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
