import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, usersAPI, getToken, removeToken } from '../services/api';
import { signInWithGoogle, signInWithKakao, handleGoogleOAuthCallback } from '../services/socialAuth';

// ============================================================================
// Constants
// ============================================================================

export const USER_TIERS = {
  GUEST: 'guest',
  GENERAL: 'general',
  SUBSCRIBER: 'subscriber',
  FAMILY: 'family',
  ADMIN: 'admin'
};

export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// ============================================================================
// Context & Hook
// ============================================================================

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ============================================================================
// Provider
// ============================================================================

export const AuthProvider = ({ children }) => {
  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewAsTier, setViewAsTier] = useState(null);

  // ============================================================================
  // Session Management
  // ============================================================================

  useEffect(() => {
    const restoreSession = async () => {
      // Handle Google OAuth redirect callback
      if (window.location.hash && window.location.hash.includes('access_token')) {
        try {
          console.log('[Auth] Processing Google OAuth callback...');
          const socialUser = await handleGoogleOAuthCallback();
          if (socialUser) {
            const userData = await authAPI.socialLogin('google', socialUser);
            setUser(userData);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Failed to process Google OAuth callback:', err);
        }
      }

      // Restore session from token
      const token = getToken();
      if (token) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (err) {
          console.error('Failed to restore session:', err);
          removeToken();
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  // ============================================================================
  // Authentication Functions
  // ============================================================================

  const login = async (email, password) => {
    const userData = await authAPI.login(email, password);
    setUser(userData);
    return userData;
  };

  const signup = async (name, email, password) => {
    await authAPI.signup(name, email, password);
    return { pending: true };
  };

  const socialLogin = async (provider) => {
    let socialUser;

    if (provider === 'google') {
      socialUser = await signInWithGoogle();
    } else if (provider === 'kakao') {
      socialUser = await signInWithKakao();
    } else {
      throw new Error('Unknown provider');
    }

    const userData = await authAPI.socialLogin(provider, socialUser);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  // ============================================================================
  // Access Control
  // ============================================================================

  const hasAccess = (requiredTiers) => {
    if (!user) return false;
    const effectiveTier = viewAsTier || user.tier;
    return requiredTiers.includes(effectiveTier);
  };

  // ============================================================================
  // Admin Functions - User Management
  // ============================================================================

  const verifyAdmin = () => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
  };

  const getAllUsers = async () => {
    verifyAdmin();
    return await usersAPI.getAll();
  };

  const getPendingUsers = async () => {
    verifyAdmin();
    return await usersAPI.getPending();
  };

  const approveUser = async (userId) => {
    verifyAdmin();
    await usersAPI.approve(userId);
  };

  const rejectUser = async (userId) => {
    verifyAdmin();
    await usersAPI.reject(userId);
  };

  const updateUserTier = async (userId, newTier) => {
    verifyAdmin();
    await usersAPI.updateTier(userId, newTier);
  };

  const deleteUser = async (userId) => {
    verifyAdmin();
    if (userId === user.id) {
      throw new Error('Cannot delete yourself');
    }
    await usersAPI.delete(userId);
  };

  // ============================================================================
  // Admin Functions - Tier Simulation (for testing access control)
  // ============================================================================

  const setViewAs = (tier) => {
    if (!user || user.tier !== USER_TIERS.ADMIN) return;
    setViewAsTier(tier);
  };

  const resetViewAs = () => setViewAsTier(null);
  const getCurrentViewTier = () => viewAsTier;
  const getActualTier = () => user?.tier;

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = {
    // State
    user,
    loading,
    viewAsTier,

    // Constants
    USER_TIERS,
    USER_STATUS,

    // Auth Status
    isAuthenticated: !!user,

    // Authentication
    login,
    signup,
    socialLogin,
    logout,

    // Access Control
    hasAccess,

    // Admin - User Management
    getAllUsers,
    getPendingUsers,
    approveUser,
    rejectUser,
    updateUserTier,
    deleteUser,

    // Admin - Tier Simulation
    setViewAs,
    resetViewAs,
    getCurrentViewTier,
    getActualTier
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
