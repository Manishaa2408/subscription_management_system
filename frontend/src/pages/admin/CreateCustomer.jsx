import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import customerService from '../../services/customerService';
import Navbar from '../../components/common/Navbar';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const CreateCustomer = () => {
  const navigate = useNavigate();
  const [customerType, setCustomerType] = useState('individual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    companyName: '',
    businessRegistrationNumber: '',
    gstin: '',
    businessType: '',
    industry: '',
    website: '',
    description: '',
    billingAddress: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India'
    },
    shippingAddress: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India'
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (type, field, value) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [type]: {
          ...prev[type],
          [field]: value
        }
      };

      if (type === 'billingAddress' && sameAsBilling) {
        updated.shippingAddress = {
          ...updated.billingAddress
        };
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.email.trim()) {
      setErrorMessage('Customer email address is required.');
      return;
    }

    if (customerType === 'business' && !formData.companyName.trim()) {
      setErrorMessage('Company name is required for business customers.');
      return;
    }

    if (!formData.billingAddress.city || !formData.billingAddress.state) {
      setErrorMessage('Billing city and state are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        customerType,
        shippingAddress: sameAsBilling ? formData.billingAddress : formData.shippingAddress
      };

      await customerService.createCustomer(payload);
      navigate('/admin/customers');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create customer profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content" style={{ maxWidth: '900px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/admin/customers"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--slate-600)',
              fontSize: '0.875rem',
              marginBottom: '0.75rem'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Customers</span>
          </Link>
          <h1 className="page-title">New Customer Profile</h1>
          <p className="page-subtitle">
            Configure contact details, business metadata, and billing locations for Brightloop Software clients.
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Customer Type Selector */}
        <div className="dashboard-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <label className="form-label">Select Customer Classification</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setCustomerType('individual')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: '8px',
                border: `2px solid ${customerType === 'individual' ? 'var(--primary)' : 'var(--slate-200)'}`,
                background: customerType === 'individual' ? '#eff6ff' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <User size={24} color={customerType === 'individual' ? 'var(--primary)' : 'var(--slate-500)'} />
              <div>
                <strong style={{ display: 'block', color: 'var(--slate-900)' }}>Individual Customer</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                  Personal accounts, freelancers, and individual license holders
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCustomerType('business')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: '8px',
                border: `2px solid ${customerType === 'business' ? 'var(--primary)' : 'var(--slate-200)'}`,
                background: customerType === 'business' ? '#eff6ff' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Building2 size={24} color={customerType === 'business' ? 'var(--primary)' : 'var(--slate-500)'} />
              <div>
                <strong style={{ display: 'block', color: 'var(--slate-900)' }}>Business / Corporate</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                  Companies, registered entities, and GST invoicing accounts
                </span>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Contact Details Card */}
          <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '0.75rem' }}>
              Contact Information
            </h3>

            {customerType === 'business' && (
              <div className="form-group">
                <label className="form-label">Company / Legal Entity Name *</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-input"
                  placeholder="e.g. Acme Innovations Pvt Ltd"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-input"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-input"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="client@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Primary Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Alternate Phone</label>
                <input
                  type="tel"
                  name="alternatePhone"
                  className="form-input"
                  placeholder="Optional secondary phone"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  name="displayName"
                  className="form-input"
                  placeholder="Auto-derived if left empty"
                  value={formData.displayName}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Business Details Card (if Business) */}
          {customerType === 'business' && (
            <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '0.75rem' }}>
                Corporate & Tax Identification
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">GSTIN (15 characters)</label>
                  <input
                    type="text"
                    name="gstin"
                    className="form-input"
                    placeholder="e.g. 32AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Registration / CIN</label>
                  <input
                    type="text"
                    name="businessRegistrationNumber"
                    className="form-input"
                    placeholder="CIN / LLPIN"
                    value={formData.businessRegistrationNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    className="form-input"
                    placeholder="IT, Logistics, Healthcare"
                    value={formData.industry}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Type</label>
                  <input
                    type="text"
                    name="businessType"
                    className="form-input"
                    placeholder="Private Ltd, LLP, Partnership"
                    value={formData.businessType}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    name="website"
                    className="form-input"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Billing Address Card */}
          <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '0.75rem' }}>
              Billing Address
            </h3>

            <div className="form-group">
              <label className="form-label">Address Line 1 *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Street address, building, floor"
                value={formData.billingAddress.addressLine1}
                onChange={(e) => handleAddressChange('billingAddress', 'addressLine1', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address Line 2</label>
              <input
                type="text"
                className="form-input"
                placeholder="Landmark, suite, unit"
                value={formData.billingAddress.addressLine2}
                onChange={(e) => handleAddressChange('billingAddress', 'addressLine2', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="City"
                  value={formData.billingAddress.city}
                  onChange={(e) => handleAddressChange('billingAddress', 'city', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="State"
                  value={formData.billingAddress.state}
                  onChange={(e) => handleAddressChange('billingAddress', 'state', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Postal Code *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="682030"
                  value={formData.billingAddress.postalCode}
                  onChange={(e) => handleAddressChange('billingAddress', 'postalCode', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.billingAddress.country}
                  onChange={(e) => handleAddressChange('billingAddress', 'country', e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => {
                    setSameAsBilling(e.target.checked);
                    if (e.target.checked) {
                      setFormData((p) => ({ ...p, shippingAddress: { ...p.billingAddress } }));
                    }
                  }}
                />
                <span>Shipping address is identical to billing address</span>
              </label>
            </div>
          </div>

          {/* Shipping Address (if different) */}
          {!sameAsBilling && (
            <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '0.75rem' }}>
                Shipping Address
              </h3>

              <div className="form-group">
                <label className="form-label">Address Line 1</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.shippingAddress.addressLine1}
                  onChange={(e) => handleAddressChange('shippingAddress', 'addressLine1', e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.shippingAddress.city}
                    onChange={(e) => handleAddressChange('shippingAddress', 'city', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.shippingAddress.state}
                    onChange={(e) => handleAddressChange('shippingAddress', 'state', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Postal Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.shippingAddress.postalCode}
                    onChange={(e) => handleAddressChange('shippingAddress', 'postalCode', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.shippingAddress.country}
                    onChange={(e) => handleAddressChange('shippingAddress', 'country', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Link to="/admin/customers" className="btn btn-secondary" style={{ width: 'auto' }}>
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: 'auto' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Profile...' : 'Create Customer Profile'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateCustomer;
