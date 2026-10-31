import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  Briefcase,
  Users,
  FileText,
  Repeat,
  Receipt,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

const StaffDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Operations Workspace"
        subtitle="Manage customer relationships, draft proposals, and review subscription billing workflows."
      />

      {/* Staff Profile Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-lg">
              {(user?.fullName || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.fullName || 'Staff Member'}</h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Staff Operator
                </span>
                <span>•</span>
                <span>{user?.email}</span>
                {user?.phone && (
                  <>
                    <span>•</span>
                    <span>{user.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Operator
          </div>
        </div>
      </div>

      {/* Operational Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/customers"
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
            Customer Directory
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Browse corporate accounts, verify GSTIN, and assist customer inquiries.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 mt-3">
            <span>Manage accounts</span> <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/quotations"
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
            Commercial Proposals
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Draft customized software quotations, apply promo discounts, and send to clients.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-sky-600 mt-3">
            <span>View proposals</span> <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/subscriptions"
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Repeat className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
            Active Subscriptions
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Track active customer contracts, renewal dates, and trial evaluations.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-purple-600 mt-3">
            <span>Review contracts</span> <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/invoices"
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Receipt className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
            Invoices & Statements
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Review officially issued invoices, tax summaries, and track payment receipts.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-3">
            <span>Access statements</span> <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default StaffDashboard;
