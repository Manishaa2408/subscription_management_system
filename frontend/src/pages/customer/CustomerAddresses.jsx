import React, { useState, useEffect } from 'react';
import customerService from '../../services/customerService';
import PortalLayout from '../../components/portal/PortalLayout';
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
      // Fetch customer profile to get customer ID
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
          Addresses saved here will be automatically applied to your generated subscription invoices.
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ width: 'auto' }}
        >
          <Plus size={16} />
          <span>Add Address</span>
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{alert.message}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-primary" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--slate-500)' }}>Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <MapPin size={36} color="var(--slate-400)" style={{ margin: '0 auto 0.75rem' }} />
          <h4 style={{ color: 'var(--slate-700)' }}>No addresses saved yet</h4>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
            Add your primary billing and shipping address to ensure accurate invoice generation.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ width: 'auto' }}
          >
            Add Address
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {addresses.map((addr) => (
            <div key={addr._id || addr.id} className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span
                    className="nav-badge"
                    style={{
                      background: addr.addressType === 'billing' ? '#eff6ff' : '#ecfdf5',
                      color: addr.addressType === 'billing' ? '#1d4ed8' : '#047857'
                    }}
                  >
                    {addr.addressType}
                  </span>
                  {addr.isDefault && <span className="badge-active">Default</span>}
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--slate-800)', lineHeight: '1.5', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{addr.addressLine1}</div>
                  {addr.addressLine2 && <div style={{ color: 'var(--slate-600)' }}>{addr.addressLine2}</div>}
                  <div>{addr.city}, {addr.state} - {addr.postalCode}</div>
                  <div style={{ color: 'var(--slate-500)' }}>{addr.country}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--slate-100)', paddingTop: '0.75rem' }}>
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr._id || addr.id)}
                    className="btn btn-secondary"
                    style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.785rem' }}
                  >
                    Set as Default
                  </button>
                ) : <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Default for billing</span>}

                <button
                  onClick={() => handleDelete(addr._id || addr.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.4rem' }}
                  title="Delete address"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Address</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Address Type</label>
                <select
                  className="form-input"
                  value={newAddr.addressType}
                  onChange={(e) => setNewAddr((p) => ({ ...p, addressType: e.target.value }))}
                >
                  <option value="billing">Billing Address</option>
                  <option value="shipping">Shipping Address</option>
                  <option value="both">Both (Billing & Shipping)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Address Line 1 *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Street address, building, apartment"
                  value={newAddr.addressLine1}
                  onChange={(e) => setNewAddr((p) => ({ ...p, addressLine1: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address Line 2</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Landmark, suite, unit"
                  value={newAddr.addressLine2}
                  onChange={(e) => setNewAddr((p) => ({ ...p, addressLine2: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="City"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="State"
                    value={newAddr.state}
                    onChange={(e) => setNewAddr((p) => ({ ...p, state: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Postal Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Postal Code"
                    value={newAddr.postalCode}
                    onChange={(e) => setNewAddr((p) => ({ ...p, postalCode: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newAddr.country}
                    onChange={(e) => setNewAddr((p) => ({ ...p, country: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={newAddr.isDefault}
                    onChange={(e) => setNewAddr((p) => ({ ...p, isDefault: e.target.checked }))}
                  />
                  <span>Set as default address for this classification</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ width: 'auto' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: 'auto' }}
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
