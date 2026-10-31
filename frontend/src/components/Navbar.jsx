import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, PlusCircle, Percent, UserCheck, Shield, Users, CreditCard, RefreshCw, RotateCcw } from 'lucide-react';

export const Navbar = () => {
  const { currentUser, switchUser, PRESET_USERS } = useAuth();
  const location = useLocation();

  const isAdmin = currentUser.role === 'admin';
  const isStaff = currentUser.role === 'staff';
  const isCustomer = currentUser.role === 'customer';

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
      {/* Top Demo Bar for Hackathon Evaluation */}
      <div className="bg-slate-900 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
            M10 + M11
          </span>
          <span className="text-slate-300">
            Invoice & Tax Management | Odoo x Make-A-Ton Hackathon 2026
          </span>
        </div>

        {/* Interactive Persona / Role Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Switch Active Role:</span>
          <div className="inline-flex rounded-md shadow-xs bg-slate-800 p-0.5 border border-slate-700">
            {PRESET_USERS.map((user) => {
              const active = currentUser.key === user.key;
              return (
                <button
                  key={user.key}
                  type="button"
                  onClick={() => switchUser(user.key)}
                  title={user.description}
                  className={`px-2.5 py-1 text-xs rounded transition-all font-medium ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
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
          <div className="flex items-center gap-8">
            <Link to="/admin/invoices" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
                BL
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">Brightloop</span>
                <span className="text-xs block text-slate-500 font-medium -mt-1">Invoicing & Tax Engine</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {/* Admin/Staff Navigation */}
              {(isAdmin || isStaff) && (
                <>
                  <Link
                    to="/admin/invoices"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/admin/invoices') && !isActive('/admin/invoices/create')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    All Invoices
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin/invoices/create"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/admin/invoices/create')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      Create Invoice
                    </Link>
                  )}

                  <Link
                    to="/admin/tax-configurations"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/admin/tax-configurations')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Percent className="w-4 h-4" />
                    Tax Configurations
                  </Link>

                  {/* M11 – Payments */}
                  <Link
                    to="/admin/payments"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/admin/payments')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Payments
                  </Link>

                  <Link
                    to="/admin/reconciliation"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/admin/reconciliation')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reconciliation
                  </Link>

                  <Link
                    to="/admin/refunds"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/admin/refunds')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Refunds
                  </Link>
                </>
              )}

              {/* Customer Portal Links */}
              <Link
                to="/customer/invoices"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/customer/invoices')
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                My Invoices
              </Link>

              <Link
                to="/customer/payments"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/customer/payments')
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                My Payments
              </Link>
            </nav>

          </div>

          {/* User Badge Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800">{currentUser.name}</div>
              <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                {currentUser.role === 'admin' && <Shield className="w-3 h-3 text-blue-600" />}
                {currentUser.role === 'staff' && <UserCheck className="w-3 h-3 text-amber-600" />}
                {currentUser.role === 'customer' && <Users className="w-3 h-3 text-emerald-600" />}
                <span className="capitalize font-medium">{currentUser.role}</span> &bull; {currentUser.email}
              </div>
            </div>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-xs ${
              currentUser.role === 'admin' ? 'bg-blue-600' :
              currentUser.role === 'staff' ? 'bg-amber-600' : 'bg-emerald-600'
            }`}>
              {currentUser.role[0].toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
