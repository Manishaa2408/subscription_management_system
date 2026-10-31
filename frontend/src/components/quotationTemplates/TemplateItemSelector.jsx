import React, { useState, useEffect } from "react";
import quotationTemplateService from "../../services/quotationTemplateService";
import { PlusCircle, Layers, Box } from "lucide-react";

export const TemplateItemSelector = ({ onAddItem }) => {
  const [itemType, setItemType] = useState("product");
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedId, setSelectedId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(18);

  // Load catalog dynamically from backend adapters
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        const [prodList, planList] = await Promise.all([
          quotationTemplateService.getCatalogProducts(),
          quotationTemplateService.getCatalogPlans()
        ]);
        setProducts(prodList || []);
        setPlans(planList || []);

        if (prodList && prodList.length > 0) {
          applySelectedProduct(prodList[0]._id, "", prodList);
        }
      } catch (err) {
        console.error("Failed to load catalog data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  // When switching between product and plan
  const handleTypeChange = (type) => {
    setItemType(type);
    setSelectedVariantId("");
    if (type === "product" && products.length > 0) {
      applySelectedProduct(products[0]._id, "", products);
    } else if (type === "plan" && plans.length > 0) {
      applySelectedPlan(plans[0]._id, plans);
    }
  };

  const applySelectedProduct = (prodId, varId, prodSource = products) => {
    setSelectedId(prodId);
    setSelectedVariantId(varId);
    const prod = prodSource.find((p) => p._id === prodId);
    if (!prod) return;

    let price = prod.basePrice || 0;
    if (varId && prod.variants) {
      const v = prod.variants.find((vr) => vr.variantId === varId);
      if (v) price += v.additionalPrice || 0;
    }
    setUnitPrice(price);
    setTaxRate(prod.taxRate !== undefined ? prod.taxRate : 18);
  };

  const applySelectedPlan = (planId, planSource = plans) => {
    setSelectedId(planId);
    setSelectedVariantId("");
    const pl = planSource.find((p) => p._id === planId);
    if (!pl) return;

    setUnitPrice(pl.price || 0);
    setTaxRate(pl.taxRate !== undefined ? pl.taxRate : 18);
  };

  const handleProductChange = (e) => {
    applySelectedProduct(e.target.value, "");
  };

  const handleVariantChange = (e) => {
    applySelectedProduct(selectedId, e.target.value);
  };

  const handlePlanChange = (e) => {
    applySelectedPlan(e.target.value);
  };

  const handleAdd = () => {
    if (!selectedId) return;

    let itemName = "";
    let description = "";

    if (itemType === "product") {
      const prod = products.find((p) => p._id === selectedId);
      if (!prod) return;
      itemName = prod.name;
      description = prod.description || "";
      if (selectedVariantId && prod.variants) {
        const v = prod.variants.find((vr) => vr.variantId === selectedVariantId);
        if (v) {
          itemName += ` (${v.name})`;
        }
      }
    } else {
      const pl = plans.find((p) => p._id === selectedId);
      if (!pl) return;
      itemName = `${pl.name} [${pl.billingInterval}]`;
      description = pl.description || "";
    }

    const qty = Math.max(0.01, parseFloat(quantity) || 1);
    const price = Math.max(0, parseFloat(unitPrice) || 0);
    const tax = Math.max(0, parseFloat(taxRate) || 0);

    const subtotal = Math.round(qty * price * 100) / 100;
    const taxAmt = Math.round((subtotal * tax) / 100 * 100) / 100;
    const lineTotal = Math.round((subtotal + taxAmt) * 100) / 100;

    onAddItem({
      itemType,
      itemId: selectedId,
      variantId: selectedVariantId || null,
      itemName,
      description,
      quantity: qty,
      unitPrice: price,
      taxRate: tax,
      lineSubtotal: subtotal,
      taxAmount: taxAmt,
      lineTotal
    });

    // Reset default quantity
    setQuantity(1);
  };

  const currentProduct = itemType === "product" ? products.find((p) => p._id === selectedId) : null;

  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "16px",
        marginTop: "16px"
      }}
    >
      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b", marginBottom: "12px" }}>
        Add Item from Catalog
      </div>

      {loading ? (
        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Loading catalog items...</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          {/* Type Toggle */}
          <div style={{ width: "160px" }}>
            <label className="form-label">Type</label>
            <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
              <button
                type="button"
                onClick={() => handleTypeChange("product")}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  fontSize: "0.8rem",
                  background: itemType === "product" ? "#1e40af" : "#fff",
                  color: itemType === "product" ? "#fff" : "#475569",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px"
                }}
              >
                <Box size={14} /> Product
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("plan")}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  fontSize: "0.8rem",
                  background: itemType === "plan" ? "#1e40af" : "#fff",
                  color: itemType === "plan" ? "#fff" : "#475569",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px"
                }}
              >
                <Layers size={14} /> Plan
              </button>
            </div>
          </div>

          {/* Item Selector */}
          <div style={{ flex: 2, minWidth: "220px" }}>
            <label className="form-label">{itemType === "product" ? "Product" : "Subscription Plan"}</label>
            <select
              className="form-control"
              value={selectedId}
              onChange={itemType === "product" ? handleProductChange : handlePlanChange}
            >
              {itemType === "product"
                ? products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Base: ₹{p.basePrice})
                    </option>
                  ))
                : plans.map((pl) => (
                    <option key={pl._id} value={pl._id}>
                      {pl.name} - ₹{pl.price}/{pl.billingInterval}
                    </option>
                  ))}
            </select>
          </div>

          {/* Product Variant (If applicable) */}
          {itemType === "product" && currentProduct?.variants?.length > 0 && (
            <div style={{ flex: 1.5, minWidth: "180px" }}>
              <label className="form-label">Variant</label>
              <select className="form-control" value={selectedVariantId} onChange={handleVariantChange}>
                <option value="">Base / Standard (+₹0)</option>
                {currentProduct.variants.map((v) => (
                  <option key={v.variantId} value={v.variantId}>
                    {v.name} (+₹{v.additionalPrice})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div style={{ width: "90px" }}>
            <label className="form-label">Quantity</label>
            <input
              type="number"
              step="any"
              min="0.01"
              className="form-control"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Unit Price */}
          <div style={{ width: "110px" }}>
            <label className="form-label">Unit Price (₹)</label>
            <input
              type="number"
              step="any"
              min="0"
              className="form-control"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>

          {/* Tax Rate */}
          <div style={{ width: "90px" }}>
            <label className="form-label">Tax (%)</label>
            <input
              type="number"
              step="any"
              min="0"
              max="100"
              className="form-control"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>

          {/* Add Button */}
          <div>
            <button type="button" className="btn btn-primary" onClick={handleAdd}>
              <PlusCircle size={16} /> Add Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateItemSelector;
