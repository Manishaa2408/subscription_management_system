import React from "react";

export const DiscountStatusBadge = ({ status }) => {
  const configs = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "Active" },
    inactive: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Inactive" },
    expired: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500", label: "Expired" },
    archived: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400", label: "Archived" }
  };

  const current = configs[status?.toLowerCase()] || {
    bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400", label: status || "Unknown"
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${current.bg} ${current.text} ${current.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} ${status === "active" ? "animate-pulse" : ""}`} />
      {current.label}
    </span>
  );
};

export default DiscountStatusBadge;
