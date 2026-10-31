import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Layers, FileText, PlusCircle, ShieldAlert } from "lucide-react";

export const Navbar = () => {
  const { role, changeRole, isAdmin } = useAuth();
  const location = useLocation();

  return (
    <header>
      {/* Development RBAC Simulator Banner */}
      <div className="dev-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldAlert size={15} color="#38bdf8" />
          <span><strong>Dev RBAC Switcher:</strong> Active Role is <code>{role.toUpperCase()}</code></span>
        </div>
        <div className="dev-role-selector">
          <span>Switch Test Role:</span>
          <button
            type="button"
            className={`role-btn ${role === "admin" ? "active" : ""}`}
            onClick={() => changeRole("admin")}
          >
            Admin (Full Access)
          </button>
          <button
            type="button"
            className={`role-btn ${role === "staff" ? "active" : ""}`}
            onClick={() => changeRole("staff")}
          >
            Staff
          </button>
          <button
            type="button"
            className={`role-btn ${role === "customer" ? "active" : ""}`}
            onClick={() => changeRole("customer")}
          >
            Customer (Portal Access)
          </button>
        </div>
      </div>

      {/* Main SaaS Navbar */}
      <nav className="navbar">
        <div className="brand">
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", color: "inherit", textDecoration: "none" }}>
            <Layers size={24} color="#1e40af" />
            <span>Brightloop Software</span>
          </Link>
          <span className="brand-badge">M5 + M6</span>
        </div>

        <div className="nav-links">
          {/* Quotations (M6) */}
          <Link
            to="/quotations"
            className={`btn ${location.pathname.startsWith("/quotations") ? "btn-primary" : "btn-outline"}`}
          >
            <FileText size={16} /> Quotations
          </Link>

          {/* Customer Portal */}
          <Link
            to="/portal/quotations"
            className={`btn ${location.pathname.startsWith("/portal") ? "btn-primary" : "btn-outline"}`}
          >
            Customer Portal
          </Link>

          {/* Quotation Templates (M5) */}
          {!isAdmin && role === "customer" ? null : (
            <Link
              to="/templates"
              className={`btn ${location.pathname.startsWith("/templates") ? "btn-primary" : "btn-outline"}`}
            >
              Templates
            </Link>
          )}

          {/* Create Button */}
          {role !== "customer" && (
            <Link
              to="/quotations/create"
              className="btn btn-primary"
            >
              <PlusCircle size={16} /> New Quotation
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
