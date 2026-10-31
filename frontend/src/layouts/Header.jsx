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
  Command,
  HelpCircle,
  Check
} from 'lucide-react';

export const Header = ({ onOpenSidebar }) => {
  const { currentUser, switchUser, PRESET_USERS, logout, role, isAdmin, isStaff, isCustomer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Format breadcrumb title and module category from path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return { section: 'Overview', title: 'Dashboard' };
    if (path.includes('/customers/create')) return { section: 'Customers', title: 'New Customer' };
    if (path.includes('/customers') && path.includes('/edit')) return { section: 'Customers', title: 'Edit Customer' };
    if (path.includes('/customers')) return { section: 'Directory', title: 'Customers' };
    if (path.includes('/products') || path.includes('/plans')) return { section: 'Catalog', title: 'Products & Plans' };
    if (path.includes('/templates')) return { section: 'Sales', title: 'Quotation Templates' };
    if (path.includes('/quotations/create')) return { section: 'Sales', title: 'Create Quotation' };
    if (path.includes('/quotations')) return { section: 'Sales', title: 'Quotations' };
    if (path.includes('/subscriptions')) return { section: 'Subscriptions', title: 'Subscriptions' };
    if (path.includes('/discounts')) return { section: 'Promotions', title: 'Discounts & Codes' };
    if (path.includes('/billing')) return { section: 'Operations', title: 'Recurring Billing' };
    if (path.includes('/invoices/create')) return { section: 'Finance', title: 'Create Invoice' };
    if (path.includes('/invoices')) return { section: 'Finance', title: 'Invoices' };
    if (path.includes('/payments/create')) return { section: 'Finance', title: 'Record Payment' };
    if (path.includes('/payments')) return { section: 'Finance', title: 'Payments' };
    if (path.includes('/reconciliation')) return { section: 'Finance', title: 'Reconciliation' };
    if (path.includes('/tax-configurations')) return { section: 'Configuration', title: 'Tax Rates' };
    if (path.includes('/analytics')) return { section: 'Intelligence', title: 'Revenue Analytics' };
    if (path.includes('/users')) return { section: 'Administration', title: 'User Management' };
    if (path.includes('/customer/dashboard')) return { section: 'Portal', title: 'Customer Dashboard' };
    if (path.includes('/customer/profile')) return { section: 'Portal', title: 'My Profile' };
    if (path.includes('/customer/invoices')) return { section: 'Portal', title: 'My Invoices' };
    return { section: 'Platform', title: 'Workspace' };
  };

  const breadcrumbs = getBreadcrumbs();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return { text: 'Admin', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'staff':
        return { text: 'Staff', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'customer':
      default:
        return { text: 'Customer', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile hamburger + Clean Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          <span className="text-slate-400 font-medium hidden sm:inline">{breadcrumbs.section}</span>
          <span className="text-slate-300 font-normal hidden sm:inline">/</span>
          <span className="font-semibold text-slate-900 tracking-tight">{breadcrumbs.title}</span>
        </nav>
      </div>

      {/* Center: Global Quick Search Input (Real SaaS appearance) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search subscriptions, invoices, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          <kbd className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[10px] text-slate-400 font-medium pointer-events-none">
            <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs font-mono">⌘K</span>
          </kbd>
        </div>
      </div>

      {/* Right: Notification Bell + User Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Subtle Notifications Bell */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        <div className="h-5 w-[1px] bg-slate-200 hidden sm:block mx-1" />

        {/* User Profile Menu Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition border border-transparent focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-semibold flex items-center justify-center text-xs shadow-xs ring-1 ring-black/5">
              {(currentUser?.name || currentUser?.fullName || 'User').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                {currentUser?.name || currentUser?.fullName || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-400 capitalize leading-tight">
                {role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown Card */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {currentUser?.name || currentUser?.fullName || 'Administrator'}
                  </p>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${roleInfo.bg} uppercase tracking-wider`}>
                    {roleInfo.text}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {currentUser?.email || 'admin@brightloop.com'}
                </p>
              </div>

              {/* Clean Role Switcher inside Profile Menu (No longer a clunky banner!) */}
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
                  Active Persona
                </p>
                <div className="space-y-0.5">
                  {PRESET_USERS.map((preset) => {
                    const isSelected = currentUser.key === preset.key || role === preset.role;
                    return (
                      <button
                        key={preset.key}
                        onClick={() => {
                          switchUser(preset.key);
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{preset.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
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
