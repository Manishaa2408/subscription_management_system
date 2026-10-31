import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const PRESET_USERS = [
  {
    key: 'admin',
    id: 'usr_admin_001',
    role: 'admin',
    name: 'Admin (Brightloop)',
    email: 'admin@brightloop.io',
    description: 'Full access: manage invoices, issue, cancel, tax configurations'
  },
  {
    key: 'staff',
    id: 'usr_staff_001',
    role: 'staff',
    name: 'Ops Staff (Brightloop)',
    email: 'staff@brightloop.io',
    description: 'Operational view: inspect invoices, view breakdown, print. Read-only taxes'
  },
  {
    key: 'customer1',
    id: 'cust_001_intra_kerala',
    role: 'customer',
    name: 'Kochi Tech Labs (Customer - Intra Kerala)',
    email: 'finance@kochitechlabs.com',
    description: 'Customer view: strictly isolated to own invoices (CGST + SGST)'
  },
  {
    key: 'customer2',
    id: 'cust_002_inter_bengaluru',
    role: 'customer',
    name: 'Bengaluru Cloud (Customer - Inter Karnataka)',
    email: 'accounts@bengalurucloud.io',
    description: 'Customer view: strictly isolated to own invoices (IGST 18%)'
  }
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('brightloop_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return PRESET_USERS[0]; // Default to Admin
  });

  useEffect(() => {
    localStorage.setItem('brightloop_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const switchUser = (userKey) => {
    const user = PRESET_USERS.find(u => u.key === userKey);
    if (user) {
      setCurrentUser(user);
    }
  };

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'x-mock-role': currentUser.role,
      'x-mock-user-id': currentUser.id,
      'x-mock-user-email': currentUser.email
    };
  };

  return (
    <AuthContext.Provider value={{ currentUser, switchUser, getAuthHeaders, PRESET_USERS }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
