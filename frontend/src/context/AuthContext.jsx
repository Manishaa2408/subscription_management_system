import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session on application load
  const loadUser = async () => {
    try {
      setLoading(true);
      const res = await authService.getMe();
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Login action
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

  // Register customer action
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

  // Logout action
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser: loadUser,
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
