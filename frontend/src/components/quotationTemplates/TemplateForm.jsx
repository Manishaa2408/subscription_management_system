import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TemplateItemSelector from "./TemplateItemSelector";
import TemplateItemTable from "./TemplateItemTable";
import TemplatePreview from "./TemplatePreview";
import { Eye, Save, X, AlertCircle } from "lucide-react";

export const TemplateForm = ({ initialData, onSubmit, isSubmitting, title, submitLabel = "Save Template" }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    validityDays: 15,
    status: "active",
    notes: "",
    items: []
  });

  const [errors, setErrors] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        code: initialData.code || "",
        description: initialData.description || "",
        validityDays: initialData.validityDays || 15,
        status: initialData.status || "active",
        notes: initialData.notes || "",
        items: initialData.items || []
      });
    }
  }, [initialData]);

  // Recalculate totals dynamically
  const calculateTotals = (items) => {
    let subtotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    for (const item of items) {
      subtotal += Number(item.lineSubtotal) || 0;
      taxTotal += Number(item.taxAmount) || 0;
      grandTotal += Number(item.lineTotal) || 0;
    }

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100
    };
  };

  const totals = calculateTotals(formData.items);

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddItem = (newItem) => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItem = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      const target = { ...updated[index], [field]: value };

      const qty = Math.max(0.01, parseFloat(target.quantity) || 0);
      const price = Math.max(0, parseFloat(target.unitPrice) || 0);
      const tax = Math.max(0, parseFloat(target.taxRate) || 0);

      const subtotal = Math.round(qty * price * 100) / 100;
      const taxAmt = Math.round((subtotal * tax) / 100 * 100) / 100;
      const lineTotal = Math.round((subtotal + taxAmt) * 100) / 100;

      target.lineSubtotal = subtotal;
      target.taxAmount = taxAmt;
      target.lineTotal = lineTotal;

      updated[index] = target;
      return { ...prev, items: updated };
    });
  };

  const validateForm = () => {
    const errs = [];
    if (!formData.name.trim()) errs.push("Template name is required");
    if (!formData.validityDays || parseInt(formData.validityDays, 10) <= 0) {
      errs.push("Validity period must be a positive integer");
    }
    if (formData.items.length === 0) {
      errs.push("At least one line item is required");
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);
    onSubmit(formData);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <div>
      {/* Errors alert */}
      {errors.length > 0 && (
        <div className="alert alert-error">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <AlertCircle size={18} style={{ marginTop: "2px" }} />
            <div>
              <strong>Please correct the following errors:</strong>
              <ul style={{ paddingLeft: "16px", marginTop: "4px" }}>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrors([])}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section A: Basic Information */}
        <div className="card">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>
            Section A: Basic Template Details
          </h2>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">
                Template Name <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="e.g. Business Starter Package"
                value={formData.name}
                onChange={handleTextChange}
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Template Code (Optional)</label>
              <input
                type="text"
                name="code"
                className="form-control"
                placeholder="Auto-generated (e.g. QT-001)"
                value={formData.code}
                onChange={handleTextChange}
                disabled={Boolean(initialData)} // Do not change code on edit
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">
                Validity (Days) <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                name="validityDays"
                className="form-control"
                value={formData.validityDays}
                onChange={handleTextChange}
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select name="status" className="form-control" value={formData.status} onChange={handleTextChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              rows="2"
              className="form-control"
              placeholder="Brief summary of what this quotation package contains..."
              value={formData.description}
              onChange={handleTextChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Internal Notes / Terms</label>
            <textarea
              name="notes"
              rows="2"
              className="form-control"
              placeholder="Target customer segment, renewal constraints, or sales notes..."
              value={formData.notes}
              onChange={handleTextChange}
            />
          </div>
        </div>

        {/* Section B: Line Items Configuration */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                Section B: Line Items (Products & Plans)
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Configure recurring subscription plans, services and product variants.
              </p>
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e40af" }}>
              {formData.items.length} item(s) configured
            </div>
          </div>

          <TemplateItemTable
            items={formData.items}
            onRemoveItem={handleRemoveItem}
            onUpdateItem={handleUpdateItem}
            readOnly={false}
          />

          <TemplateItemSelector onAddItem={handleAddItem} />
        </div>

        {/* Section C: Price Summary */}
        <div className="card" style={{ background: "#f8fafc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                Section C: Price Summary
              </h2>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Dynamic 2-decimal rounded preview (Authoritatively verified on backend save)
              </div>
            </div>

            <div style={{ display: "flex", gap: "32px", textAlign: "right" }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase" }}>Subtotal</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{formatCurrency(totals.subtotal)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase" }}>Tax Total</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{formatCurrency(totals.taxTotal)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#1e40af", textTransform: "uppercase", fontWeight: 700 }}>
                  Grand Total
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e40af" }}>
                  {formatCurrency(totals.grandTotal)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section D: Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowPreview(true)}
            disabled={formData.items.length === 0}
          >
            <Eye size={16} /> Preview Template
          </button>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <TemplatePreview
          template={{
            ...formData,
            ...totals
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default TemplateForm;
