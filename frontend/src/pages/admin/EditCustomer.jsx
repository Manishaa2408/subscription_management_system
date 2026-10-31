import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import customerService from '../../services/customerService';
import Navbar from '../../components/common/Navbar';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const EditCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    phone: '',
    alternatePhone: '',
    website: '',
    industry: '',
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

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const res = await customerService.getCustomerById(id);
        if (res && res.data && res.data.customer) {
          const c = res.data.customer;
          setFormData({
            firstName: c.firstName || '',
            lastName: c.lastName || '',
            displayName: c.displayName || '',
            phone: c.phone || '',
            alternatePhone: c.alternatePhone || '',
            website: c.website || '',
            industry: c.industry || '',
            description: c.description || '',
            billingAddress: c.billingAddress || {
              addressLine1: '',
              addressLine2: '',
              city: '',
              state: '',
              postalCode: '',
              country: 'India'
            },
            shippingAddress: c.shippingAddress || {
              addressLine1: '',
              addressLine2: '',
              city: '',
              state: '',
              postalCode: '',
              country: 'India'
            }
          });
        }
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load customer profile');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (type, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      setIsSubmitting(true);
      await customerService.updateCustomer(id, formData);
      navigate(`/admin/customers/${id}`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update customer profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner spinner-primary" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--slate-500)' }}>Loading customer details...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content" style={{ maxWidth: '850px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to={`/admin/customers/${id}`}
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
            <span>Cancel and Return</span>
          </Link>
          <h1 className="page-title">Edit Customer Profile</h1>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '0.5rem' }}>
              General Information
            </h3>

            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                name="displayName"
                className="form-input"
                value={formData.displayName}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-input"
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
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Alternate Phone</label>
                <input
                  type="tel"
                  name="alternatePhone"
                  className="form-input"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Website</label>
                <input
                  type="url"
                  name="website"
                  className="form-input"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Industry</label>
                <input
                  type="text"
                  name="industry"
                  className="form-input"
                  value={formData.industry}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Profile Description / Notes</label>
              <textarea
                name="description"
                className="form-input"
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Billing Address Card */}
          <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '0.5rem' }}>
              Billing Address
            </h3>

            <div className="form-group">
              <label className="form-label">Address Line 1</label>
              <input
                type="text"
                className="form-input"
                value={formData.billingAddress.addressLine1}
                onChange={(e) => handleAddressChange('billingAddress', 'addressLine1', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.billingAddress.city}
                  onChange={(e) => handleAddressChange('billingAddress', 'city', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.billingAddress.state}
                  onChange={(e) => handleAddressChange('billingAddress', 'state', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Postal Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.billingAddress.postalCode}
                  onChange={(e) => handleAddressChange('billingAddress', 'postalCode', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Link to={`/admin/customers/${id}`} className="btn btn-secondary" style={{ width: 'auto' }}>
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: 'auto' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditCustomer;
