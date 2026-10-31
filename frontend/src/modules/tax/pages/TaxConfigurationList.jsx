import React, { useState, useEffect } from 'react';
import { taxApi } from '../../../services/taxApi';
import { useAuth } from '../../../context/AuthContext';
import { Toast } from '../../../components/Toast';
import {
  Percent,
  Plus,
  Shield,
  CheckCircle,
  XCircle,
  Calculator,
  RefreshCw,
  Info
} from 'lucide-react';

export const TaxConfigurationList = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser.role === 'admin';

  const [taxConfigs, setTaxConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // New Tax Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    rate: '',
    description: '',
    applicability: 'services'
  });

  // Interactive Calculator Widget
  const [calcInput, setCalcInput] = useState({
    amount: 10000,
    rate: 18,
    isInterState: false
  });

  const fetchTaxConfigs = async () => {
    try {
      setLoading(true);
      const res = await taxApi.getTaxConfigurations();
      setTaxConfigs(res.data || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxConfigs();
  }, [currentUser]);

  const handleToggleStatus = async (config) => {
    if (!isAdmin) {
      setToast({ type: 'error', message: 'Staff members have read-only access to tax configurations.' });
      return;
    }

    try {
      await taxApi.toggleTaxStatus(config._id, !config.isActive);
      setToast({
        type: 'success',
        message: `${config.name} is now ${!config.isActive ? 'active' : 'inactive'}.`
      });
      fetchTaxConfigs();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleCreateTax = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setToast({ type: 'error', message: 'Admin role required to configure tax rates.' });
      return;
    }

    try {
      await taxApi.createTaxConfiguration({
        ...formData,
        rate: Number(formData.rate)
      });

      setToast({ type: 'success', message: `Tax configuration "${formData.name}" created!` });
      setShowAddForm(false);
      setFormData({ name: '', code: '', rate: '', description: '', applicability: 'services' });
      fetchTaxConfigs();
    } catch (err) {
      setToast({ type: 'error', message: err.message, errors: err.errors });
    }
  };

  // Calculator Math
  const calcTaxable = Number(calcInput.amount) || 0;
  const calcRate = Number(calcInput.rate) || 0;
  const calcTotalTax = Math.round((calcTaxable * calcRate) / 100 * 100) / 100;
  const calcCGST = calcInput.isInterState ? 0 : Math.round(calcTotalTax / 2 * 100) / 100;
  const calcSGST = calcInput.isInterState ? 0 : Math.round((calcTotalTax - calcCGST) * 100) / 100;
  const calcIGST = calcInput.isInterState ? calcTotalTax : 0;
  const calcGrandTotal = Math.round((calcTaxable + calcTotalTax) * 100) / 100;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Percent className="w-6 h-6 text-blue-600" /> Statutory Tax & GST Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure Indian GST rates (CGST, SGST, IGST) and rules applied automatically to subscription invoices.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Cancel Form' : 'New Tax Rate'}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium">
            <Shield className="w-3.5 h-3.5" /> Staff View (Read-Only)
          </div>
        )}
      </div>

      {/* Add New Tax Configuration Form Modal/Card */}
      {showAddForm && isAdmin && (
        <form
          onSubmit={handleCreateTax}
          className="bg-white p-6 rounded-2xl border border-blue-200 shadow-md space-y-4 animate-fade-in"
        >
          <h3 className="text-base font-bold text-slate-900">Add Tax Rate Configuration</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tax Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., GST 18% Standard"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tax Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., GST18"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                className="w-full px-3 py-2 text-sm uppercase font-mono border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rate (%) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="e.g., 18"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="Statutory rate for cloud and software services"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Applicability</label>
              <select
                value={formData.applicability}
                onChange={(e) => setFormData({ ...formData, applicability: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="services">Services (Software, Cloud)</option>
                <option value="goods">Goods (Hardware, Physical)</option>
                <option value="all">All Goods & Services</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Save Tax Rate
            </button>
          </div>
        </form>
      )}

      {/* Tax Configurations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Active Statutory Rates</h3>
          <span className="text-xs text-slate-500">{taxConfigs.length} configured tiers</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading configurations...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Tax Name</th>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Rate</th>
                  <th className="px-5 py-3.5">Applicability</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  {isAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxConfigs.map((tax) => (
                  <tr key={tax._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-semibold text-slate-900">{tax.name}</td>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-blue-600">{tax.code}</td>
                    <td className="px-5 py-4 font-bold text-slate-800 text-base">{tax.rate}%</td>
                    <td className="px-5 py-4 text-xs capitalize text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                        {tax.applicability}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 max-w-xs">{tax.description || '—'}</td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          tax.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {tax.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(tax)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                            tax.isActive
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {tax.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive GST Simulation Calculator */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" /> GST Split Simulator (Intra-State vs Inter-State)
          </h3>
          <span className="text-xs text-slate-400">Real-time formula validation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Taxable Amount (₹)</label>
            <input
              type="number"
              value={calcInput.amount}
              onChange={(e) => setCalcInput({ ...calcInput, amount: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Applicable GST Rate (%)</label>
            <select
              value={calcInput.rate}
              onChange={(e) => setCalcInput({ ...calcInput, rate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="18">GST 18% (Standard)</option>
              <option value="12">GST 12% (Reduced)</option>
              <option value="5">GST 5% (Concessional)</option>
              <option value="28">GST 28% (Luxury)</option>
              <option value="0">GST 0% (Exempt)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Type</label>
            <select
              value={calcInput.isInterState ? 'inter' : 'intra'}
              onChange={(e) => setCalcInput({ ...calcInput, isInterState: e.target.value === 'inter' })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="intra">Intra-State (Kerala → Kerala: CGST + SGST)</option>
              <option value="inter">Inter-State (Kerala → Karnataka/TN: IGST)</option>
            </select>
          </div>
        </div>

        {/* Calculation Result */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500">Taxable Value:</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">₹{calcTaxable.toLocaleString('en-IN')}</div>
          </div>

          {calcInput.isInterState ? (
            <div>
              <span className="text-indigo-600 font-semibold">IGST ({calcRate}%):</span>
              <div className="font-bold text-indigo-700 text-sm mt-0.5">₹{calcIGST.toLocaleString('en-IN')}</div>
            </div>
          ) : (
            <>
              <div>
                <span className="text-blue-600 font-semibold">CGST ({calcRate / 2}%):</span>
                <div className="font-bold text-blue-700 text-sm mt-0.5">₹{calcCGST.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span className="text-blue-600 font-semibold">SGST ({calcRate / 2}%):</span>
                <div className="font-bold text-blue-700 text-sm mt-0.5">₹{calcSGST.toLocaleString('en-IN')}</div>
              </div>
            </>
          )}

          <div>
            <span className="text-slate-500 font-semibold">Invoice Grand Total:</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">₹{calcGrandTotal.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
