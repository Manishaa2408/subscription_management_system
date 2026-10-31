import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  LayoutDashboard,
  FileText,
  Repeat,
  Receipt,
  CreditCard,
  Tag,
  Zap,
  Users,
  Package,
  BarChart3,
  LogOut,
  Shield,
  UserCheck
} from 'lucide-react';

export const Navbar = () => {
  const { user, currentUser, switchUser, PRESET_USERS, logout } = useAuth();
  const location = useLocation();

  const activeUser = user || currentUser || (PRESET_USERS && PRESET_USERS[0]) || { role: 'admin', name: 'Admin' };
  const isAdmin = activeUser.role === 'admin';
  const isStaff = activeUser.role === 'staff';
  const isCustomer = activeUser.role === 'customer';

  const isActive = (path) => {
    if (path === '/admin/dashboard' || path === '/') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs no-print">
      {/* Top Demo Bar for Hackathon Evaluation & Role Switching */}
      <div className="bg-slate-900 text-white text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
            Brightloop SMS &bull; M1 - M12 Unified
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Odoo x Make-A-Ton 9.0 Hackathon 2026
          </span>
        </div>

        {/* Role Switcher */}
        {PRESET_USERS && PRESET_USERS.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium hidden md:inline">Active Persona:</span>
            <div className="inline-flex rounded-md bg-slate-800 p-0.5 border border-slate-700">
              {PRESET_USERS.map((p) => {
                const active = activeUser.role === p.role;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => switchUser(p.key)}
                    title={p.description}
                    className={`px-2.5 py-1 text-xs rounded transition-all font-medium ${
                      active
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {p.key === 'admin' && 'Admin'}
                    {p.key === 'staff' && 'Staff'}
                    {p.key === 'customer1' && 'Customer'}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
                <Layers size={18} />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">Brightloop</span>
                <span className="text-[11px] block text-slate-500 font-medium -mt-1">Subscription Suite</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {/* Dashboard */}
              <Link
                to="/admin/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/admin/dashboard')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                Dashboard
              </Link>

              {/* Quotations */}
              <Link
                to="/quotations"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/quotations') || isActive('/admin/quotations')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Quotations
              </Link>

              {/* Subscriptions */}
              <Link
                to="/subscriptions"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/subscriptions') || isActive('/admin/subscriptions')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                Subscriptions
              </Link>

              {/* Invoices */}
              <Link
                to="/invoices"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/invoices') || isActive('/admin/invoices')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-violet-600" />
                Invoices
              </Link>

              {/* Payments */}
              <Link
                to="/payments"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/payments') || isActive('/admin/payments')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-cyan-600" />
                Payments
              </Link>

              {/* Discounts */}
              <Link
                to="/discounts"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/discounts') || isActive('/admin/discounts')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-rose-500" />
                Discounts
              </Link>

              {/* Billing Engine */}
              <Link
                to="/billing"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/billing') || isActive('/admin/billing')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Billing Runs
              </Link>

              {/* Customers */}
              <Link
                to="/admin/customers"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/admin/customers')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-slate-600" />
                Customers
              </Link>

              {/* Plans */}
              <Link
                to="/admin/plans"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/admin/plans')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-slate-600" />
                Plans
              </Link>

              {/* Analytics */}
              <Link
                to="/admin/analytics"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/admin/analytics')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                Analytics
              </Link>
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">{activeUser.fullName || activeUser.name}</div>
              <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                {activeUser.role === 'admin' && <Shield className="w-3 h-3 text-blue-600" />}
                {activeUser.role === 'staff' && <UserCheck className="w-3 h-3 text-amber-600" />}
                {activeUser.role === 'customer' && <Users className="w-3 h-3 text-emerald-600" />}
                <span className="capitalize font-medium">{activeUser.role}</span>
              </div>
            </div>

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                activeUser.role === 'admin'
                  ? 'bg-blue-600'
                  : activeUser.role === 'staff'
                  ? 'bg-amber-600'
                  : 'bg-emerald-600'
              }`}
            >
              {(activeUser.role || 'A')[0].toUpperCase()}
            </div>

            {logout && (
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
