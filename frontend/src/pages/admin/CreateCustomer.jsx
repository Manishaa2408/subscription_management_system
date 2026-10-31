import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import customerService from '../../services/customerService';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Save,
  Briefcase
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
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'firstName' || name === 'lastName' || name === 'companyName') {
        if (customerType === 'business' && updated.companyName) {
          updated.displayName = updated.companyName;
        } else if (customerType === 'individual') {
          updated.displayName = `${updated.firstName || ''} ${updated.lastName || ''}`.trim();
        }
      }
      return updated;
    });
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

    if (!formData.displayName.trim() || !formData.email.trim()) {
      setErrorMessage('Please provide a display name and valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        customerType,
        shippingAddress: sameAsBilling ? formData.billingAddress : formData.shippingAddress
      };

      const res = await customerService.createCustomer(payload);
      const newId = res.data?.customer?._id || res.data?.customer?.id;
      navigate(newId ? `/admin/customers/${newId}` : '/admin/customers');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create customer profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Customer Account</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Register an enterprise business or individual subscription subscriber
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Account Type Selector (Sleek Segmented Control) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Customer Account Type
          </span>
          <p className="text-xs text-slate-400 mt-0.5">Select whether this account is an individual or registered business</p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setCustomerType('individual')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition ${
              customerType === 'individual'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Individual</span>
          </button>
          <button
            type="button"
            onClick={() => setCustomerType('business')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition ${
              customerType === 'business'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Corporate / Business</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identity & Profile */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Identity & Contact</h2>
          </div>

          {customerType === 'business' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-900"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Technologies Pvt Ltd"
                  required={customerType === 'business'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  GSTIN (Corporate Tax ID)
                </label>
                <input
                  type="text"
                  name="gstin"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-900 font-mono"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="e.g. 32AABCB1234D1Z8"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Display Name *
            </label>
            <input
              type="text"
              name="displayName"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-900"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Full name or company display title"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-900"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-900"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-900"
                value={formData.email}
                onChange={handleChange}
                placeholder="billing@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-900"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Billing Address */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Billing Address (Tax Origin)</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Street Address
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-900"
              value={formData.billingAddress.addressLine1}
              onChange={(e) => handleAddressChange('billingAddress', 'addressLine1', e.target.value)}
              placeholder="e.g. Infopark Phase II, Kakkanad"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                City
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-900"
                value={formData.billingAddress.city}
                onChange={(e) => handleAddressChange('billingAddress', 'city', e.target.value)}
                placeholder="Kochi"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                State (Determines GST: Intra vs Inter)
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-900"
                value={formData.billingAddress.state}
                onChange={(e) => handleAddressChange('billingAddress', 'state', e.target.value)}
                placeholder="Kerala"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Postal Code
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-900"
                value={formData.billingAddress.postalCode}
                onChange={(e) => handleAddressChange('billingAddress', 'postalCode', e.target.value)}
                placeholder="682042"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/admin/customers"
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Customer...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Create Customer</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCustomer;
