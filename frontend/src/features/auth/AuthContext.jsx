import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const AuthContext = createContext(null);

const DEFAULT_ACADEMIC_USER = {
  id: 'academic-primary-user',
  name: 'باحث أكاديمي',
  email: 'admin@academic.edu',
  role: 'admin',
  emailVerified: true
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_ACADEMIC_USER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.data?.user) {
        setUser(res.data.data.user);
        return res.data.data.user;
      }
    } catch (_) {
      // Fallback to default academic user
      setUser(DEFAULT_ACADEMIC_USER);
    }
  }, []);

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  const login = async () => DEFAULT_ACADEMIC_USER;
  const register = async () => DEFAULT_ACADEMIC_USER;
  const logout = async () => {
    setUser(DEFAULT_ACADEMIC_USER);
  };

  const value = {
    user,
    setUser,
    loading: false,
    error: null,
    login,
    register,
    logout,
    refreshCurrentUser,
    isAuthenticated: true,
    isAdmin: true
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
