import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { invoiceApi } from '../../../services/invoiceApi';
import { taxApi } from '../../../services/taxApi';
import { Toast } from '../../../components/Toast';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Calculator,
  UserCheck,
  Building,
  Info
} from 'lucide-react';

export const CreateInvoice = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [taxConfigs, setTaxConfigs] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Standard net 15 terms. Thank you for your business with Brightloop.');

  const [items, setItems] = useState([
    {
      itemName: 'Brightloop Pro Cloud SaaS Subscription',
      description: 'Monthly cloud hosting and subscription package',
      quantity: 1,
      unitPrice: 5000,
      discountType: 'percentage',
      discountValue: 0,
      taxCode: 'GST18',
      taxRate: 18
    }
  ]);

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [custRes, taxRes] = await Promise.all([
          invoiceApi.getCustomersList(),
          taxApi.getTaxConfigurations({ isActive: true })
        ]);
        setCustomers(custRes.data || []);
        if (custRes.data && custRes.data.length > 0) {
          setSelectedCustomerId(custRes.data[0].id);
        }
        setTaxConfigs(taxRes.data || []);
      } catch (err) {
        setToast({ type: 'error', message: 'Failed to load initial customers and tax configs.' });
      }
    };
    loadInitialData();
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const supplierState = 'Kerala';
  const customerState = selectedCustomer?.state || 'Kerala';
  const isIntraState = supplierState.toLowerCase() === customerState.toLowerCase();

  // Recalculate preview when items or customer changes
  useEffect(() => {
    if (!items || items.length === 0) return;

    const calc = () => {
      let subtotal = 0;
      let discountTotal = 0;
      let taxableAmount = 0;
      let totalTax = 0;
      let cgstTotal = 0;
      let sgstTotal = 0;
      let igstTotal = 0;

      items.forEach((item) => {
        const qty = Number(item.quantity) || 1;
        const unit = Number(item.unitPrice) || 0;
        const gross = qty * unit;
        let disc = 0;

        if (item.discountType === 'fixed') {
          disc = Math.min(gross, Number(item.discountValue) || 0);
        } else {
          disc = (gross * (Number(item.discountValue) || 0)) / 100;
        }

        const taxable = Math.max(0, gross - disc);
        const rate = Number(item.taxRate) || 18;
        const tax = (taxable * rate) / 100;

        subtotal += gross;
        discountTotal += disc;
        taxableAmount += taxable;
        totalTax += tax;

        if (isIntraState) {
          cgstTotal += tax / 2;
          sgstTotal += tax / 2;
        } else {
          igstTotal += tax;
        }
      });

      setPreview({
        subtotal: Math.round(subtotal * 100) / 100,
        discountTotal: Math.round(discountTotal * 100) / 100,
        taxableAmount: Math.round(taxableAmount * 100) / 100,
        cgstTotal: Math.round(cgstTotal * 100) / 100,
        sgstTotal: Math.round(sgstTotal * 100) / 100,
        igstTotal: Math.round(igstTotal * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        grandTotal: Math.round((taxableAmount + totalTax) * 100) / 100
      });
    };

    calc();
  }, [items, selectedCustomerId, isIntraState]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'taxCode') {
      const cfg = taxConfigs.find((t) => t.code === value);
      if (cfg) {
        updated[index].taxRate = cfg.rate;
      }
    }

    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        itemName: 'Additional Software Service / Addon',
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
    if (!selectedCustomerId) {
      setToast({ type: 'error', message: 'Please select a customer.' });
      return;
    }

    try {
      setLoading(true);
      const res = await invoiceApi.createInvoice({
        customerId: selectedCustomerId,
        issueDate,
        dueDate,
        notes,
        items
      });

      setToast({ type: 'success', message: 'Draft invoice created successfully!' });
      setTimeout(() => {
        navigate(`/admin/invoices/${res.data._id}`);
      }, 800);
    } catch (err) {
      setToast({ type: 'error', message: err.message, errors: err.errors });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/invoices"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create New Invoice</h1>
            <p className="text-xs text-slate-500">Draft invoices can be reviewed and edited prior to issuance.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Dates Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" /> Customer & Billing Dates
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Customer <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
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

          {selectedCustomer && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <div>
                <span className="font-bold">Billing State:</span> {customerState} &bull;{' '}
                <span className="font-bold">GSTIN:</span> {selectedCustomer.gstin || 'Unregistered'}
              </div>
              <span className="px-2 py-0.5 bg-blue-600 text-white font-semibold rounded text-[11px]">
                {isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
              </span>
            </div>
          )}
        </div>

        {/* Line Items Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Line Items & Taxes</h3>
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
              <div
                key={idx}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative"
              >
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
                      placeholder="e.g., Brightloop Monthly SaaS"
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Discount (% or Fixed)
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        value={item.discountType}
                        onChange={(e) => handleItemChange(idx, 'discountType', e.target.value)}
                        className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">₹</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={item.discountValue}
                        onChange={(e) => handleItemChange(idx, 'discountValue', e.target.value)}
                        placeholder="Discount value"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Applicable GST Tax
                    </label>
                    <select
                      value={item.taxCode}
                      onChange={(e) => handleItemChange(idx, 'taxCode', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="GST18">GST 18% (Standard SaaS)</option>
                      <option value="GST12">GST 12% (IT Hardware)</option>
                      <option value="GST5">GST 5% (Concessional)</option>
                      <option value="GST28">GST 28% (Luxury)</option>
                      <option value="GST0">GST 0% (Exempt)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="Line notes or license details"
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Calculation Preview & Totals */}
        {preview && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" /> Live Calculation Preview (Backend Validated)
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500">Gross Subtotal:</span>
                <div className="text-base font-bold text-slate-900 mt-1">₹{preview.subtotal}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500">Discounts:</span>
                <div className="text-base font-bold text-rose-600 mt-1">-₹{preview.discountTotal}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500">Taxable Amount:</span>
                <div className="text-base font-bold text-slate-900 mt-1">₹{preview.taxableAmount}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-blue-700 font-semibold">
                  GST Tax ({isIntraState ? 'CGST+SGST' : 'IGST'}):
                </span>
                <div className="text-base font-bold text-blue-700 mt-1">₹{preview.totalTax}</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-lg font-bold text-slate-900">
              <span>Estimated Grand Total:</span>
              <span className="text-xl text-blue-600">₹{preview.grandTotal}</span>
            </div>
          </div>
        )}

        {/* Notes and Terms */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Invoice Notes & Payment Instructions
          </label>
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
            to="/admin/invoices"
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving Draft...' : 'Save Draft Invoice'}
          </button>
        </div>
      </form>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
