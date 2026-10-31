import React from "react";

export const TemplateStatusBadge = ({ status }) => {
  const isAct = status === "active";
  return (
    <span className={`badge ${isAct ? "badge-active" : "badge-inactive"}`}>
      {status || "active"}
    </span>
  );
};

export default TemplateStatusBadge;
