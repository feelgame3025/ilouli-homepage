import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, usersAPI, getToken, removeToken } from '../services/api';
import { signInWithGoogle, signInWithKakao, handleGoogleOAuthCallback } from '../services/socialAuth';

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

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewAsTier, setViewAsTier] = useState(null);

  // 토큰으로 세션 복원 및 OAuth 콜백 처리
  useEffect(() => {
    const restoreSession = async () => {
      // Google OAuth 리다이렉트 콜백 처리
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

      // 일반 세션 복원
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

  const login = async (email, password) => {
    const userData = await authAPI.login(email, password);
    setUser(userData);
    return userData;
  };

  const signup = async (name, email, password) => {
    const result = await authAPI.signup(name, email, password);
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

  const hasAccess = (requiredTiers) => {
    if (!user) return false;
    const effectiveTier = viewAsTier || user.tier;
    return requiredTiers.includes(effectiveTier);
  };

  // 관리자 기능
  const getAllUsers = async () => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
    return await usersAPI.getAll();
  };

  const getPendingUsers = async () => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
    return await usersAPI.getPending();
  };

  const approveUser = async (userId) => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
    await usersAPI.approve(userId);
  };

  const rejectUser = async (userId) => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
    await usersAPI.reject(userId);
  };

  const updateUserTier = async (userId, newTier) => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
    await usersAPI.updateTier(userId, newTier);
  };

  const deleteUser = async (userId) => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
    if (userId === user.id) {
      throw new Error('Cannot delete yourself');
    }
    await usersAPI.delete(userId);
  };

  // 등급 시뮬레이션
  const setViewAs = (tier) => {
    if (!user || user.tier !== USER_TIERS.ADMIN) return;
    setViewAsTier(tier);
  };

  const resetViewAs = () => setViewAsTier(null);
  const getCurrentViewTier = () => viewAsTier;
  const getActualTier = () => user?.tier;

  const value = {
    user,
    loading,
    login,
    signup,
    socialLogin,
    logout,
    hasAccess,
    isAuthenticated: !!user,
    USER_TIERS,
    USER_STATUS,
    getAllUsers,
    updateUserTier,
    deleteUser,
    getPendingUsers,
    approveUser,
    rejectUser,
    setViewAs,
    resetViewAs,
    getCurrentViewTier,
    getActualTier,
    viewAsTier
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
