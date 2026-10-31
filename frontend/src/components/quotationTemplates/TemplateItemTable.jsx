import React from "react";
import { Trash2 } from "lucide-react";

export const TemplateItemTable = ({ items = [], onRemoveItem, onUpdateItem, readOnly = false }) => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Item Details</th>
            <th style={{ width: "100px", textAlign: "right" }}>Qty</th>
            <th style={{ width: "130px", textAlign: "right" }}>Unit Price</th>
            <th style={{ width: "120px", textAlign: "right" }}>Subtotal</th>
            <th style={{ width: "100px", textAlign: "right" }}>Tax Rate</th>
            <th style={{ width: "120px", textAlign: "right" }}>Tax Amt</th>
            <th style={{ width: "140px", textAlign: "right" }}>Line Total</th>
            {!readOnly && <th style={{ width: "60px", textAlign: "center" }}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={readOnly ? 8 : 9} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                No items added yet. Click "+ Add Line Item" below to configure products or plans.
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr key={index}>
                {/* Type Badge */}
                <td>
                  <span className={`badge ${item.itemType === "plan" ? "badge-plan" : "badge-product"}`}>
                    {item.itemType === "plan" ? "Subscription Plan" : "Product"}
                  </span>
                </td>

                {/* Name & Description */}
                <td>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.itemName}</div>
                  {item.description && (
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{item.description}</div>
                  )}
                </td>

                {/* Quantity */}
                <td style={{ textAlign: "right" }}>
                  {readOnly ? (
                    item.quantity
                  ) : (
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      className="form-control"
                      style={{ width: "80px", textAlign: "right", display: "inline-block" }}
                      value={item.quantity}
                      onChange={(e) => onUpdateItem(index, "quantity", e.target.value)}
                    />
                  )}
                </td>

                {/* Unit Price */}
                <td style={{ textAlign: "right" }}>
                  {readOnly ? (
                    formatCurrency(item.unitPrice)
                  ) : (
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-control"
                      style={{ width: "110px", textAlign: "right", display: "inline-block" }}
                      value={item.unitPrice}
                      onChange={(e) => onUpdateItem(index, "unitPrice", e.target.value)}
                    />
                  )}
                </td>

                {/* Subtotal */}
                <td style={{ textAlign: "right", fontWeight: 500 }}>
                  {formatCurrency(item.lineSubtotal)}
                </td>

                {/* Tax Rate */}
                <td style={{ textAlign: "right" }}>
                  {readOnly ? (
                    `${item.taxRate || 0}%`
                  ) : (
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      className="form-control"
                      style={{ width: "70px", textAlign: "right", display: "inline-block" }}
                      value={item.taxRate}
                      onChange={(e) => onUpdateItem(index, "taxRate", e.target.value)}
                    />
                  )}
                </td>

                {/* Tax Amount */}
                <td style={{ textAlign: "right", color: "#64748b" }}>
                  {formatCurrency(item.taxAmount)}
                </td>

                {/* Line Total */}
                <td style={{ textAlign: "right", fontWeight: 700, color: "#1e40af" }}>
                  {formatCurrency(item.lineTotal)}
                </td>

                {/* Remove */}
                {!readOnly && (
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ color: "#ef4444", borderColor: "#fca5a5", padding: "4px 8px" }}
                      onClick={() => onRemoveItem(index)}
                      title="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TemplateItemTable;
