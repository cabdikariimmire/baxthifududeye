import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk, Show } from '@clerk/react';
import api, { setTokenGetter } from '../../services/api';

const AuthContext = createContext(null);

export const SignedIn = ({ children }) => {
  return <Show when="signed-in">{children}</Show>;
};

export const SignedOut = ({ children }) => {
  return <Show when="signed-out">{children}</Show>;
};

export const AuthProvider = ({ children }) => {
  const { isLoaded: isClerkLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken, signOut } = useClerkAuth();
  const { openSignIn, openSignUp } = useClerk();

  const [mongoUser, setMongoUser] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState(null);

  // Register token getter with Axios interceptor
  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  // Sync / fetch current user profile from backend /auth/me when signed in with Clerk
  const refreshCurrentUser = useCallback(async () => {
    if (!isSignedIn) {
      setMongoUser(null);
      return null;
    }

    try {
      setSyncLoading(true);
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.data?.user) {
        setMongoUser(res.data.data.user);
        setError(null);
        return res.data.data.user;
      }
      return null;
    } catch (err) {
      console.warn('Backend user profile sync notice:', err.message);
      return null;
    } finally {
      setSyncLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isClerkLoaded) {
      if (isSignedIn) {
        refreshCurrentUser();
      } else {
        setMongoUser(null);
      }
    }
  }, [isClerkLoaded, isSignedIn, refreshCurrentUser]);

  // Unified user object merging Clerk identity and backend MongoDB attributes / localStorage fallback
  const localAuthToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const localUserJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let localUser = null;
  if (localUserJson) {
    try {
      localUser = JSON.parse(localUserJson);
    } catch (_) {}
  }

  const user = isSignedIn
    ? {
        id: mongoUser?.id || mongoUser?._id || clerkUser?.id,
        clerkId: clerkUser?.id,
        name: mongoUser?.name || clerkUser?.fullName || clerkUser?.firstName || 'باحث أكاديمي',
        email: mongoUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || '',
        role: mongoUser?.role || clerkUser?.publicMetadata?.role || 'user',
        imageUrl: clerkUser?.imageUrl,
        createdAt: mongoUser?.createdAt || clerkUser?.createdAt
      }
    : (localAuthToken && localUser ? localUser : null);

  const isAuthenticated = !!isSignedIn || (!!localAuthToken && !!localUser);
  const isAdmin = !!user && (user.role === 'admin' || user.role === 'super_admin');
  const isSuperAdmin = !!user && user.role === 'super_admin';

  const logout = async () => {
    try {
      if (isSignedIn) {
        await signOut();
      }
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
      setMongoUser(null);
      setError(null);
    }
  };

  const value = {
    user,
    mongoUser,
    clerkUser,
    loading: !isClerkLoaded && !(localAuthToken && localUser),
    syncLoading,
    error,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    getToken,
    logout,
    openSignIn,
    openSignUp,
    refreshCurrentUser
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
