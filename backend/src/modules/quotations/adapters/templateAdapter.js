import quotationTemplateService from "../../quotationTemplates/services/quotationTemplateService.js";

/**
 * Template Adapter for Quotation Management (M6)
 * Integrates directly with our M5 Quotation Template module!
 */

export const getTemplates = async () => {
  const result = await quotationTemplateService.getAllTemplates({ status: "active" }, "staff");
  return result.templates || [];
};

export const getTemplateById = async (templateId) => {
  return await quotationTemplateService.getTemplateById(templateId, "staff");
};

export const getTemplateDetails = async (templateId) => {
  return await quotationTemplateService.getTemplateForQuotation(templateId);
};

export default {
  getTemplates,
  getTemplateById,
  getTemplateDetails
};
