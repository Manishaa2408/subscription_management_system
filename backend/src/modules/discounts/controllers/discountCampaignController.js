import discountCampaignService from "../services/discountCampaignService.js";

/**
 * Discount Campaign Controller (M8)
 * Adheres to standard API response contract:
 * Success: { success: true, message: "...", data: { ... } }
 * Error:   { success: false, message: "...", errors: [ ... ] }
 */

export const createCampaign = async (req, res, next) => {
  try {
    const campaign = await discountCampaignService.createCampaign(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: `Discount campaign '${campaign.name}' created successfully`,
      data: { campaign }
    });
  } catch (error) {
    next(error);
  }
};

export const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await discountCampaignService.getCampaigns(req.query);
    return res.status(200).json({
      success: true,
      message: "Discount campaigns retrieved successfully",
      data: { campaigns }
    });
  } catch (error) {
    next(error);
  }
};

export const getCampaignById = async (req, res, next) => {
  try {
    const result = await discountCampaignService.getCampaignById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Discount campaign details retrieved",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const campaign = await discountCampaignService.updateCampaign(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: `Discount campaign '${campaign.name}' updated successfully`,
      data: { campaign }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCampaignStatus = async (req, res, next) => {
  try {
    const campaign = await discountCampaignService.updateCampaignStatus(req.params.id, req.body.status, req.user);
    return res.status(200).json({
      success: true,
      message: `Campaign status updated to '${campaign.status}'`,
      data: { campaign }
    });
  } catch (error) {
    next(error);
  }
};

export const archiveCampaign = async (req, res, next) => {
  try {
    const campaign = await discountCampaignService.archiveCampaign(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: `Campaign '${campaign.name}' archived`,
      data: { campaign }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  updateCampaignStatus,
  archiveCampaign
};
