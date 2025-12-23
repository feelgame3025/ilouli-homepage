// API 서비스
import { API_BASE_URL } from '../config/api';

// Re-export for convenience (다른 서비스에서 import 편의를 위해)
export { API_BASE_URL };

const TOKEN_KEY = 'ilouli_token';

// 쿠키 기반 토큰 관리 (모든 서브도메인에서 공유)
export const getToken = () => {
  // 먼저 쿠키에서 찾기
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === TOKEN_KEY) {
      return decodeURIComponent(value);
    }
  }

  // 쿠키에 없으면 localStorage 백업에서 복원 시도
  try {
    const backupToken = localStorage.getItem(`${TOKEN_KEY}_backup`);
    if (backupToken) {
      console.log('Restoring token from localStorage backup');
      // 쿠키로 다시 설정
      setToken(backupToken);
      return backupToken;
    }
  } catch (e) {
    console.warn('Failed to restore token from backup:', e);
  }

  return null;
};

export const setToken = (token) => {
  // .ilouli.com 도메인으로 설정하여 모든 서브도메인에서 접근 가능
  const isIlouli = window.location.hostname.includes('ilouli.com');
  const domainPart = isIlouli ? '; domain=.ilouli.com' : '';
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const maxAge = 30 * 24 * 60 * 60; // 30일

  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/${domainPart}; max-age=${maxAge}${secure}; SameSite=Lax`;

  // 백업으로 localStorage에도 저장 (쿠키 문제 시 복원용)
  try {
    localStorage.setItem(`${TOKEN_KEY}_backup`, token);
  } catch (e) {
    console.warn('Failed to backup token to localStorage:', e);
  }
};

export const removeToken = () => {
  const isIlouli = window.location.hostname.includes('ilouli.com');
  const domainPart = isIlouli ? '; domain=.ilouli.com' : '';
  document.cookie = `${TOKEN_KEY}=; path=/${domainPart}; max-age=0`;
  // localStorage 백업도 정리
  localStorage.removeItem(`${TOKEN_KEY}_backup`);
  // 이전 버전 호환
  localStorage.removeItem(TOKEN_KEY);
};

// ApiError 클래스
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Auth 헤더 생성
export const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// 응답 처리 헬퍼
const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data.error || data.message || 'Request failed',
      response.status,
      data
    );
  }
  return data;
};

// API 요청 헬퍼 (통합 버전, export)
export const apiRequest = async (endpoint, options = {}) => {
  const { headers: customHeaders, ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      ...getAuthHeaders(),
      ...customHeaders
    },
    ...restOptions
  });

  return handleResponse(response);
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    return data.user;
  },

  signup: async (name, email, password) => {
    return await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },

  socialLogin: async (provider, socialUser) => {
    const data = await apiRequest('/api/auth/social-login', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        id: socialUser.id,
        email: socialUser.email,
        name: socialUser.name,
        picture: socialUser.picture
      })
    });
    setToken(data.token);
    return data.user;
  },

  getMe: async () => {
    const data = await apiRequest('/api/auth/me');
    return data.user;
  },

  logout: () => {
    removeToken();
  }
};

// Users API (Admin)
export const usersAPI = {
  getAll: async () => {
    const data = await apiRequest('/api/users');
    return data.users;
  },

  getPending: async () => {
    const data = await apiRequest('/api/users/pending');
    return data.users;
  },

  approve: async (userId) => {
    return await apiRequest(`/api/users/${userId}/approve`, {
      method: 'POST'
    });
  },

  reject: async (userId) => {
    return await apiRequest(`/api/users/${userId}/reject`, {
      method: 'POST'
    });
  },

  updateTier: async (userId, tier) => {
    return await apiRequest(`/api/users/${userId}/tier`, {
      method: 'PUT',
      body: JSON.stringify({ tier })
    });
  },

  delete: async (userId) => {
    return await apiRequest(`/api/users/${userId}`, {
      method: 'DELETE'
    });
  }
};

// axios-like API 인터페이스
const api = {
  get: async (endpoint) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return { data };
  },

  post: async (endpoint, body, config = {}) => {
    const token = getToken();
    const isFormData = body instanceof FormData;

    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(!isFormData && { 'Content-Type': 'application/json' })
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: isFormData ? body : JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return { data };
  },

  put: async (endpoint, body) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return { data };
  },

  delete: async (endpoint) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return { data };
  }
};

export default api;
