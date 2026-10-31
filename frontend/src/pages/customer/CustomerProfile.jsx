import React, { useState, useEffect } from 'react';
import customerService from '../../services/customerService';
import PortalLayout from '../../components/portal/PortalLayout';
import { LoadingState } from '../../components/common/LoadingState';
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
        <LoadingState message="Loading profile..." />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title="My Profile"
      subtitle="Manage your personal contact details and business references"
    >
      {alert && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 mb-6 ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {alert.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{alert.message}</span>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Account Snapshot Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
              {(profile?.displayName || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{profile?.displayName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Customer
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {profile?.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block mb-0.5">Customer Code</span>
              <span className="font-mono font-medium text-slate-800">{profile?.customerCode || 'CUST-PORTAL'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Classification</span>
              <span className="font-medium text-slate-800 capitalize">{profile?.customerType || 'Individual'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Registered Email</span>
              <span className="font-medium text-slate-800">{profile?.email}</span>
            </div>
            {profile?.gstin && (
              <div>
                <span className="text-slate-400 block mb-0.5">GSTIN</span>
                <span className="font-mono font-medium text-slate-800">{profile.gstin}</span>
              </div>
            )}
          </div>
        </div>

        {/* Edit Permitted Fields */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Update Contact Details
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Display Name *</label>
            <input
              type="text"
              name="displayName"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.displayName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Primary Phone</label>
              <input
                type="tel"
                name="phone"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Alternate Phone</label>
              <input
                type="tel"
                name="alternatePhone"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="+91 9876543211"
                value={formData.alternatePhone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Website / Business URL</label>
            <input
              type="url"
              name="website"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="https://example.com"
              value={formData.website}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-50"
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
