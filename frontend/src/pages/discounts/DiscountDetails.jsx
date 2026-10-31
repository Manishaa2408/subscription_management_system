import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Tag, 
  Edit, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Archive, 
  Sparkles,
  Users,
  Layers,
  Megaphone,
  TrendingDown
} from "lucide-react";
import discountService from "../../services/discountService";
import DiscountStatusBadge from "../../components/discounts/DiscountStatusBadge";
import DiscountTimeline from "../../components/discounts/DiscountTimeline";
import DiscountUsageHistory from "../../components/discounts/DiscountUsageHistory";
import DiscountValidationPreview from "../../components/discounts/DiscountValidationPreview";
import { LoadingState } from "../../components/common/LoadingState";
import { useAuth } from "../../context/AuthContext";

export const DiscountDetails = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();

  const [discount, setDiscount] = useState(null);
  const [usages, setUsages] = useState([]);
  const [activities, setActivities] = useState([]);
  const [catalog, setCatalog] = useState({ customers: [], plans: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Tabs: "overview", "usage", "activity", "tester"
  const [activeTab, setActiveTab] = useState("overview");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [discRes, usageRes, actRes, catRes] = await Promise.all([
        discountService.getDiscountById(id),
        discountService.getDiscountUsage(id),
        discountService.getDiscountActivity(id),
        discountService.getCatalogData().catch(() => ({ data: { customers: [], plans: [] } }))
      ]);

      setDiscount(discRes.data?.discount || null);
      setUsages(usageRes.data?.usage || []);
      setActivities(actRes.data?.activity || []);
      setCatalog(catRes.data || { customers: [], plans: [] });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load discount details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusToggle = async () => {
    const newStatus = discount.status === "active" ? "inactive" : "active";
    try {
      await discountService.updateDiscountStatus(discount._id, newStatus);
      setNotification({ type: "success", text: `Discount marked ${newStatus}` });
      loadData();
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setError("Status update failed");
    }
  };

  if (loading) {
    return <LoadingState message="Loading discount details..." />;
  }

  if (error || !discount) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-rose-600 mb-2">Error Loading Discount</h2>
        <p className="text-sm text-slate-500 mb-4">{error || "Discount not found"}</p>
        <Link
          to="/discounts"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Discounts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/discounts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Discounts
        </Link>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-sm font-medium ${notification.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
          {notification.text}
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xl font-bold tracking-wider px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                {discount.code}
              </span>
              <DiscountStatusBadge status={discount.status} />
            </div>

            <h1 className="text-xl font-bold text-slate-900">{discount.name}</h1>
            {discount.description && (
              <p className="text-sm text-slate-500 mt-1">{discount.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <>
                <Link
                  to={`/discounts/${discount._id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>

                <button
                  type="button"
                  onClick={handleStatusToggle}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition border ${
                    discount.status === "active"
                      ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  {discount.status === "active" ? "Pause Coupon" : "Activate Coupon"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Discount Formula</span>
            <span className="font-bold text-emerald-600 text-sm">
              {discount.discountType === "percentage"
                ? `${discount.discountValue}% Off`
                : `₹${discount.discountValue?.toLocaleString()} Flat`}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Maximum Cap</span>
            <span className="font-semibold text-slate-800">
              {discount.maximumDiscount ? `₹${discount.maximumDiscount.toLocaleString()}` : "No Cap"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Min. Order Total</span>
            <span className="font-semibold text-slate-800">
              {discount.minimumPurchase ? `₹${discount.minimumPurchase.toLocaleString()}` : "₹0"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Total Usages</span>
            <span className="font-semibold text-blue-600">
              {discount.usageCount || 0}
              {discount.usageLimits?.maximumTotalUsage ? ` / ${discount.usageLimits.maximumTotalUsage}` : " (unlimited)"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Application Type</span>
            <span className="font-semibold text-slate-800 capitalize">
              {discount.applicationType === "recurring" ? `Recurring (${discount.billingCycles}x)` : "One-Time"}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        {[
          { id: "overview", label: "Rules & Applicability" },
          { id: "tester", label: "Live Coupon Tester", icon: Sparkles },
          { id: "usage", label: `Usage History (${usages.length})` },
          { id: "activity", label: `Audit Trail (${activities.length})` }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 -mb-px ${
                isActive
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Rules */}
      {activeTab === "overview" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Applicability & Eligibility Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block mb-1">Associated Campaign</span>
              <span className="font-semibold text-slate-800 text-sm">
                {discount.campaignId ? (
                  `${discount.campaignId.name} (${discount.campaignId.campaignCode})`
                ) : (
                  "Standalone (No Campaign)"
                )}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Customer Eligibility</span>
              <span className="font-semibold text-slate-800 text-sm capitalize">
                {discount.applicability?.customerType === "new" ? "New Customers Only" :
                 discount.applicability?.customerType === "existing" ? "Existing Customers Only" :
                 "All Registered Customers"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Validity Window</span>
              <span className="font-semibold text-slate-800 text-sm">
                {discount.startDate ? new Date(discount.startDate).toLocaleDateString() : "Immediate"}
                {" — "}
                {discount.endDate ? new Date(discount.endDate).toLocaleDateString() : "No Expiry"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Per-Customer Limit</span>
              <span className="font-semibold text-slate-800 text-sm">
                {discount.usageLimits?.maximumPerCustomer
                  ? `Max ${discount.usageLimits.maximumPerCustomer} redemption(s)`
                  : "No limit per customer"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Stacking Policy</span>
              <span className="font-semibold text-slate-800 text-sm">
                {discount.stacking?.isStackable ? "Stackable with other offers" : "Exclusive (Cannot be combined)"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Live Tester */}
      {activeTab === "tester" && (
        <DiscountValidationPreview
          initialCode={discount.code}
          customers={catalog.customers}
          plans={catalog.plans}
        />
      )}

      {/* Tab 3: Usage History */}
      {activeTab === "usage" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Usage & Redemption History
          </h3>
          <DiscountUsageHistory usages={usages} />
        </div>
      )}

      {/* Tab 4: Audit Activity */}
      {activeTab === "activity" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Audit Activity Trail
          </h3>
          <DiscountTimeline activities={activities} />
        </div>
      )}
    </div>
  );
};

export default DiscountDetails;
