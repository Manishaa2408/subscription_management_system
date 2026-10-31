import mongoose from "mongoose";

/**
 * Temporary development seed catalog for Products (Simulates M3)
 * Contains base products, variants, and additional pricing.
 * These IDs are valid MongoDB ObjectIds.
 */
export const SAMPLE_PRODUCTS = [
  {
    _id: "67246830a3f65e2a84b11001",
    name: "Odoo Implementation Service",
    code: "PROD-IMPL-01",
    description: "End-to-end configuration, migration and onboarding setup",
    basePrice: 3000,
    taxRate: 18,
    status: "active",
    variants: [
      {
        variantId: "VAR-STD",
        name: "Standard Setup (up to 5 users)",
        additionalPrice: 0
      },
      {
        variantId: "VAR-ENT",
        name: "Enterprise Multi-Company Setup",
        additionalPrice: 2000
      }
    ]
  },
  {
    _id: "67246830a3f65e2a84b11002",
    name: "Staff Training Workshop",
    code: "PROD-TRAIN-01",
    description: "Hands-on guided user training sessions (per batch)",
    basePrice: 1000,
    taxRate: 18,
    status: "active",
    variants: [
      {
        variantId: "VAR-REMOTE",
        name: "Remote / Online (4 Hours)",
        additionalPrice: 0
      },
      {
        variantId: "VAR-ONSITE",
        name: "Onsite In-Person (Full Day)",
        additionalPrice: 800
      }
    ]
  },
  {
    _id: "67246830a3f65e2a84b11003",
    name: "Dedicated SLA Support Add-on",
    code: "PROD-SUPP-01",
    description: "24/7 Priority ticket and phone resolution",
    basePrice: 500,
    taxRate: 18,
    status: "active",
    variants: []
  },
  {
    _id: "67246830a3f65e2a84b11004",
    name: "Data Migration & Sanitization Service",
    code: "PROD-MIGR-01",
    description: "Legacy spreadsheet & database cleanup and import",
    basePrice: 1500,
    taxRate: 18,
    status: "active",
    variants: [
      {
        variantId: "VAR-CSV",
        name: "CSV / Excel clean import",
        additionalPrice: 0
      },
      {
        variantId: "VAR-SQL",
        name: "Legacy SQL schema migration",
        additionalPrice: 1200
      }
    ]
  },
  {
    _id: "67246830a3f65e2a84b11005",
    name: "Custom Workflow Module Development",
    code: "PROD-DEV-01",
    description: "Bespoke business rules & automated trigger scripts",
    basePrice: 4000,
    taxRate: 18,
    status: "active",
    variants: []
  }
];

/**
 * Product Catalog Adapter Interface:
 * - getProducts()
 * - getProductById(id)
 * - getProductVariants(productId)
 * - validateProduct(productId)
 * - calculateVariantPrice(productId, variantId)
 */

export const getProducts = async () => {
  return SAMPLE_PRODUCTS.filter(p => p.status === "active");
};

export const getProductById = async (id) => {
  if (!id) return null;
  const strId = id.toString();
  return SAMPLE_PRODUCTS.find(p => p._id.toString() === strId) || null;
};

export const getProductVariants = async (productId) => {
  const product = await getProductById(productId);
  return product ? (product.variants || []) : [];
};

export const validateProduct = async (productId) => {
  const product = await getProductById(productId);
  if (!product) {
    return { valid: false, message: `Product with ID '${productId}' not found in catalog` };
  }
  if (product.status !== "active") {
    return { valid: false, message: `Product '${product.name}' is inactive` };
  }
  return { valid: true, product };
};

export const calculateVariantPrice = async (productId, variantId) => {
  const { valid, product, message } = await validateProduct(productId);
  if (!valid) {
    throw new Error(message);
  }

  let finalPrice = product.basePrice;
  let variantName = null;

  if (variantId) {
    const variant = (product.variants || []).find(v => v.variantId === variantId);
    if (!variant) {
      throw new Error(`Variant '${variantId}' does not belong to product '${product.name}'`);
    }
    finalPrice += (variant.additionalPrice || 0);
    variantName = variant.name;
  }

  return {
    basePrice: product.basePrice,
    additionalPrice: variantId ? (finalPrice - product.basePrice) : 0,
    finalUnitPrice: finalPrice,
    variantName,
    taxRate: product.taxRate || 0
  };
};

export default {
  getProducts,
  getProductById,
  getProductVariants,
  validateProduct,
  calculateVariantPrice
};
