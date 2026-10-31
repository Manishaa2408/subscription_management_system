import React from 'react';

export const PageHeader = ({ title, subtitle, actions, children }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-3 flex-wrap">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
