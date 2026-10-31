import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  requiresInput = false,
  inputLabel = '',
  inputPlaceholder = '',
  onConfirm,
  onClose
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requiresInput && !inputValue.trim()) {
      setError('This field is required');
      return;
    }
    onConfirm(requiresInput ? inputValue.trim() : null);
    setInputValue('');
    setError('');
  };

  const handleClose = () => {
    setInputValue('');
    setError('');
    onClose();
  };

  const buttonColors = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                confirmVariant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{message}</p>

          {requiresInput && (
            <div className="mt-4">
              {inputLabel && (
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {inputLabel} <span className="text-rose-500">*</span>
                </label>
              )}
              <textarea
                rows={3}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (error) setError('');
                }}
                placeholder={inputPlaceholder}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition ${
              buttonColors[confirmVariant] || buttonColors.primary
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
