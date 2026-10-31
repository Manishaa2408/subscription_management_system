const TaxConfiguration = require('../models/TaxConfiguration');
const { calculateLineTax, aggregateTaxBreakdown } = require('../services/taxCalculationService');

/**
 * Create a new tax configuration
 * POST /api/tax-configurations (Admin)
 */
const createTaxConfiguration = async (req, res) => {
  try {
    const { name, code, description, rate, taxType, applicability, effectiveFrom, effectiveTo } = req.body;

    if (!name || !code || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, and rate are required',
        errors: ['Missing required fields']
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await TaxConfiguration.findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Tax configuration with code "${cleanCode}" already exists`,
        errors: [`Duplicate code: ${cleanCode}`]
      });
    }

    const taxConfig = new TaxConfiguration({
      name: name.trim(),
      code: cleanCode,
      description: description || '',
      rate: Number(rate),
      taxType: taxType || 'percentage',
      applicability: applicability || 'all',
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      isActive: true,
      createdBy: req.user ? req.user.email : 'admin@brightloop.io',
      updatedBy: req.user ? req.user.email : 'admin@brightloop.io'
    });

    await taxConfig.save();

    return res.status(201).json({
      success: true,
      message: 'Tax configuration created successfully',
      data: taxConfig
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * List tax configurations with optional search and filter
 * GET /api/tax-configurations (Admin, Staff)
 */
const getTaxConfigurations = async (req, res) => {
  try {
    const { isActive, search } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { code: { $regex: term, $options: 'i' } }
      ];
    }

    const configs = await TaxConfiguration.find(filter).sort({ rate: 1, name: 1 });

    return res.status(200).json({
      success: true,
      message: 'Tax configurations retrieved successfully',
      data: configs
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * Get tax configuration by ID
 * GET /api/tax-configurations/:id (Admin, Staff)
 */
const getTaxConfigurationById = async (req, res) => {
  try {
    const config = await TaxConfiguration.findById(req.params.id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Tax configuration not found',
        errors: [`No tax configuration found with ID ${req.params.id}`]
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tax configuration retrieved successfully',
      data: config
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * Update tax configuration
 * PUT /api/tax-configurations/:id (Admin)
 */
const updateTaxConfiguration = async (req, res) => {
  try {
    const config = await TaxConfiguration.findById(req.params.id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Tax configuration not found',
        errors: []
      });
    }

    const { name, description, rate, taxType, applicability, effectiveFrom, effectiveTo, isActive } = req.body;

    if (name) config.name = name.trim();
    if (description !== undefined) config.description = description.trim();
    if (rate !== undefined) config.rate = Number(rate);
    if (taxType) config.taxType = taxType;
    if (applicability) config.applicability = applicability;
    if (effectiveFrom) config.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo !== undefined) config.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;
    if (isActive !== undefined) config.isActive = Boolean(isActive);

    config.updatedBy = req.user ? req.user.email : 'admin@brightloop.io';
    await config.save();

    return res.status(200).json({
      success: true,
      message: 'Tax configuration updated successfully',
      data: config
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * Toggle active/inactive status
 * PATCH /api/tax-configurations/:id/status (Admin)
 */
const toggleTaxStatus = async (req, res) => {
  try {
    const config = await TaxConfiguration.findById(req.params.id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Tax configuration not found',
        errors: []
      });
    }

    const { isActive } = req.body;
    config.isActive = isActive !== undefined ? Boolean(isActive) : !config.isActive;
    config.updatedBy = req.user ? req.user.email : 'admin@brightloop.io';
    await config.save();

    return res.status(200).json({
      success: true,
      message: `Tax configuration "${config.name}" is now ${config.isActive ? 'active' : 'inactive'}`,
      data: config
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * Tax preview calculation without persisting an invoice
 * POST /api/tax-configurations/calculate (Admin, Staff)
 */
const previewTaxCalculation = async (req, res) => {
  try {
    const { items, supplierState = 'Kerala', customerState = 'Kerala' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required with at least one item',
        errors: []
      });
    }

    const calculatedLines = [];
    let grossTotal = 0;
    let discountTotal = 0;
    let taxableTotal = 0;

    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const unit = Number(item.unitPrice) || 0;
      const gross = Math.round(qty * unit * 100) / 100;
      
      let disc = 0;
      if (item.discountType === 'fixed') {
        disc = Math.min(gross, Number(item.discountValue) || 0);
      } else {
        const rate = Number(item.discountValue || item.discountPercentage) || 0;
        disc = Math.round((gross * rate) / 100 * 100) / 100;
      }

      const taxable = Math.max(0, Math.round((gross - disc) * 100) / 100);

      const lineTax = calculateLineTax({
        taxableAmount: taxable,
        taxRate: Number(item.taxRate) || 18,
        taxCode: item.taxCode || 'GST18',
        supplierState,
        customerState
      });

      grossTotal += gross;
      discountTotal += disc;
      taxableTotal += taxable;

      calculatedLines.push({
        ...item,
        grossAmount: gross,
        discountAmount: disc,
        taxableAmount: taxable,
        ...lineTax
      });
    }

    const breakdown = aggregateTaxBreakdown(calculatedLines);
    const grandTotal = Math.round((taxableTotal + breakdown.totalTax) * 100) / 100;

    return res.status(200).json({
      success: true,
      message: 'Tax calculation completed',
      data: {
        lines: calculatedLines,
        summary: {
          subtotal: Math.round(grossTotal * 100) / 100,
          discountTotal: Math.round(discountTotal * 100) / 100,
          taxableAmount: Math.round(taxableTotal * 100) / 100,
          cgstTotal: breakdown.cgstTotal,
          sgstTotal: breakdown.sgstTotal,
          igstTotal: breakdown.igstTotal,
          taxTotal: breakdown.totalTax,
          grandTotal,
          ratesSummary: breakdown.ratesSummary
        }
      }
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

module.exports = {
  createTaxConfiguration,
  getTaxConfigurations,
  getTaxConfigurationById,
  updateTaxConfiguration,
  toggleTaxStatus,
  previewTaxCalculation
};
