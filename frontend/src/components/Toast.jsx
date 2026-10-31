import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const Toast = ({ toast, message, type, onClose }) => {
  const actualMessage = toast?.message || message;
  const actualType = toast?.type || type;
  const actualErrors = toast?.errors || [];

  if (!actualMessage) return null;

  const isError = actualType === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-fade-in no-print">
      <div className={`flex items-start gap-3 p-4 rounded-xl shadow-xl border ${
        isError 
          ? 'bg-rose-50 border-rose-200 text-rose-900' 
          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}>
        {isError ? (
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold">{actualMessage}</p>
          {actualErrors.length > 0 && (
            <ul className="mt-1 text-xs space-y-0.5 text-rose-700 list-disc list-inside">
              {actualErrors.map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
