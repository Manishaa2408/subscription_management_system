import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Read saved role or default to 'admin'
  const [role, setRole] = useState(() => {
    return localStorage.getItem("brightloop_dev_role") || "admin";
  });

  const changeRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem("brightloop_dev_role", newRole);
  };

  return (
    <AuthContext.Provider value={{ role, changeRole, isAdmin: role === "admin", isStaff: role === "staff", isCustomer: role === "customer" }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
