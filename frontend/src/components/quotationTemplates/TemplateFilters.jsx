import React from "react";
import { Search, Filter, RotateCcw } from "lucide-react";

export const TemplateFilters = ({
  search,
  setSearch,
  status,
  setStatus,
  onReset,
  showStatusFilter = true
}) => {
  return (
    <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search Input */}
        <div style={{ position: "relative", flex: "1", minWidth: "240px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8"
            }}
          />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: "36px" }}
            placeholder="Search by template name or code (e.g. QT-001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        {showStatusFilter && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={16} style={{ color: "#64748b" }} />
            <select
              className="form-control"
              style={{ width: "160px" }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        )}

        {/* Reset */}
        {(search || status) && (
          <button className="btn btn-outline btn-sm" onClick={onReset} title="Reset Filters">
            <RotateCcw size={14} /> Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default TemplateFilters;
