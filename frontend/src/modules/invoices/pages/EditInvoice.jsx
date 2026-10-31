import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoiceApi } from '../../../services/invoiceApi';
import { taxApi } from '../../../services/taxApi';
import { Toast } from '../../../components/Toast';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Lock,
  Clock
} from 'lucide-react';

export const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [taxConfigs, setTaxConfigs] = useState([]);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invRes, taxRes] = await Promise.all([
          invoiceApi.getInvoiceById(id),
          taxApi.getTaxConfigurations({ isActive: true })
        ]);

        const inv = invRes.data;
        setInvoice(inv);
        setTaxConfigs(taxRes.data || []);

        if (inv) {
          setNotes(inv.notes || '');
          setDueDate(inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '');
          setItems(inv.items || []);
        }
      } catch (err) {
        setToast({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <Clock className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
        Loading invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold">Invoice not found</h2>
      </div>
    );
  }

  // Business Rule: Only draft invoices can be edited!
  if (invoice.status !== 'draft') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-4">
          <Lock className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-amber-900">Invoice Cannot Be Edited</h2>
          <p className="text-sm text-amber-800 max-w-lg mx-auto">
            Invoice <strong>{invoice.invoiceNumber}</strong> is currently in{' '}
            <span className="font-semibold uppercase">{invoice.status}</span> status. Per financial compliance
            and system rules, only <strong>draft</strong> invoices can be edited. Issued and finalized invoice snapshots
            are locked to preserve audit integrity.
          </p>
          <div>
            <Link
              to={`/admin/invoices/${invoice._id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Invoice Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'taxCode') {
      const cfg = taxConfigs.find((t) => t.code === value);
      if (cfg) updated[index].taxRate = cfg.rate;
    }
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        itemName: 'Additional Service Item',
        description: '',
        quantity: 1,
        unitPrice: 1000,
        discountType: 'percentage',
        discountValue: 0,
        taxCode: 'GST18',
        taxRate: 18
      }
    ]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      setToast({ type: 'error', message: 'Invoice must contain at least one line item.' });
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await invoiceApi.updateInvoice(invoice._id, {
        notes,
        dueDate,
        items
      });

      setToast({ type: 'success', message: 'Draft invoice updated successfully!' });
      setTimeout(() => {
        navigate(`/admin/invoices/${invoice._id}`);
      }, 800);
    } catch (err) {
      setToast({ type: 'error', message: err.message, errors: err.errors });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/invoices/${invoice._id}`}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Draft Invoice</h1>
            <p className="text-xs text-slate-500">
              Editing {invoice.invoiceNumber} for {invoice.customerSnapshot?.name}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Due Date & Customer Snapshot */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
              <input
                type="text"
                disabled
                value={`${invoice.customerSnapshot?.name} (${invoice.customerSnapshot?.state})`}
                className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded-lg text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Line Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Item #{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Item Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Quantity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Unit Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Discount (% or Fixed)
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        value={item.discountType || 'percentage'}
                        onChange={(e) => handleItemChange(idx, 'discountType', e.target.value)}
                        className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">₹</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={item.discountValue || 0}
                        onChange={(e) => handleItemChange(idx, 'discountValue', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      GST Tax Code
                    </label>
                    <select
                      value={item.taxCode || 'GST18'}
                      onChange={(e) => handleItemChange(idx, 'taxCode', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="GST18">GST 18%</option>
                      <option value="GST12">GST 12%</option>
                      <option value="GST5">GST 5%</option>
                      <option value="GST28">GST 28%</option>
                      <option value="GST0">GST 0%</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to={`/admin/invoices/${invoice._id}`}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Update Draft Invoice'}
          </button>
        </div>
      </form>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
