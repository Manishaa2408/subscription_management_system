import React from 'react';

const STATUS_CONFIG = {
  // Invoice statuses
  draft: {
    label: 'Draft',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500'
  },
  issued: {
    label: 'Issued',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500'
  },
  partially_paid: {
    label: 'Partially Paid',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500'
  },
  paid: {
    label: 'Paid',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  overdue: {
    label: 'Overdue',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500'
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400'
  },

  // Payment statuses
  pending: {
    label: 'Pending',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500'
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  failed: {
    label: 'Failed',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500'
  },
  refunded: {
    label: 'Refunded',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500'
  },
  partially_refunded: {
    label: 'Partially Refunded',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500'
  },

  // Reconciliation statuses
  unmatched: {
    label: 'Unmatched',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500'
  },
  matched: {
    label: 'Matched',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  discrepancy: {
    label: 'Discrepancy',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500'
  },
  ignored: {
    label: 'Ignored',
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400'
  }
};

export const StatusBadge = ({ status, color }) => {
  const normStatus = (status || 'draft').toLowerCase();
  const config = STATUS_CONFIG[normStatus] || {
    label: status ? status.replace(/_/g, ' ') : 'Draft',
    bg: color ? `bg-${color}-50 text-${color}-700 border-${color}-200` : 'bg-slate-100 text-slate-600 border-slate-200',
    dot: color ? `bg-${color}-500` : 'bg-slate-400'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
