import DiscountCampaign from "../models/DiscountCampaign.js";
import Discount from "../models/Discount.js";
import DiscountActivity from "../models/DiscountActivity.js";

/**
 * Discount Campaign Service (M8)
 * Manages promotional campaigns and their attached discount codes.
 */

export const createCampaign = async (payload, userContext = {}) => {
  const campaignCode = String(payload.campaignCode || payload.name)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  const existing = await DiscountCampaign.findOne({ campaignCode });
  if (existing) {
    const error = new Error(`Campaign with code '${campaignCode}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const campaign = await DiscountCampaign.create({
    ...payload,
    campaignCode,
    createdBy: userContext.id || null,
    updatedBy: userContext.id || null
  });

  await DiscountActivity.create({
    campaignId: campaign._id,
    action: "campaign_created",
    description: `Created campaign '${campaign.name}' (${campaign.campaignCode})`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "admin"
  });

  return campaign;
};

export const getCampaigns = async (params = {}) => {
  const query = {};
  if (params.status && params.status !== "all") {
    query.status = params.status;
  }
  if (params.search) {
    query.$or = [
      { name: { $regex: params.search, $options: "i" } },
      { campaignCode: { $regex: params.search, $options: "i" } }
    ];
  }

  return await DiscountCampaign.find(query).sort({ createdAt: -1 });
};

export const getCampaignById = async (id) => {
  const campaign = await DiscountCampaign.findById(id);
  if (!campaign) {
    const error = new Error(`Discount campaign '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }
  const attachedDiscounts = await Discount.find({ campaignId: campaign._id });
  return {
    campaign,
    discounts: attachedDiscounts
  };
};

export const updateCampaign = async (id, payload, userContext = {}) => {
  const campaign = await DiscountCampaign.findById(id);
  if (!campaign) {
    const error = new Error(`Discount campaign '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }

  if (payload.campaignCode) {
    const normalizedCode = payload.campaignCode.trim().toUpperCase();
    if (normalizedCode !== campaign.campaignCode) {
      const existing = await DiscountCampaign.findOne({ campaignCode: normalizedCode });
      if (existing) {
        const error = new Error(`Campaign code '${normalizedCode}' is already in use`);
        error.statusCode = 409;
        throw error;
      }
      campaign.campaignCode = normalizedCode;
    }
  }

  if (payload.name) campaign.name = payload.name;
  if (payload.description !== undefined) campaign.description = payload.description;
  if (payload.startDate !== undefined) campaign.startDate = payload.startDate;
  if (payload.endDate !== undefined) campaign.endDate = payload.endDate;
  if (payload.status) campaign.status = payload.status;
  campaign.updatedBy = userContext.id || null;

  await campaign.save();

  await DiscountActivity.create({
    campaignId: campaign._id,
    action: "campaign_updated",
    description: `Updated campaign details for '${campaign.name}'`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "admin"
  });

  return campaign;
};

export const updateCampaignStatus = async (id, status, userContext = {}) => {
  const campaign = await DiscountCampaign.findById(id);
  if (!campaign) {
    const error = new Error(`Discount campaign '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }

  campaign.status = status;
  campaign.updatedBy = userContext.id || null;
  await campaign.save();

  await DiscountActivity.create({
    campaignId: campaign._id,
    action: `campaign_status_${status}`,
    description: `Changed campaign status to '${status}'`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "admin"
  });

  return campaign;
};

export const archiveCampaign = async (id, userContext = {}) => {
  return await updateCampaignStatus(id, "archived", userContext);
};

export default {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  updateCampaignStatus,
  archiveCampaign
};
