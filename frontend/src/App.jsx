import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import TemplateList from "./pages/quotationTemplates/TemplateList";
import CreateTemplate from "./pages/quotationTemplates/CreateTemplate";
import EditTemplate from "./pages/quotationTemplates/EditTemplate";
import TemplateDetails from "./pages/quotationTemplates/TemplateDetails";

export const App = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/templates" replace />} />

          {/* Standard M5 Template Routes */}
          <Route path="/templates" element={<TemplateList />} />
          <Route path="/templates/create" element={<CreateTemplate />} />
          <Route path="/templates/:id" element={<TemplateDetails />} />
          <Route path="/templates/:id/edit" element={<EditTemplate />} />

          {/* Admin Path Aliases */}
          <Route path="/admin/quotation-templates" element={<TemplateList />} />
          <Route path="/admin/quotation-templates/create" element={<CreateTemplate />} />
          <Route path="/admin/quotation-templates/:id" element={<TemplateDetails />} />
          <Route path="/admin/quotation-templates/:id/edit" element={<EditTemplate />} />

          {/* Staff Path Aliases */}
          <Route path="/staff/quotation-templates" element={<TemplateList />} />
          <Route path="/staff/quotation-templates/:id" element={<TemplateDetails />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/templates" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
