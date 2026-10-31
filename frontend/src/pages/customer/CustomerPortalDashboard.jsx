import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import customerService from '../../services/customerService';
import PortalLayout from '../../components/portal/PortalLayout';
import { StatCard } from '../../components/common/StatCard';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Repeat,
  Receipt,
  CreditCard,
  ShieldCheck,
  Clock,
  AlertCircle,
  ArrowRight,
  IndianRupee,
  Calendar,
  CheckCircle2
} from 'lucide-react';

const CustomerPortalDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await customerService.getPortalDashboard();
        if (res && res.data) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load customer portal dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <PortalLayout title="Customer Portal" subtitle="Welcome to your Brightloop Software subscription portal">
        <LoadingState message="Loading your subscription and account data..." />
      </PortalLayout>
    );
  }

  const { customer, stats, recentSubscriptions = [], recentInvoices = [], recentPayments = [], recentActivity = [] } =
    data || {};

  return (
    <PortalLayout
      title={`Welcome back, ${customer?.displayName || customer?.name || 'Customer'}`}
      subtitle="Here is an overview of your active subscriptions, invoices, and recent account operations."
    >
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          change="Managed plans"
          icon={Repeat}
          color="blue"
        />
        <StatCard
          label="Outstanding Balance"
          value={`₹${(stats?.totalOutstandingBalance || 0).toLocaleString('en-IN')}`}
          change={stats?.totalOutstandingBalance > 0 ? "Payment pending" : "All caught up"}
          icon={Receipt}
          color={stats?.totalOutstandingBalance > 0 ? "rose" : "emerald"}
        />
        <StatCard
          label="Total Paid"
          value={`₹${(stats?.totalPaidAmount || 0).toLocaleString('en-IN')}`}
          change="Lifetime billing"
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          label="Account Status"
          value={customer?.status || 'Active'}
          change={`ID: ${customer?.customerCode || 'CUST-0001'}`}
          icon={ShieldCheck}
          color="indigo"
        />
      </div>

      {/* Subscriptions & Invoices 2-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Active Subscriptions */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Active Subscriptions</h3>
            <Link
              to="/customer/subscriptions"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentSubscriptions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No subscriptions found.
            </div>
          ) : (
            <div className="space-y-3">
              {recentSubscriptions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50/75 hover:bg-slate-50 border border-slate-100 rounded-xl transition"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{s.planName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Renews: {new Date(s.nextBillingDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-900">
                      ₹{s.amount.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">/ {s.interval}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Invoices</h3>
            <Link
              to="/customer/invoices"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No invoices found.
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50/75 hover:bg-slate-50 border border-slate-100 rounded-xl transition"
                >
                  <div>
                    <div className="font-mono font-medium text-xs text-blue-600">{inv.invoiceNumber}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-900">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mt-1 border ${
                        inv.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account Activity Timeline */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Recent Account Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-xs text-slate-400">No recent account events logged.</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((act) => (
              <div
                key={act.id || act._id}
                className="flex items-center gap-3 text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-medium text-slate-800">{act.description}</span>
                  <span className="text-slate-400">
                    {new Date(act.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default CustomerPortalDashboard;
