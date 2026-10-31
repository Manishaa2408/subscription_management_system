/**
 * Quotation Document / PDF generator utility for Brightloop Software
 */

export const generateQuotationHTML = (quotation) => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const statusColor = {
    draft: "#64748b",
    sent: "#0284c7",
    accepted: "#16a34a",
    rejected: "#dc2626",
    expired: "#ea580c",
    cancelled: "#94a3b8"
  }[quotation.status] || "#1e40af";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quotation ${quotation.quotationNumber} - Brightloop Software</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 28px; }
    .brand { font-size: 26px; font-weight: 800; color: #1e40af; }
    .meta-box { text-align: right; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #fff; background: ${statusColor}; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
    .customer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
    th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    .totals-table { width: 320px; margin-left: auto; margin-bottom: 24px; }
    .totals-table td { padding: 6px 10px; }
    .grand-total { font-size: 18px; font-weight: 800; color: #1e40af; border-top: 2px solid #0f172a; }
    .terms { font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; white-space: pre-line; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #1e40af; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600;">
      Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div>
      <div class="brand">Brightloop Software</div>
      <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Subscription Cloud Platforms & Enterprise ERP</div>
      <div style="font-size: 12px; color: #64748b;">billing@brightloop.io • +91 484 2900000</div>
    </div>
    <div class="meta-box">
      <div style="font-size: 20px; font-weight: 700;">${quotation.quotationNumber}</div>
      <div style="margin: 6px 0;"><span class="badge">${quotation.status}</span></div>
      <div style="font-size: 13px; color: #475569;">Date: <strong>${new Date(quotation.quotationDate).toLocaleDateString()}</strong></div>
      <div style="font-size: 13px; color: #dc2626;">Valid Until: <strong>${new Date(quotation.validUntil).toLocaleDateString()}</strong></div>
    </div>
  </div>

  <div class="customer-box">
    <div class="section-title">Quotation Prepared For</div>
    <div style="font-size: 16px; font-weight: 700;">${quotation.customerSnapshot.name}</div>
    <div style="font-size: 14px; color: #475569;">${quotation.customerSnapshot.companyName || ""}</div>
    <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
      Email: ${quotation.customerSnapshot.email} | Phone: ${quotation.customerSnapshot.phone || "N/A"}
    </div>
    <div style="font-size: 13px; color: #64748b;">
      Address: ${quotation.customerSnapshot.billingAddress?.street || ""}, ${quotation.customerSnapshot.billingAddress?.city || ""}, ${quotation.customerSnapshot.billingAddress?.state || ""} - ${quotation.customerSnapshot.billingAddress?.postalCode || ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description / Service</th>
        <th style="width: 120px; text-align: center;">Frequency</th>
        <th style="width: 60px; text-align: right;">Qty</th>
        <th style="width: 110px; text-align: right;">Unit Price</th>
        <th style="width: 80px; text-align: right;">Tax</th>
        <th style="width: 120px; text-align: right;">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${quotation.lineItems.map(item => `
        <tr>
          <td>
            <strong>${item.description || item.productSnapshot?.name || item.planSnapshot?.name || "Service Item"}</strong>
          </td>
          <td style="text-align: center; text-transform: capitalize; color: #64748b;">
            ${item.billingFrequency.replace("_", " ")}
          </td>
          <td style="text-align: right;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
          <td style="text-align: right;">${item.taxRate}%</td>
          <td style="text-align: right; font-weight: 600;">${formatCurrency(item.lineTotal)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <table class="totals-table">
    <tr>
      <td>Subtotal:</td>
      <td style="text-align: right; font-weight: 600;">${formatCurrency(quotation.subtotal)}</td>
    </tr>
    ${quotation.discountAmount > 0 ? `
    <tr style="color: #16a34a;">
      <td>Discount (${quotation.discountDetails?.code || "Coupon"}):</td>
      <td style="text-align: right; font-weight: 600;">-${formatCurrency(quotation.discountAmount)}</td>
    </tr>
    ` : ""}
    <tr>
      <td>Taxable Amount:</td>
      <td style="text-align: right; font-weight: 600;">${formatCurrency(quotation.taxableAmount)}</td>
    </tr>
    ${quotation.taxBreakdown.map(t => `
      <tr style="color: #64748b; font-size: 13px;">
        <td>${t.name} (${t.rate}%):</td>
        <td style="text-align: right;">${formatCurrency(t.amount)}</td>
      </tr>
    `).join("")}
    <tr class="grand-total">
      <td>Grand Total:</td>
      <td style="text-align: right;">${formatCurrency(quotation.grandTotal)}</td>
    </tr>
  </table>

  ${quotation.customerNotes ? `
    <div style="margin-bottom: 20px; font-size: 13px; background: #f8fafc; padding: 12px; border-radius: 4px;">
      <strong>Note:</strong> ${quotation.customerNotes}
    </div>
  ` : ""}

  <div class="terms">
    <strong>Terms & Conditions:</strong><br>
    ${quotation.termsAndConditions}
  </div>
</body>
</html>`;
};

export default {
  generateQuotationHTML
};
