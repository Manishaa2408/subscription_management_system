import React, { useState, useEffect } from 'react';
import customerService from '../../services/customerService';
import PortalLayout from '../../components/portal/PortalLayout';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { MapPin, Plus, Trash2, Check, AlertCircle, X } from 'lucide-react';

const CustomerAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [newAddr, setNewAddr] = useState({
    addressType: 'billing',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false
  });

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const res = await customerService.getPortalAddresses();
      if (res && res.data) {
        setAddresses(res.data.addresses || []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load addresses' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newAddr.addressLine1 || !newAddr.city || !newAddr.state || !newAddr.postalCode) {
      setAlert({ type: 'danger', message: 'Please fill in all required address fields.' });
      return;
    }

    try {
      setSubmitting(true);
      const prof = await customerService.getPortalProfile();
      const customerId = prof?.data?.customer?.id || prof?.data?.customer?._id;
      if (!customerId) throw new Error('Customer ID unavailable');

      await customerService.addAddress(customerId, newAddr);
      setShowAddModal(false);
      setNewAddr({
        addressType: 'billing',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false
      });
      setAlert({ type: 'success', message: 'New address added successfully!' });
      loadAddresses();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to add address' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const prof = await customerService.getPortalProfile();
      const customerId = prof?.data?.customer?.id || prof?.data?.customer?._id;
      await customerService.deleteAddress(customerId, addressId);
      setAlert({ type: 'success', message: 'Address removed successfully.' });
      loadAddresses();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to delete address' });
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const prof = await customerService.getPortalProfile();
      const customerId = prof?.data?.customer?.id || prof?.data?.customer?._id;
      await customerService.setDefaultAddress(customerId, addressId);
      setAlert({ type: 'success', message: 'Default address updated.' });
      loadAddresses();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to set default' });
    }
  };

  return (
    <PortalLayout
      title="My Addresses"
      subtitle="Manage your saved billing and shipping destination locations"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <p className="text-sm text-slate-500">
          Addresses saved here will be automatically applied to your generated subscription invoices.
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 mb-6 ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {alert.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{alert.message}</span>
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading addresses..." />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No addresses saved yet"
          description="Add your primary billing and shipping address to ensure accurate invoice generation."
          actionText="Add Address"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr._id || addr.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                      addr.addressType === 'billing'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {addr.addressType}
                  </span>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Default
                    </span>
                  )}
                </div>

                <div className="text-sm text-slate-800 space-y-0.5 mb-4">
                  <div className="font-semibold text-slate-900">{addr.addressLine1}</div>
                  {addr.addressLine2 && <div className="text-slate-500">{addr.addressLine2}</div>}
                  <div className="text-slate-600">{addr.city}, {addr.state} - {addr.postalCode}</div>
                  <div className="text-slate-400 text-xs">{addr.country}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr._id || addr.id)}
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Default for billing
                  </span>
                )}

                <button
                  onClick={() => handleDelete(addr._id || addr.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Address</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address Type</label>
                <select
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={newAddr.addressType}
                  onChange={(e) => setNewAddr((p) => ({ ...p, addressType: e.target.value }))}
                >
                  <option value="billing">Billing Address</option>
                  <option value="shipping">Shipping Address</option>
                  <option value="both">Both (Billing & Shipping)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address Line 1 *</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Street address, building, apartment"
                  value={newAddr.addressLine1}
                  onChange={(e) => setNewAddr((p) => ({ ...p, addressLine1: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address Line 2</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Landmark, suite, unit"
                  value={newAddr.addressLine2}
                  onChange={(e) => setNewAddr((p) => ({ ...p, addressLine2: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">City *</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="City"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">State *</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="State"
                    value={newAddr.state}
                    onChange={(e) => setNewAddr((p) => ({ ...p, state: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Postal Code *</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="Postal Code"
                    value={newAddr.postalCode}
                    onChange={(e) => setNewAddr((p) => ({ ...p, postalCode: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={newAddr.country}
                    onChange={(e) => setNewAddr((p) => ({ ...p, country: e.target.value }))}
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={newAddr.isDefault}
                    onChange={(e) => setNewAddr((p) => ({ ...p, isDefault: e.target.checked }))}
                  />
                  <span>Set as default address</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving Address...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default CustomerAddresses;
