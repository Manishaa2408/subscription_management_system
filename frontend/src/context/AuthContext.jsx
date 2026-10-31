import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const PRESET_USERS = [
  {
    key: 'admin',
    id: 'usr_admin_001',
    role: 'admin',
    name: 'Admin (Brightloop)',
    email: 'admin@brightloop.io',
    description: 'Full administrative access across all 12 modules'
  },
  {
    key: 'staff',
    id: 'usr_staff_001',
    role: 'staff',
    name: 'Ops Staff (Brightloop)',
    email: 'staff@brightloop.io',
    description: 'Operational view: create quotations, monitor billing runs, view invoices & payments'
  },
  {
    key: 'customer1',
    id: 'cust_001_intra_kerala',
    role: 'customer',
    name: 'Kochi Tech Labs (Customer - Intra Kerala)',
    email: 'finance@kochitechlabs.com',
    description: 'Customer portal: view catalog, accept quotations, view subscriptions & invoices'
  },
  {
    key: 'customer2',
    id: 'cust_002_inter_bengaluru',
    role: 'customer',
    name: 'Bengaluru Cloud (Customer - Inter Karnataka)',
    email: 'accounts@bengalurucloud.io',
    description: 'Customer portal: view catalog, accept quotations, view subscriptions & invoices'
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
    const savedRole = localStorage.getItem('brightloop_dev_role');
    if (savedRole) {
      const match = PRESET_USERS.find((u) => u.role === savedRole);
      if (match) return match;
    }
    return PRESET_USERS[0]; // Default to Admin
  });

  const [realUser, setRealUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync persona to storage
  useEffect(() => {
    localStorage.setItem('brightloop_current_user', JSON.stringify(currentUser));
    localStorage.setItem('brightloop_dev_role', currentUser.role);
  }, [currentUser]);

  // Check backend session on mount if token exists
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await authService.getMe();
        if (res?.data?.user) {
          setRealUser(res.data.user);
          setCurrentUser({
            key: res.data.user.role,
            id: res.data.user._id || res.data.user.id,
            role: res.data.user.role,
            name: res.data.user.fullName || res.data.user.name,
            email: res.data.user.email,
            description: `Logged in as ${res.data.user.fullName}`
          });
        }
      } catch (err) {
        // Not logged in via cookie/token, persona switcher active
      }
    };
    checkSession();
  }, []);

  const switchUser = (userKey) => {
    const found = PRESET_USERS.find((u) => u.key === userKey);
    if (found) {
      setCurrentUser(found);
      setRealUser(null);
    }
  };

  const changeRole = (newRole) => {
    const found = PRESET_USERS.find((u) => u.role === newRole) || {
      key: newRole,
      id: `usr_${newRole}_dev`,
      role: newRole,
      name: `${newRole.toUpperCase()} User`,
      email: `${newRole}@brightloop.io`,
      description: `Switched to ${newRole} role`
    };
    setCurrentUser(found);
  };

  const login = async (credentials) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      const u = res?.data?.user;
      if (u) {
        setRealUser(u);
        const mapped = {
          key: u.role,
          id: u._id || u.id,
          role: u.role,
          name: u.fullName || u.name,
          email: u.email,
          description: `Logged in as ${u.fullName}`
        };
        setCurrentUser(mapped);
        return u;
      }
      throw new Error('Invalid user payload received from server');
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.register(userData);
      const u = res?.data?.user;
      if (u) {
        setRealUser(u);
        const mapped = {
          key: u.role,
          id: u._id || u.id,
          role: u.role,
          name: u.fullName || u.name,
          email: u.email,
          description: `Logged in as ${u.fullName}`
        };
        setCurrentUser(mapped);
        return u;
      }
      throw new Error('Registration failed');
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      setRealUser(null);
      setCurrentUser(PRESET_USERS[0]);
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

  const role = currentUser.role;

  const value = {
    // Universal identity
    currentUser,
    user: realUser || currentUser,
    role,
    isAdmin: role === 'admin',
    isStaff: role === 'staff',
    isCustomer: role === 'customer',
    isAuthenticated: !!realUser || !!currentUser,
    loading,
    error,

    // Real Auth Actions (M1)
    login,
    register,
    logout,
    refreshUser: () => setRealUser(null),

    // Persona & Role Switcher (M5-M12)
    switchUser,
    changeRole,
    getAuthHeaders,
    PRESET_USERS
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
