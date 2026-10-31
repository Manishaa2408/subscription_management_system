import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import quotationService from "../../services/quotationService";
import quotationTemplateService from "../../services/quotationTemplateService";
import QuotationPreviewModal from "./QuotationPreviewModal";
import { PlusCircle, Trash2, Save, Eye, X, AlertCircle, Layers, Box, Tag } from "lucide-react";

export const QuotationForm = ({ initialData, onSubmit, isSubmitting, title, submitLabel = "Save Draft" }) => {
  const navigate = useNavigate();

  // Catalogs loaded dynamically through backend adapters
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    customerId: "",
    templateId: "",
    quotationDate: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    currency: "INR",
    discountCode: "",
    internalNotes: "",
    customerNotes: "",
    termsAndConditions: "1. Quotation valid until specified expiry date.\n2. Prices subject to applicable standard GST taxes.\n3. Upon acceptance, recurring billing commences as configured.",
    lineItems: []
  });

  // Current item builder state
  const [itemType, setItemType] = useState("product");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemUnitPrice, setItemUnitPrice] = useState(0);
  const [itemTaxRate, setItemTaxRate] = useState(18);
  const [itemFrequency, setItemFrequency] = useState("monthly");

  const [errors, setErrors] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch catalogs dynamically
  useEffect(() => {
    const fetchAllCatalogs = async () => {
      try {
        setLoadingCatalogs(true);
        const [custList, prodList, planList, tmplRes, discList] = await Promise.all([
          quotationService.getCatalogCustomers(),
          quotationTemplateService.getCatalogProducts(),
          quotationTemplateService.getCatalogPlans(),
          quotationTemplateService.getTemplates({ status: "active" }),
          quotationService.getCatalogDiscounts()
        ]);

        setCustomers(custList || []);
        setProducts(prodList || []);
        setPlans(planList || []);
        setTemplates(tmplRes?.data?.templates || []);
        setDiscounts(discList || []);

        if (custList && custList.length > 0 && !formData.customerId) {
          setFormData(prev => ({ ...prev, customerId: custList[0]._id }));
        }

        if (prodList && prodList.length > 0) {
          applyProductSelection(prodList[0]._id, "", prodList);
        }
      } catch (err) {
        console.error("Error loading catalogs:", err);
      } finally {
        setLoadingCatalogs(false);
      }
    };
    fetchAllCatalogs();
  }, []);

  // Pre-load edit data
  useEffect(() => {
    if (initialData) {
      setFormData({
        customerId: initialData.customerId?._id || initialData.customerId || "",
        templateId: initialData.templateId || "",
        quotationDate: initialData.quotationDate ? new Date(initialData.quotationDate).toISOString().split("T")[0] : "",
        validUntil: initialData.validUntil ? new Date(initialData.validUntil).toISOString().split("T")[0] : "",
        currency: initialData.currency || "INR",
        discountCode: initialData.discountDetails?.code || "",
        internalNotes: initialData.internalNotes || "",
        customerNotes: initialData.customerNotes || "",
        termsAndConditions: initialData.termsAndConditions || "",
        lineItems: initialData.lineItems || []
      });
    }
  }, [initialData]);

  // Handle M5 Template selection to pre-fill line items
  const handleTemplateSelect = async (tmplId) => {
    setFormData(prev => ({ ...prev, templateId: tmplId }));
    if (!tmplId) return;

    try {
      const tmpl = templates.find(t => t._id === tmplId);
      if (tmpl && tmpl.items) {
        const loadedItems = tmpl.items.map(tItem => ({
          productId: tItem.itemType === "product" ? tItem.itemId : null,
          variantId: tItem.variantId || null,
          planId: tItem.itemType === "plan" ? tItem.itemId : null,
          description: tItem.description || tItem.itemName,
          quantity: tItem.quantity,
          unitPrice: tItem.unitPrice,
          taxRate: tItem.taxRate || 18,
          billingFrequency: tItem.itemType === "plan" ? "monthly" : "one_time",
          lineSubtotal: tItem.lineSubtotal,
          lineTotal: tItem.lineTotal,
          productSnapshot: tItem.itemType === "product" ? { name: tItem.itemName } : {},
          planSnapshot: tItem.itemType === "plan" ? { name: tItem.itemName, price: tItem.unitPrice } : {}
        }));

        setFormData(prev => ({
          ...prev,
          lineItems: loadedItems,
          customerNotes: tmpl.description || prev.customerNotes
        }));
      }
    } catch (err) {
      console.error("Failed to load template items:", err);
    }
  };

  const applyProductSelection = (pId, vId, prodSource = products) => {
    setSelectedProductId(pId);
    setSelectedVariantId(vId);
    const p = prodSource.find(item => item._id === pId);
    if (!p) return;

    let price = p.basePrice || 0;
    if (vId && p.variants) {
      const v = p.variants.find(vr => vr.variantId === vId);
      if (v) price += (v.additionalPrice || 0);
    }
    setItemUnitPrice(price);
    setItemTaxRate(p.taxRate || 18);
    setItemFrequency("one_time");
  };

  const applyPlanSelection = (plId, planSource = plans) => {
    setSelectedPlanId(plId);
    setSelectedVariantId("");
    const pl = planSource.find(item => item._id === plId);
    if (!pl) return;

    setItemUnitPrice(pl.price || 0);
    setItemTaxRate(pl.taxRate || 18);
    setItemFrequency(pl.billingInterval || "monthly");
  };

  const handleAddItem = () => {
    let desc = "";
    let pSnap = {};
    let vSnap = {};
    let plSnap = {};

    if (itemType === "product") {
      const p = products.find(x => x._id === selectedProductId);
      if (!p) return;
      desc = p.name;
      pSnap = { name: p.name, code: p.code };
      if (selectedVariantId && p.variants) {
        const v = p.variants.find(vr => vr.variantId === selectedVariantId);
        if (v) {
          desc += ` (${v.name})`;
          vSnap = { variantId: v.variantId, name: v.name, additionalPrice: v.additionalPrice };
        }
      }
    } else {
      const pl = plans.find(x => x._id === selectedPlanId);
      if (!pl) return;
      desc = `${pl.name} [${pl.billingInterval}]`;
      plSnap = { name: pl.name, price: pl.price, billingFrequency: pl.billingInterval };
    }

    const qty = Math.max(0.01, parseFloat(itemQuantity) || 1);
    const price = Math.max(0, parseFloat(itemUnitPrice) || 0);
    const tax = Math.max(0, parseFloat(itemTaxRate) || 0);

    const lineSubtotal = Math.round(qty * price * 100) / 100;
    const taxAmt = Math.round((lineSubtotal * tax) / 100 * 100) / 100;
    const lineTotal = Math.round((lineSubtotal + taxAmt) * 100) / 100;

    const newItem = {
      productId: itemType === "product" ? selectedProductId : null,
      variantId: itemType === "product" ? (selectedVariantId || null) : null,
      planId: itemType === "plan" ? selectedPlanId : null,
      productSnapshot: pSnap,
      variantSnapshot: vSnap,
      planSnapshot: plSnap,
      description: desc,
      quantity: qty,
      unitPrice: price,
      taxRate: tax,
      billingFrequency: itemFrequency,
      billingInterval: 1,
      lineSubtotal,
      lineTotal
    };

    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }));
    setItemQuantity(1);
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  // Live client calculations for preview
  const computeTotals = () => {
    let subtotal = 0;
    for (const item of formData.lineItems) {
      subtotal += Number(item.lineSubtotal) || 0;
    }
    subtotal = Math.round(subtotal * 100) / 100;

    let discountAmount = 0;
    if (formData.discountCode) {
      const disc = discounts.find(d => d.code === formData.discountCode);
      if (disc && subtotal >= (disc.minOrderValue || 0)) {
        if (disc.type === "percentage") {
          discountAmount = (subtotal * disc.value) / 100;
          if (disc.maxDiscountLimit && discountAmount > disc.maxDiscountLimit) {
            discountAmount = disc.maxDiscountLimit;
          }
        } else if (disc.type === "fixed") {
          discountAmount = Math.min(disc.value, subtotal);
        }
      }
    }
    discountAmount = Math.round(discountAmount * 100) / 100;
    const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    const cgst = Math.round((taxableAmount * 0.09) * 100) / 100;
    const sgst = Math.round((taxableAmount * 0.09) * 100) / 100;
    const totalTax = Math.round((cgst + sgst) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      taxBreakdown: [
        { name: "CGST", rate: 9, amount: cgst },
        { name: "SGST", rate: 9, amount: sgst }
      ],
      totalTax,
      grandTotal
    };
  };

  const totals = computeTotals();

  const selectedCustomer = customers.find(c => c._id === formData.customerId);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = [];
    if (!formData.customerId) errs.push("Customer selection is required");
    if (!formData.validUntil) errs.push("Valid-until date is required");
    if (formData.lineItems.length === 0) errs.push("At least one line item is required");
    if (new Date(formData.validUntil) < new Date(formData.quotationDate)) {
      errs.push("Valid-until date cannot be earlier than quotation date");
    }

    if (errs.length > 0) {
      setErrors(errs);
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
      {errors.length > 0 && (
        <div className="alert alert-error">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <AlertCircle size={18} />
            <div>
              <strong>Validation failed:</strong>
              <ul style={{ paddingLeft: "16px", marginTop: "4px" }}>
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          </div>
          <button type="button" onClick={() => setErrors([])} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Customer Details */}
        <div className="card">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>
            Section 1: Customer Information
          </h2>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Select Customer <span style={{ color: "red" }}>*</span></label>
              <select
                className="form-control"
                value={formData.customerId}
                onChange={e => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                required
              >
                {customers.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.companyName}) - {c.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCustomer && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px 16px", fontSize: "0.85rem", color: "#475569" }}>
              <div style={{ fontWeight: 600, color: "#0f172a" }}>Customer Snapshot Preview:</div>
              <div>Billing Address: {selectedCustomer.billingAddress?.street}, {selectedCustomer.billingAddress?.city}, {selectedCustomer.billingAddress?.state} - {selectedCustomer.billingAddress?.postalCode}</div>
              <div>Contact: {selectedCustomer.email} | {selectedCustomer.phone}</div>
            </div>
          )}
        </div>

        {/* Section 2: Quotation Metadata & M5 Template Integration */}
        <div className="card">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>
            Section 2: Quotation Metadata & Reusable Template
          </h2>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pre-fill from M5 Template (Optional)</label>
              <select
                className="form-control"
                value={formData.templateId}
                onChange={e => handleTemplateSelect(e.target.value)}
              >
                <option value="">-- No Template (Custom Proposal) --</option>
                {templates.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.code}) - {t.items?.length || 0} items
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quotation Date <span style={{ color: "red" }}>*</span></label>
              <input
                type="date"
                className="form-control"
                value={formData.quotationDate}
                onChange={e => setFormData(prev => ({ ...prev, quotationDate: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Valid Until <span style={{ color: "red" }}>*</span></label>
              <input
                type="date"
                className="form-control"
                value={formData.validUntil}
                onChange={e => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Currency</label>
              <input
                type="text"
                className="form-control"
                value={formData.currency}
                disabled
              />
            </div>
          </div>
        </div>

        {/* Section 3: Line Items */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                Section 3: Quotation Line Items
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Select software licenses, SaaS recurring plans, and implementation services.
              </p>
            </div>
            <div style={{ fontWeight: 600, color: "#1e40af", fontSize: "0.85rem" }}>
              {formData.lineItems.length} item(s) configured
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive" style={{ marginBottom: "16px" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ width: "110px", textAlign: "center" }}>Billing</th>
                  <th style={{ width: "70px", textAlign: "right" }}>Qty</th>
                  <th style={{ width: "110px", textAlign: "right" }}>Unit Price</th>
                  <th style={{ width: "80px", textAlign: "right" }}>Tax</th>
                  <th style={{ width: "120px", textAlign: "right" }}>Line Total</th>
                  <th style={{ width: "50px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "28px", color: "#64748b" }}>
                      No items added yet. Use the item selector below to add products or plans.
                    </td>
                  </tr>
                ) : (
                  formData.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.description}</div>
                      </td>
                      <td style={{ textAlign: "center", textTransform: "capitalize", color: "#64748b" }}>
                        {item.billingFrequency?.replace("_", " ")}
                      </td>
                      <td style={{ textAlign: "right" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ textAlign: "right" }}>{item.taxRate}%</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "#1e40af" }}>
                        {formatCurrency(item.lineTotal)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ color: "#ef4444", borderColor: "#fca5a5" }}
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Line Item Controls */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b", marginBottom: "10px" }}>
              Add Product / Subscription Plan Line Item
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
              <div style={{ width: "140px" }}>
                <label className="form-label">Type</label>
                <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                  <button
                    type="button"
                    onClick={() => { setItemType("product"); if (products.length > 0) applyProductSelection(products[0]._id, ""); }}
                    style={{ flex: 1, padding: "6px", fontSize: "0.75rem", background: itemType === "product" ? "#1e40af" : "#fff", color: itemType === "product" ? "#fff" : "#475569", border: "none", cursor: "pointer" }}
                  >
                    Product
                  </button>
                  <button
                    type="button"
                    onClick={() => { setItemType("plan"); if (plans.length > 0) applyPlanSelection(plans[0]._id); }}
                    style={{ flex: 1, padding: "6px", fontSize: "0.75rem", background: itemType === "plan" ? "#1e40af" : "#fff", color: itemType === "plan" ? "#fff" : "#475569", border: "none", cursor: "pointer" }}
                  >
                    Plan
                  </button>
                </div>
              </div>

              <div style={{ flex: 2, minWidth: "200px" }}>
                <label className="form-label">{itemType === "product" ? "Product" : "Subscription Plan"}</label>
                <select
                  className="form-control"
                  value={itemType === "product" ? selectedProductId : selectedPlanId}
                  onChange={e => itemType === "product" ? applyProductSelection(e.target.value, "") : applyPlanSelection(e.target.value)}
                >
                  {itemType === "product"
                    ? products.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.basePrice})</option>)
                    : plans.map(pl => <option key={pl._id} value={pl._id}>{pl.name} - ₹{pl.price}/{pl.billingInterval}</option>)}
                </select>
              </div>

              {itemType === "product" && products.find(p => p._id === selectedProductId)?.variants?.length > 0 && (
                <div style={{ flex: 1.5, minWidth: "160px" }}>
                  <label className="form-label">Variant</label>
                  <select
                    className="form-control"
                    value={selectedVariantId}
                    onChange={e => applyProductSelection(selectedProductId, e.target.value)}
                  >
                    <option value="">Base Setup (+₹0)</option>
                    {products.find(p => p._id === selectedProductId).variants.map(v => (
                      <option key={v.variantId} value={v.variantId}>{v.name} (+₹{v.additionalPrice})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ width: "80px" }}>
                <label className="form-label">Qty</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  className="form-control"
                  value={itemQuantity}
                  onChange={e => setItemQuantity(e.target.value)}
                />
              </div>

              <div style={{ width: "110px" }}>
                <label className="form-label">Unit Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="form-control"
                  value={itemUnitPrice}
                  onChange={e => setItemUnitPrice(e.target.value)}
                />
              </div>

              <div>
                <button type="button" className="btn btn-primary" onClick={handleAddItem}>
                  <PlusCircle size={16} /> Add Item
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Discount & Totals */}
        <div className="card" style={{ background: "#f8fafc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px" }}>
            <div style={{ flex: 1, minWidth: "260px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>
                Section 4: Discount & Coupon Vouchers
              </h2>
              <div className="form-group">
                <label className="form-label">Select Eligible Discount (Adapter M8)</label>
                <select
                  className="form-control"
                  value={formData.discountCode}
                  onChange={e => setFormData(prev => ({ ...prev, discountCode: e.target.value }))}
                >
                  <option value="">-- No Discount Applied --</option>
                  {discounts.map(d => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name} ({d.type === "percentage" ? `${d.value}% Off` : `₹${d.value} Off`})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Totals Summary */}
            <div style={{ width: "320px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                Summary Calculations
              </h3>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.875rem" }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(totals.subtotal)}</span>
              </div>

              {totals.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.875rem", color: "#16a34a" }}>
                  <span>Discount:</span>
                  <span style={{ fontWeight: 600 }}>-{formatCurrency(totals.discountAmount)}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.875rem" }}>
                <span>Taxable Amount:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(totals.taxableAmount)}</span>
              </div>

              {totals.taxBreakdown.map((t, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: "0.8rem", color: "#64748b" }}>
                  <span>{t.name} ({t.rate}%):</span>
                  <span>{formatCurrency(t.amount)}</span>
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0 2px",
                  borderTop: "2px solid #0f172a",
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  color: "#1e40af"
                }}
              >
                <span>Grand Total:</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Notes & Terms */}
        <div className="card">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>
            Section 5: Notes & Terms
          </h2>

          <div className="form-group">
            <label className="form-label">Customer-Facing Notes</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Notes printed on customer quotation..."
              value={formData.customerNotes}
              onChange={e => setFormData(prev => ({ ...prev, customerNotes: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Internal Sales Notes</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Internal tracking notes (invisible to customer)..."
              value={formData.internalNotes}
              onChange={e => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Terms and Conditions</label>
            <textarea
              className="form-control"
              rows="3"
              value={formData.termsAndConditions}
              onChange={e => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowPreview(true)}
            disabled={formData.lineItems.length === 0}
          >
            <Eye size={16} /> Preview Proposal
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>

      {/* Modal Preview */}
      {showPreview && (
        <QuotationPreviewModal
          quotation={{
            quotationNumber: initialData?.quotationNumber || "QUO-DRAFT",
            quotationDate: formData.quotationDate,
            validUntil: formData.validUntil,
            customerSnapshot: selectedCustomer,
            lineItems: formData.lineItems,
            termsAndConditions: formData.termsAndConditions,
            customerNotes: formData.customerNotes,
            status: "draft",
            ...totals
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default QuotationForm;
