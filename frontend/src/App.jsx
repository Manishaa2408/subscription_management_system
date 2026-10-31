import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

// M5 - Quotation Templates
import TemplateList from "./pages/quotationTemplates/TemplateList";
import CreateTemplate from "./pages/quotationTemplates/CreateTemplate";
import EditTemplate from "./pages/quotationTemplates/EditTemplate";
import TemplateDetails from "./pages/quotationTemplates/TemplateDetails";

// M6 - Quotation Management
import QuotationDashboard from "./pages/quotations/QuotationDashboard";
import CreateQuotation from "./pages/quotations/CreateQuotation";
import EditQuotation from "./pages/quotations/EditQuotation";
import QuotationDetails from "./pages/quotations/QuotationDetails";
import CustomerPortal from "./pages/quotations/CustomerPortal";

// M7 - Subscription Lifecycle Management
import SubscriptionDashboard from "./pages/subscriptions/SubscriptionDashboard";
import CreateSubscription from "./pages/subscriptions/CreateSubscription";
import SubscriptionDetails from "./pages/subscriptions/SubscriptionDetails";
import CustomerSubscriptions from "./pages/subscriptions/CustomerSubscriptions";

// M8 - Discount Management
import DiscountDashboard from "./pages/discounts/DiscountDashboard";
import CreateDiscount from "./pages/discounts/CreateDiscount";
import EditDiscount from "./pages/discounts/EditDiscount";
import DiscountDetails from "./pages/discounts/DiscountDetails";
import DiscountTester from "./pages/discounts/DiscountTester";

export const App = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/discounts" replace />} />

          {/* M8 Discount Management Routes */}
          <Route path="/discounts" element={<DiscountDashboard />} />
          <Route path="/discounts/create" element={<CreateDiscount />} />
          <Route path="/discounts/:id" element={<DiscountDetails />} />
          <Route path="/discounts/:id/edit" element={<EditDiscount />} />
          <Route path="/discounts/tester" element={<DiscountTester />} />
          <Route path="/admin/discounts" element={<DiscountDashboard />} />

          {/* M7 Subscription Lifecycle Routes */}
          <Route path="/subscriptions" element={<SubscriptionDashboard />} />
          <Route path="/subscriptions/create" element={<CreateSubscription />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetails />} />
          <Route path="/portal/subscriptions" element={<CustomerSubscriptions />} />
          <Route path="/admin/subscriptions" element={<SubscriptionDashboard />} />

          {/* M6 Quotation Management Routes */}
          <Route path="/quotations" element={<QuotationDashboard />} />
          <Route path="/quotations/create" element={<CreateQuotation />} />
          <Route path="/quotations/:id" element={<QuotationDetails />} />
          <Route path="/quotations/:id/edit" element={<EditQuotation />} />
          <Route path="/portal/quotations" element={<CustomerPortal />} />

          {/* M5 Quotation Template Routes */}
          <Route path="/templates" element={<TemplateList />} />
          <Route path="/templates/create" element={<CreateTemplate />} />
          <Route path="/templates/:id" element={<TemplateDetails />} />
          <Route path="/templates/:id/edit" element={<EditTemplate />} />

          {/* Path Aliases */}
          <Route path="/admin/quotation-templates" element={<TemplateList />} />
          <Route path="/admin/quotations" element={<QuotationDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/subscriptions" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
