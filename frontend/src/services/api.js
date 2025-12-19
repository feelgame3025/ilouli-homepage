// API 서비스
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.ilouli.com';

const TOKEN_KEY = 'ilouli_token';

// 쿠키 기반 토큰 관리 (모든 서브도메인에서 공유)
export const getToken = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === TOKEN_KEY) {
      return decodeURIComponent(value);
    }
  }
  return null;
};

export const setToken = (token) => {
  // .ilouli.com 도메인으로 설정하여 모든 서브도메인에서 접근 가능
  const domain = window.location.hostname.includes('ilouli.com') ? '.ilouli.com' : '';
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; domain=${domain}; max-age=${30 * 24 * 60 * 60}${secure}; SameSite=Lax`;
};

export const removeToken = () => {
  const domain = window.location.hostname.includes('ilouli.com') ? '.ilouli.com' : '';
  document.cookie = `${TOKEN_KEY}=; path=/; domain=${domain}; max-age=0`;
  // localStorage도 정리 (이전 버전 호환)
  localStorage.removeItem(TOKEN_KEY);
};

// API 요청 헬퍼
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
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

export default { authAPI, usersAPI };
