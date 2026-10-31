import React from "react";

export const TemplateStatusBadge = ({ status }) => {
  const isAct = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${
        isAct
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isAct ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
      <span className="capitalize">{status || "active"}</span>
    </span>
  );
};

export default TemplateStatusBadge;
