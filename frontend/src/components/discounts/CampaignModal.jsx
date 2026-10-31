import React, { useState } from "react";
import { X, Megaphone, Plus } from "lucide-react";
import discountService from "../../services/discountService";

export const CampaignModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [campaignCode, setCampaignCode] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Campaign name is required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await discountService.createCampaign({
        name,
        campaignCode: campaignCode || undefined,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      });
      if (onSuccess) onSuccess(res.message || "Campaign created successfully");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "480px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Megaphone size={20} color="#2563eb" /> Create Discount Campaign
          </h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label">Campaign Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Diwali Flash Sale 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label">Campaign Code</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. DIWALI_2026 (Auto-generated if left blank)"
              value={campaignCode}
              onChange={(e) => setCampaignCode(e.target.value.toUpperCase())}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Short description of the promotional initiative"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creating..." : "Save Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignModal;
