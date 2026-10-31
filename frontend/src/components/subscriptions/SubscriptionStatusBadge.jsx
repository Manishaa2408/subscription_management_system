import React from "react";

export const SubscriptionStatusBadge = ({ status }) => {
  const configs = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "Active" },
    trial: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500", label: "Trial Period" },
    paused: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Paused" },
    pending: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400", label: "Pending" },
    past_due: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500", label: "Past Due" },
    cancelled: { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", dot: "bg-slate-400", label: "Cancelled" },
    expired: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", dot: "bg-rose-400", label: "Expired" }
  };

  const current = configs[status?.toLowerCase()] || configs.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${current.bg} ${current.text} ${current.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} ${status === "active" ? "animate-pulse" : ""}`} />
      {current.label}
    </span>
  );
};

export default SubscriptionStatusBadge;
