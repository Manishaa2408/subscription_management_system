import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  User,
  Shield,
  UserCheck,
  Users,
  ChevronDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const Header = ({ onOpenSidebar }) => {
  const { currentUser, switchUser, PRESET_USERS, logout, role, isAdmin, isStaff, isCustomer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format breadcrumb title from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Executive Dashboard';
    if (path.includes('/customers/create')) return 'Add New Customer';
    if (path.includes('/customers')) return 'Customers';
    if (path.includes('/products') || path.includes('/plans')) return 'Products & Subscription Plans';
    if (path.includes('/templates')) return 'Quotation Templates';
    if (path.includes('/quotations/create')) return 'Create Quotation';
    if (path.includes('/quotations')) return 'Quotations';
    if (path.includes('/subscriptions')) return 'Subscriptions';
    if (path.includes('/discounts')) return 'Discounts & Promo Campaigns';
    if (path.includes('/billing')) return 'Recurring Billing Engine';
    if (path.includes('/invoices/create')) return 'Create Tax Invoice';
    if (path.includes('/invoices')) return 'Invoices & Taxes';
    if (path.includes('/payments/create')) return 'Record Payment';
    if (path.includes('/payments')) return 'Payments & Receipts';
    if (path.includes('/reconciliation')) return 'Payment Reconciliation';
    if (path.includes('/tax-configurations')) return 'Tax Configuration (GST)';
    if (path.includes('/analytics')) return 'Revenue & Business Analytics';
    if (path.includes('/users')) return 'User & Access Management';
    return 'Subscription Management';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeClass = () => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'staff':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'customer':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile hamburger + Page context / breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:block">
            Brightloop Platform
          </span>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Persona Switcher + User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Elegant Role / Persona Switcher */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2">
            Role:
          </span>
          {PRESET_USERS.map((preset) => {
            const isSelected = currentUser.key === preset.key || role === preset.role;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => switchUser(preset.key)}
                title={preset.description}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {preset.key === 'admin' && 'Admin'}
                {preset.key === 'staff' && 'Staff'}
                {preset.key === 'customer1' && 'Customer 1 (KL)'}
                {preset.key === 'customer2' && 'Customer 2 (KA)'}
              </button>
            );
          })}
        </div>

        {/* User Profile Menu Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {(currentUser?.name || currentUser?.fullName || 'User').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name || currentUser?.fullName || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-500 capitalize leading-tight">
                {role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Card */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Signed in as</p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {currentUser?.name || currentUser?.fullName || 'Administrator'}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {currentUser?.email || 'admin@brightloop.com'}
                </p>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${getRoleBadgeClass()} uppercase tracking-wider`}>
                    {role} access
                  </span>
                </div>
              </div>

              {/* Mobile Role Switcher in Dropdown */}
              <div className="md:hidden px-4 py-2 border-b border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Switch Persona
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {PRESET_USERS.map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => {
                        switchUser(preset.key);
                        setProfileDropdownOpen(false);
                      }}
                      className={`px-2 py-1 text-xs rounded text-left truncate ${
                        currentUser.key === preset.key ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.key === 'admin' ? 'Admin' : preset.key === 'staff' ? 'Staff' : preset.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
