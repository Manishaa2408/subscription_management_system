import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { invoiceApi } from '../../../services/invoiceApi';
import { Printer, ArrowLeft } from 'lucide-react';

export const InvoicePrintView = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrintData = async () => {
      try {
        setLoading(true);
        const res = await invoiceApi.getPrintData(id);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load print view:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrintData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Preparing print document...</div>;
  }

  if (!data || !data.invoice) {
    return <div className="p-8 text-center text-rose-500">Invoice not found or access restricted.</div>;
  }

  const { invoice } = data;
  const isIntraState = invoice.taxBreakdown?.cgstTotal > 0 || invoice.taxBreakdown?.sgstTotal > 0;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:p-0 print:bg-white text-slate-800">
      {/* Control bar for screen view */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md transition"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-lg rounded-2xl border border-slate-200 print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                BL
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Brightloop Software</h1>
                <p className="text-xs text-slate-500 font-medium">Cloud & Subscription Services</p>
              </div>
            </div>
            <div className="text-xs text-slate-600 mt-3 space-y-0.5">
              <div>{invoice.supplierSnapshot?.address}</div>
              <div>Email: {invoice.supplierSnapshot?.email} | Phone: {invoice.supplierSnapshot?.phone}</div>
              <div className="font-semibold text-slate-800 pt-1">
                GSTIN: <span className="font-mono text-blue-700">{invoice.supplierSnapshot?.gstin}</span>
              </div>
              <div>State: {invoice.supplierSnapshot?.state} (Code: 32)</div>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-md mb-2">
              Tax Invoice
            </span>
            <div className="text-xl font-bold font-mono text-slate-900">{invoice.invoiceNumber}</div>
            <div className="text-xs text-slate-500 mt-1 space-y-0.5">
              <div>Invoice Date: <span className="font-semibold text-slate-700">{new Date(invoice.issueDate).toLocaleDateString()}</span></div>
              <div>Payment Due: <span className="font-semibold text-slate-700">{new Date(invoice.dueDate).toLocaleDateString()}</span></div>
              {invoice.subscriptionId && (
                <div>Subscription: <span className="font-mono text-slate-700">{invoice.subscriptionId}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To Info */}
        <div className="grid grid-cols-2 gap-8 my-8 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-2">Billed To (Customer):</span>
            <div className="font-bold text-slate-900 text-sm">{invoice.customerSnapshot?.name}</div>
            <div className="text-slate-600 mt-1">{invoice.customerSnapshot?.email}</div>
            {invoice.customerSnapshot?.phone && <div>Phone: {invoice.customerSnapshot?.phone}</div>}
            <div className="text-slate-600 mt-2">
              {invoice.customerSnapshot?.billingAddress?.line1 && `${invoice.customerSnapshot.billingAddress.line1}, `}
              {invoice.customerSnapshot?.billingAddress?.city && `${invoice.customerSnapshot.billingAddress.city}, `}
              {invoice.customerSnapshot?.billingAddress?.state} - {invoice.customerSnapshot?.billingAddress?.postalCode}
            </div>
            <div className="mt-2 font-semibold text-slate-800">
              GSTIN: <span className="font-mono text-blue-700">{invoice.customerSnapshot?.gstin || 'Unregistered'}</span>
            </div>
            <div>Place of Supply: {invoice.customerSnapshot?.state}</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-2">Tax Classification:</span>
              <div className="text-sm font-semibold text-slate-800">
                {isIntraState ? 'Intra-State Supply (Kerala → Kerala)' : 'Inter-State Supply (Kerala → Other State)'}
              </div>
              <p className="text-slate-500 mt-1">
                {isIntraState
                  ? 'Subject to equal apportionment of Central GST (CGST) and State GST (SGST).'
                  : 'Subject to Integrated GST (IGST) per IGST statutory framework.'}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-700">Currency:</span> Indian Rupee (INR - ₹)
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-left text-xs mb-8">
          <thead className="bg-slate-100 text-slate-700 font-bold border-y border-slate-300">
            <tr>
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Item & Description</th>
              <th className="py-2.5 px-2 text-center">Qty</th>
              <th className="py-2.5 px-3 text-right">Rate</th>
              <th className="py-2.5 px-3 text-right">Taxable</th>
              <th className="py-2.5 px-2 text-center">GST</th>
              <th className="py-2.5 px-3 text-right">Tax (₹)</th>
              <th className="py-2.5 px-3 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items?.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900">{item.itemName}</div>
                  {item.description && <div className="text-slate-500 mt-0.5">{item.description}</div>}
                </td>
                <td className="py-3 px-2 text-center font-medium">{item.quantity}</td>
                <td className="py-3 px-3 text-right text-slate-700">
                  ₹{item.unitPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-medium">
                  ₹{item.taxableAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-2 text-center font-semibold text-slate-700">{item.taxRate}%</td>
                <td className="py-3 px-3 text-right text-slate-700">
                  ₹{item.taxAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">
                  ₹{item.lineTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals & Tax Breakdown Grid */}
        <div className="grid grid-cols-2 gap-8 border-t border-slate-300 pt-6">
          <div className="text-xs space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 uppercase block mb-1.5 text-[10px]">
                GST Breakdown Summary
              </span>
              {invoice.taxBreakdown?.ratesSummary?.map((r, i) => (
                <div key={i} className="flex justify-between text-slate-600 py-0.5 font-mono">
                  <span>{r.taxCode} ({r.rate}%) on ₹{r.taxableAmount}</span>
                  <span>₹{r.taxAmount}</span>
                </div>
              ))}
              {invoice.taxBreakdown?.cgstTotal > 0 && (
                <div className="flex justify-between text-blue-700 font-semibold pt-1 border-t border-slate-200 mt-1">
                  <span>Total CGST</span>
                  <span>₹{invoice.taxBreakdown.cgstTotal}</span>
                </div>
              )}
              {invoice.taxBreakdown?.sgstTotal > 0 && (
                <div className="flex justify-between text-blue-700 font-semibold">
                  <span>Total SGST</span>
                  <span>₹{invoice.taxBreakdown.sgstTotal}</span>
                </div>
              )}
              {invoice.taxBreakdown?.igstTotal > 0 && (
                <div className="flex justify-between text-indigo-700 font-semibold pt-1 border-t border-slate-200 mt-1">
                  <span>Total IGST</span>
                  <span>₹{invoice.taxBreakdown.igstTotal}</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">Payment Terms:</span> Direct Bank Transfer / NEFT / RTGS to
              Brightloop Software Pvt Ltd, HDFC Bank, Kochi Branch, A/C: 50200012345678, IFSC: HDFC0001234.
            </div>
          </div>

          <div className="text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span>₹{invoice.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Total Discounts:</span>
                <span>-₹{invoice.discountTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-slate-800">
              <span>Taxable Value:</span>
              <span>₹{invoice.taxableAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-blue-700 font-medium">
              <span>Total Statutory GST:</span>
              <span>+₹{invoice.taxTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-300 pt-2">
              <span>Grand Total:</span>
              <span>₹{invoice.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium pt-1">
              <span>Amount Paid:</span>
              <span>₹{invoice.amountPaid?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-rose-700 pt-1 border-t border-slate-200">
              <span>Balance Due:</span>
              <span>₹{invoice.outstandingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>This is a computer-generated invoice created by Brightloop Subscription Management System (M10).</p>
          <p className="mt-0.5">Thank you for choosing Brightloop Software!</p>
        </div>
      </div>
    </div>
  );
};
