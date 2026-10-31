import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are currently no items matching your criteria.',
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
