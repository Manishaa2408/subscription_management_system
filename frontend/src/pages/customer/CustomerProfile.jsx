import React, { useState, useEffect } from 'react';
import customerService from '../../services/customerService';
import PortalLayout from '../../components/portal/PortalLayout';
import { User, Phone, Mail, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';

const CustomerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    alternatePhone: '',
    website: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await customerService.getPortalProfile();
        if (res && res.data && res.data.customer) {
          const c = res.data.customer;
          setProfile(c);
          setFormData({
            displayName: c.displayName || '',
            phone: c.phone || '',
            alternatePhone: c.alternatePhone || '',
            website: c.website || ''
          });
        }
      } catch (err) {
        setAlert({ type: 'danger', message: err.message || 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    try {
      setIsSubmitting(true);
      const res = await customerService.updatePortalProfile(formData);
      if (res && res.data) {
        setProfile(res.data.customer);
        setAlert({ type: 'success', message: 'Profile details updated successfully!' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update profile' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout title="My Profile" subtitle="Manage your personal and contact details">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner spinner-primary" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--slate-500)' }}>Loading profile...</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title="My Profile"
      subtitle="Manage your personal contact details and business references"
    >
      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: '1.5rem' }}>
          {alert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      <div style={{ maxWidth: '750px' }}>
        {/* Account Snapshot */}
        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 700
              }}
            >
              {(profile?.displayName || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>{profile?.displayName}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                <span className="nav-badge badge-customer">Customer</span>
                <span className="badge-active">{profile?.status || 'Active'}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--slate-200)',
              fontSize: '0.875rem'
            }}
          >
            <div>
              <span style={{ color: 'var(--slate-500)' }}>Customer Code:</span>{' '}
              <code>{profile?.customerCode || 'CUST-PORTAL'}</code>
            </div>
            <div>
              <span style={{ color: 'var(--slate-500)' }}>Classification:</span>{' '}
              <strong style={{ textTransform: 'capitalize' }}>{profile?.customerType || 'Individual'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--slate-500)' }}>Registered Email:</span>{' '}
              <strong>{profile?.email}</strong>
            </div>
            {profile?.gstin && (
              <div>
                <span style={{ color: 'var(--slate-500)' }}>GSTIN:</span> <code>{profile.gstin}</code>
              </div>
            )}
          </div>
        </div>

        {/* Edit Permitted Fields */}
        <form onSubmit={handleSubmit} className="dashboard-card">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '0.5rem' }}>
            Update Contact Details
          </h3>

          <div className="form-group">
            <label className="form-label">Display Name *</label>
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
            <div className="form-group">
              <label className="form-label">Alternate Phone</label>
              <input
                type="tel"
                name="alternatePhone"
                className="form-input"
                placeholder="+91 9876543211"
                value={formData.alternatePhone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Website / Portfolio</label>
            <input
              type="url"
              name="website"
              className="form-input"
              placeholder="https://mywebsite.com"
              value={formData.website}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: 'auto' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
};

export default CustomerProfile;
