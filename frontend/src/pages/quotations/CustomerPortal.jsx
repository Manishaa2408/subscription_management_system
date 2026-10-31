import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import quotationService from "../../services/quotationService";
import { useAuth } from "../../context/AuthContext";
import QuotationStatusBadge from "../../components/quotations/QuotationStatusBadge";
import QuotationPreviewModal from "../../components/quotations/QuotationPreviewModal";
import { Eye, FileText, CheckCircle, XCircle, Clock, ShieldCheck, Printer } from "lucide-react";

export const CustomerPortal = () => {
  const navigate = useNavigate();
  const { role, isCustomer } = useAuth();

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const fetchMyQuotations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await quotationService.getQuotations();
      setQuotations(res.data.quotations || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyQuotations();
  }, [role]);

  const handleAccept = async (id) => {
    if (!window.confirm("Do you formally accept this proposal and agree to proceed?")) return;
    try {
      await quotationService.acceptQuotation(id);
      setSelectedQuotation(null);
      fetchMyQuotations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept quotation");
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Please state why you are declining this proposal:");
    if (reason === null) return;
    try {
      await quotationService.rejectQuotation(id, reason);
      setSelectedQuotation(null);
      fetchMyQuotations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject quotation");
    }
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Quotation Portal</h1>
          <p className="page-subtitle">
            Review commercial proposals from Brightloop Software and accept or decline terms.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "150px" }}>Quotation #</th>
                <th>Proposal Description</th>
                <th style={{ width: "120px" }}>Date</th>
                <th style={{ width: "130px" }}>Valid Until</th>
                <th style={{ width: "140px", textAlign: "right" }}>Total Amount</th>
                <th style={{ width: "110px", textAlign: "center" }}>Status</th>
                <th style={{ width: "200px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    Loading your quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                    No quotations on file. Check back soon or contact your sales account manager.
                  </td>
                </tr>
              ) : (
                quotations.map(q => (
                  <tr key={q._id}>
                    <td style={{ fontWeight: 700, color: "#1e40af" }}>
                      <Link to={`/quotations/${q._id}`}>{q.quotationNumber}</Link>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {q.lineItems?.[0]?.description || "Commercial Software Proposal"}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {q.lineItems?.length} item(s) included
                      </div>
                    </td>

                    <td style={{ fontSize: "0.85rem", color: "#475569" }}>
                      {new Date(q.quotationDate).toLocaleDateString()}
                    </td>

                    <td style={{ fontSize: "0.85rem", color: q.status === "expired" ? "#dc2626" : "#475569" }}>
                      {new Date(q.validUntil).toLocaleDateString()}
                    </td>

                    <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                      {formatCurrency(q.grandTotal)}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <QuotationStatusBadge status={q.status} />
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Review Proposal"
                          onClick={() => setSelectedQuotation(q)}
                        >
                          <Eye size={14} /> Review
                        </button>

                        <a
                          href={`/api/quotations/${q._id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                          title="Print / Save PDF"
                        >
                          <Printer size={14} />
                        </a>

                        {q.status === "sent" && (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ background: "#16a34a" }}
                              title="Accept Quotation"
                              onClick={() => handleAccept(q._id)}
                            >
                              <CheckCircle size={14} /> Accept
                            </button>

                            <button
                              className="btn btn-outline btn-sm"
                              style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                              title="Decline Proposal"
                              onClick={() => handleReject(q._id)}
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Accept Modal */}
      {selectedQuotation && (
        <QuotationPreviewModal
          quotation={selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
          onAccept={() => handleAccept(selectedQuotation._id)}
          onReject={() => handleReject(selectedQuotation._id)}
          isCustomer={true}
        />
      )}
    </div>
  );
};

export default CustomerPortal;
