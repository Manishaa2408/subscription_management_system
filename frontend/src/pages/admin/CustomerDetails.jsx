import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import customerService from '../../services/customerService';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  Receipt,
  ArrowLeft,
  Clock,
  Plus,
  ShieldCheck,
  AlertCircle,
  Edit2,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [alert, setAlert] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [custRes, notesRes, actRes] = await Promise.all([
        customerService.getCustomerById(id),
        customerService.getCustomerNotes(id).catch(() => ({ data: { notes: [] } })),
        customerService.getCustomerActivity(id).catch(() => ({ data: { activities: [] } }))
      ]);

      if (custRes && custRes.data) {
        setCustomer(custRes.data.customer);
      }
      if (notesRes && notesRes.data) {
        setNotes(notesRes.data.notes || []);
      }
      if (actRes && actRes.data) {
        setActivities(actRes.data.activities || []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load customer profile' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setNoteSubmitting(true);
      await customerService.addCustomerNote(id, { content: newNote.trim() });
      setNewNote('');
      const notesRes = await customerService.getCustomerNotes(id);
      if (notesRes && notesRes.data) {
        setNotes(notesRes.data.notes || []);
      }
      setAlert({ type: 'success', message: 'Note added successfully' });
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to add note' });
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await customerService.updateCustomerStatus(id, newStatus);
      setCustomer((prev) => ({ ...prev, status: newStatus }));
      setAlert({ type: 'success', message: `Customer status updated to '${newStatus}'` });
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update status' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm max-w-md mx-auto mb-4">
          Customer profile not found.
        </div>
        <Link
          to="/admin/customers"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
        >
          Return to Customer Directory
        </Link>
      </div>
    );
  }

  const isBusiness = customer.customerType === 'business';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button & Action Header */}
      <div>
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-base flex items-center justify-center flex-shrink-0 shadow-xs">
              {(customer.displayName || 'C').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {customer.displayName}
                </h1>
                <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                  {customer.customerCode}
                </span>
                {customer.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isBusiness ? customer.companyName || 'Corporate Account' : 'Individual Account'} &bull; Created {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/admin/customers/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Link>

            <button
              onClick={() => handleStatusChange(customer.status === 'active' ? 'inactive' : 'active')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition ${
                customer.status === 'active'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {customer.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="text-current opacity-70 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overview & Info
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'notes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Customer Notes</span>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
            {notes.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'activity'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Audit Activity</span>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
            {activities.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Primary Details Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Contact & Identification
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Email Address</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.email}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Phone Number</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.phone || 'Not recorded'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Tax Identification (GSTIN)</span>
                  <div className="font-mono font-semibold text-slate-800">
                    {customer.gstin || 'Unregistered / Exempt'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Account Category</span>
                  <div className="font-semibold text-slate-800 capitalize">
                    {customer.customerType || 'Individual'}
                  </div>
                </div>
              </div>

              {customer.description && (
                <div className="pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 block mb-1">Account Notes</span>
                  <p className="text-slate-700 leading-relaxed">{customer.description}</p>
                </div>
              )}
            </div>

            {/* Address Information Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Billing Address & Tax Jurisdiction</span>
              </h2>

              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">{customer.billingAddress?.addressLine1 || 'No street specified'}</p>
                {customer.billingAddress?.addressLine2 && <p>{customer.billingAddress.addressLine2}</p>}
                <p>
                  {[
                    customer.billingAddress?.city,
                    customer.billingAddress?.state,
                    customer.billingAddress?.postalCode
                  ].filter(Boolean).join(', ') || 'Kerala, India'}
                </p>
                <p className="text-slate-400">{customer.billingAddress?.country || 'India'}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Links Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Quick Shortcuts
              </h2>

              <div className="space-y-2 text-xs">
                <Link
                  to={`/quotations/create?customerId=${id}`}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition font-semibold text-slate-700 hover:text-blue-700"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    New Quotation
                  </span>
                  <span>&rarr;</span>
                </Link>

                <Link
                  to={`/admin/invoices/create?customerId=${id}`}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition font-semibold text-slate-700 hover:text-blue-700"
                >
                  <span className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    Generate Invoice
                  </span>
                  <span>&rarr;</span>
                </Link>

                <Link
                  to={`/admin/payments/create?customerId=${id}`}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition font-semibold text-slate-700 hover:text-blue-700"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    Record Payment
                  </span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <form onSubmit={handleAddNote} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Add Account Note
            </h2>
            <textarea
              rows={3}
              className="w-full p-3 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800"
              placeholder="Record a call summary, special billing instructions, or customer request..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              required
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={noteSubmitting}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
              >
                {noteSubmitting ? 'Saving...' : 'Post Note'}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No notes recorded yet.</p>
            ) : (
              notes.map((n, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span className="font-semibold text-slate-700">{n.author || 'Team Member'}</span>
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Activity */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Customer Audit Log
          </h2>
          {activities.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No recent activity logs.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 last:border-none">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold text-slate-800">{a.action || 'Activity recorded'}</span>
                    <p className="text-slate-500 mt-0.5">{a.details || a.description || 'System event'}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{new Date(a.timestamp || a.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerDetails;
