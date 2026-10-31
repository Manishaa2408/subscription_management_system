import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const PRESET_USERS = [
  {
    key: 'admin',
    id: 'usr_admin_001',
    role: 'admin',
    name: 'Brightloop Admin',
    email: 'admin@brightloop.com',
    fullName: 'Brightloop Admin',
    description: 'Full access: quotations, subscriptions, invoices, payments, taxes, analytics'
  },
  {
    key: 'staff',
    id: 'usr_staff_001',
    role: 'staff',
    name: 'Operations Staff',
    email: 'staff@brightloop.com',
    fullName: 'Operations Staff',
    description: 'Staff view: manage quotations, inspect subscriptions, billing, invoices'
  },
  {
    key: 'customer1',
    id: 'cust_001_intra_kerala',
    role: 'customer',
    name: 'Kochi Tech Labs (Customer)',
    email: 'finance@kochitechlabs.com',
    fullName: 'Kochi Tech Labs',
    description: 'Customer view: customer portal, my quotations, invoices, payments'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('brightloop_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return PRESET_USERS[0];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync current user to local storage and dev header
  useEffect(() => {
    if (user) {
      localStorage.setItem('brightloop_current_user', JSON.stringify(user));
      localStorage.setItem('brightloop_dev_role', user.role || 'admin');
    }
  }, [user]);

  // Try to load real session from backend cookie if available
  const loadUser = async () => {
    try {
      const res = await authService.getMe();
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      // Keep preset user as fallback
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const switchUser = (userKey) => {
    const selected = PRESET_USERS.find((u) => u.key === userKey);
    if (selected) {
      setUser(selected);
      localStorage.setItem('brightloop_current_user', JSON.stringify(selected));
      localStorage.setItem('brightloop_dev_role', selected.role);
    }
  };

  const login = async (credentials) => {
    setError(null);
    try {
      const res = await authService.login(credentials);
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error('Invalid user payload received from server');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const res = await authService.register(userData);
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error('Registration failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      setUser(PRESET_USERS[0]);
    }
  };

  const getAuthHeaders = () => {
    const active = user || PRESET_USERS[0];
    return {
      'Content-Type': 'application/json',
      'x-mock-role': active.role,
      'x-mock-user-id': active.id || active._id,
      'x-mock-user-email': active.email,
      'x-dev-role': active.role
    };
  };

  const activeUser = user || PRESET_USERS[0];
  const role = activeUser.role || 'admin';

  const value = {
    user: activeUser,
    currentUser: activeUser,
    role,
    isAdmin: role === 'admin',
    isStaff: role === 'staff',
    isCustomer: role === 'customer',
    isAuthenticated: true,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser: loadUser,
    switchUser,
    PRESET_USERS,
    getAuthHeaders
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
