import React from 'react';

const fmtINR = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val ?? 0);

export default function PaymentMethodChart({ methods = {} }) {
  const methodLabels = {
    upi: { label: 'UPI / QR', color: 'bg-emerald-500' },
    bank_transfer: { label: 'Bank Transfer (NEFT/RTGS)', color: 'bg-blue-500' },
    card: { label: 'Credit / Debit Card', color: 'bg-purple-500' },
    cash: { label: 'Cash', color: 'bg-amber-500' },
    cheque: { label: 'Cheque', color: 'bg-slate-400' }
  };

  const list = Object.entries(methods).map(([key, data]) => ({
    key,
    label: methodLabels[key]?.label || key.toUpperCase(),
    color: methodLabels[key]?.color || 'bg-blue-500',
    count: data.count || 0,
    amount: data.amount || 0,
    percentage: data.percentage || 0
  }));

  const totalAmount = list.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-900">Collections by Payment Method</h2>
        <p className="text-xs text-slate-500">Distribution of collected revenue across payment gateway rails</p>
      </div>

      <div className="space-y-4">
        {list.map((item) => (
          <div key={item.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="font-semibold text-slate-900 font-mono">
                {fmtINR(item.amount)}{' '}
                <span className="text-slate-400 font-normal">({item.percentage}%)</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                style={{ width: `${Math.min(100, item.percentage)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
