import React, { createContext, useContext, useState, useEffect } from 'react';

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

const AUTH_COOKIE_NAME = 'ilouli_auth';
const USERS_STORAGE_KEY = 'ilouli_users';

// 쿠키 유틸리티 함수들 (서브도메인 공유용)
const getCookieDomain = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return hostname;
  }
  // .ilouli.com 형식으로 설정하여 모든 서브도메인에서 공유
  return '.ilouli.com';
};

const setCookie = (name, value, days = 30) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const domain = getCookieDomain();
  const domainStr = domain.startsWith('.') ? `domain=${domain};` : '';
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires};path=/;${domainStr}SameSite=Lax`;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    try {
      return JSON.parse(decodeURIComponent(parts.pop().split(';').shift()));
    } catch (e) {
      return null;
    }
  }
  return null;
};

const deleteCookie = (name) => {
  const domain = getCookieDomain();
  const domainStr = domain.startsWith('.') ? `domain=${domain};` : '';
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;${domainStr}`;
};

// 기본 관리자 계정 설정
const DEFAULT_ADMIN = {
  id: 'admin-001',
  name: 'Administrator',
  email: 'admin@ilouli.com',
  password: 'admin123',
  tier: 'admin',
  status: 'approved',
  joinDate: '2025-01-01'
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
  const [viewAsTier, setViewAsTier] = useState(null); // 관리자 등급 시뮬레이션용

  useEffect(() => {
    // 기본 관리자 계정 초기화
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    const existingUsers = users ? JSON.parse(users) : [];
    const adminExists = existingUsers.some(u => u.email === DEFAULT_ADMIN.email);

    if (!adminExists) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...existingUsers, DEFAULT_ADMIN]));
    }

    // 쿠키에서 세션 복원
    const storedAuth = getCookie(AUTH_COOKIE_NAME);
    if (storedAuth) {
      setUser(storedAuth);
    }
    setLoading(false);
  }, []);

  const getUsers = () => {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  };

  const saveUsers = (users) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const login = async (email, password) => {
    const users = getUsers();
    const foundUser = users.find(
      u => u.email === email && u.password === password
    );

    if (!foundUser) {
      throw new Error('Invalid email or password');
    }

    // 승인 대기 중인 회원은 로그인 불가
    if (foundUser.status === USER_STATUS.PENDING) {
      throw new Error('Account pending approval');
    }

    // 거절된 회원은 로그인 불가
    if (foundUser.status === USER_STATUS.REJECTED) {
      throw new Error('Account rejected');
    }

    const { password: _, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    setCookie(AUTH_COOKIE_NAME, userWithoutPassword);
    return userWithoutPassword;
  };

  const signup = async (name, email, password) => {
    const users = getUsers();

    if (users.some(u => u.email === email)) {
      throw new Error('Email already exists');
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      tier: USER_TIERS.GENERAL,
      status: USER_STATUS.PENDING,
      joinDate: new Date().toISOString().split('T')[0]
    };

    saveUsers([...users, newUser]);

    // 회원가입 후 자동 로그인하지 않음 (승인 대기)
    return { pending: true };
  };

  const logout = () => {
    setUser(null);
    deleteCookie(AUTH_COOKIE_NAME);
  };

  const hasAccess = (requiredTiers) => {
    if (!user) return false;
    // 등급 시뮬레이션 중이면 해당 등급으로 체크
    const effectiveTier = viewAsTier || user.tier;
    return requiredTiers.includes(effectiveTier);
  };

  // 관리자 전용: 다른 등급으로 보기 (시뮬레이션)
  const setViewAs = (tier) => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      return;
    }
    setViewAsTier(tier);
  };

  // 등급 시뮬레이션 해제
  const resetViewAs = () => {
    setViewAsTier(null);
  };

  // 현재 시뮬레이션 중인 등급 가져오기
  const getCurrentViewTier = () => {
    return viewAsTier;
  };

  // 실제 사용자 등급 (시뮬레이션 무관)
  const getActualTier = () => {
    return user?.tier;
  };

  // 관리자 전용: 모든 회원 목록 조회
  const getAllUsers = () => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
    return getUsers().map(({ password, ...u }) => u);
  };

  // 관리자 전용: 회원 티어 변경
  const updateUserTier = (userId, newTier) => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
    const users = getUsers();
    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, tier: newTier } : u
    );
    saveUsers(updatedUsers);
  };

  // 관리자 전용: 회원 삭제
  const deleteUser = (userId) => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
    // 자기 자신은 삭제 불가
    if (userId === user.id) {
      throw new Error('Cannot delete yourself');
    }
    const users = getUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    saveUsers(updatedUsers);
  };

  // 관리자 전용: 대기 중인 회원 목록 조회
  const getPendingUsers = () => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
    return getUsers()
      .filter(u => u.status === USER_STATUS.PENDING)
      .map(({ password, ...u }) => u);
  };

  // 관리자 전용: 회원 승인
  const approveUser = (userId) => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
    const users = getUsers();
    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, status: USER_STATUS.APPROVED } : u
    );
    saveUsers(updatedUsers);
  };

  // 관리자 전용: 회원 거절
  const rejectUser = (userId) => {
    if (!user || user.tier !== USER_TIERS.ADMIN) {
      throw new Error('Admin access required');
    }
    const users = getUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    saveUsers(updatedUsers);
  };

  const value = {
    user,
    loading,
    login,
    signup,
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
    // 등급 시뮬레이션 기능
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
