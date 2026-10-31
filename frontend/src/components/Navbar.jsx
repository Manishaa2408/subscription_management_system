import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Percent,
  UserCheck,
  Shield,
  Users,
  CreditCard,
  RefreshCw,
  RotateCcw,
  Zap,
  LayoutDashboard,
  BarChart3,
  Layers,
  Tag,
  Package,
  LogOut,
  LogIn,
  User,
  CheckCircle2
} from 'lucide-react';

export const Navbar = () => {
  const { currentUser, switchUser, PRESET_USERS, logout, role, isAdmin, isStaff, isCustomer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      {/* Top Demo Bar for Hackathon Evaluation */}
      <div className="bg-slate-900 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-600 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase shadow-xs">
            M1 - M12 Unified
          </span>
          <span className="text-slate-300 font-medium">
            Brightloop Software &bull; Complete End-to-End Subscription System
          </span>
        </div>

        {/* Interactive Persona / Role Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium hidden sm:inline">Switch Active Role:</span>
          <div className="inline-flex rounded-md shadow-xs bg-slate-800 p-0.5 border border-slate-700">
            {PRESET_USERS.map((user) => {
              const active = currentUser.key === user.key || role === user.role;
              return (
                <button
                  key={user.key}
                  type="button"
                  onClick={() => switchUser(user.key)}
                  title={user.description}
                  className={`px-2.5 py-1 text-xs rounded transition-all font-medium ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {user.key === 'admin' && 'Admin'}
                  {user.key === 'staff' && 'Staff'}
                  {user.key === 'customer1' && 'Customer 1 (KL)'}
                  {user.key === 'customer2' && 'Customer 2 (KA)'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to={isCustomer ? "/customer/dashboard" : "/admin/dashboard"} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
                BL
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">Brightloop</span>
                <span className="text-xs block text-slate-500 font-medium -mt-1">Subscription Engine</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {/* Admin & Staff Navigation */}
              {!isCustomer && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/admin/dashboard')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                    Dashboard
                  </Link>

                  <Link
                    to="/admin/customers"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/admin/customers')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    Customers
                  </Link>

                  <Link
                    to="/admin/products"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/admin/products') || isActive('/admin/plans')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-indigo-600" />
                    Products &amp; Plans
                  </Link>

                  <Link
                    to="/quotations"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/quotations') || isActive('/templates')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    Quotations
                  </Link>

                  <Link
                    to="/subscriptions"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/subscriptions')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Subscriptions
                  </Link>

                  <Link
                    to="/discounts"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/discounts')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    Discounts
                  </Link>

                  <Link
                    to="/admin/billing"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/admin/billing')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Billing Runs
                  </Link>

                  <Link
                    to="/admin/invoices"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/admin/invoices') && !isActive('/admin/invoices/create')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Invoices
                  </Link>

                  <Link
                    to="/admin/payments"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/admin/payments') || isActive('/admin/reconciliation')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    Payments &amp; Recon
                  </Link>

                  <Link
                    to="/admin/analytics/revenue"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/admin/analytics')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                    Analytics
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin/users"
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        isActive('/admin/users')
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-600" />
                      Users
                    </Link>
                  )}
                </>
              )}

              {/* Customer Portal Navigation */}
              {isCustomer && (
                <>
                  <Link
                    to="/customer/dashboard"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/customer/dashboard')
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Customer Home
                  </Link>

                  <Link
                    to="/customer/catalog"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/customer/catalog')
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    Product Catalog
                  </Link>

                  <Link
                    to="/portal/quotations"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/portal/quotations')
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    My Quotations
                  </Link>

                  <Link
                    to="/portal/subscriptions"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/portal/subscriptions')
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    My Subscriptions
                  </Link>

                  <Link
                    to="/customer/invoices"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/customer/invoices')
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    My Invoices
                  </Link>

                  <Link
                    to="/customer/payments"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/customer/payments')
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    My Payments
                  </Link>

                  <Link
                    to="/customer/profile"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive('/customer/profile')
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Profile
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* User Profile Badge & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800">{currentUser.name}</div>
              <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                {isAdmin && <Shield className="w-3 h-3 text-blue-600" />}
                {isStaff && <UserCheck className="w-3 h-3 text-amber-600" />}
                {isCustomer && <Users className="w-3 h-3 text-emerald-600" />}
                <span className="capitalize font-medium">{role}</span> &bull; {currentUser.email}
              </div>
            </div>

            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                isAdmin ? 'bg-blue-600' : isStaff ? 'bg-amber-600' : 'bg-emerald-600'
              }`}
            >
              {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
