import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  FileCode,
  FileText,
  Tag,
  Repeat,
  Zap,
  Receipt,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Percent,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { role, isAdmin, isStaff, isCustomer } = useAuth();
  const location = useLocation();

  // Navigation menu groupings based on specifications
  const adminAndStaffNav = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      group: 'Customers & Catalog',
      items: [
        { name: 'Customers', path: '/admin/customers', icon: Users },
        { name: 'Products & Plans', path: '/admin/products', icon: Package },
      ]
    },
    {
      group: 'Sales & Quotes',
      items: [
        { name: 'Quotation Templates', path: '/templates', icon: FileCode },
        { name: 'Quotations', path: '/quotations', icon: FileText },
        { name: 'Discounts & Promos', path: '/discounts', icon: Tag },
      ]
    },
    {
      group: 'Subscriptions & Billing',
      items: [
        { name: 'Subscriptions', path: '/subscriptions', icon: Repeat },
        { name: 'Billing Runs', path: '/admin/billing', icon: Zap },
      ]
    },
    {
      group: 'Finance & Payments',
      items: [
        { name: 'Invoices', path: '/admin/invoices', icon: Receipt },
        { name: 'Payments', path: '/admin/payments', icon: CreditCard },
        { name: 'Reconciliation', path: '/admin/reconciliation', icon: CheckCircle2 },
        { name: 'Tax Rates', path: '/admin/tax-configurations', icon: Percent },
      ]
    },
    {
      group: 'Insights',
      items: [
        { name: 'Revenue Analytics', path: '/admin/analytics/revenue', icon: TrendingUp },
      ]
    },
    ...(isAdmin ? [
      {
        group: 'Administration',
        items: [
          { name: 'User Management', path: '/admin/users', icon: ShieldCheck },
        ]
      }
    ] : [])
  ];

  const customerNav = [
    {
      group: 'Customer Portal',
      items: [
        { name: 'My Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
        { name: 'My Profile', path: '/customer/profile', icon: Users },
      ]
    },
    {
      group: 'Orders & Plans',
      items: [
        { name: 'My Quotations', path: '/portal/quotations', icon: FileText },
        { name: 'Active Subscriptions', path: '/portal/subscriptions', icon: Repeat },
      ]
    },
    {
      group: 'Billing & History',
      items: [
        { name: 'My Invoices', path: '/customer/invoices', icon: Receipt },
        { name: 'Payment History', path: '/customer/payments', icon: CreditCard },
      ]
    }
  ];

  const navigation = isCustomer ? customerNav : adminAndStaffNav;

  const isActive = (path) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 shadow-xs`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-base font-bold text-slate-900 tracking-tight block">Brightloop</span>
                <span className="text-[11px] text-slate-500 font-medium block -mt-1">Subscription SaaS</span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigation.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {section.group}
                </div>
              )}
              {isCollapsed && (
                <div className="w-6 h-0.5 bg-slate-200 mx-auto my-2 rounded-full" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => onClose && onClose()}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Collapse toggle (Desktop only) */}
        <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
          {!isCollapsed && (
            <div className="flex items-center gap-2 pl-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-500 font-medium capitalize">{role} Workspace</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white hover:shadow-xs transition mx-auto"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
