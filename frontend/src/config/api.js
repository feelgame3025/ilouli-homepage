/**
 * API 설정 중앙 관리
 * 모든 서비스에서 이 파일의 설정을 import하여 사용
 */

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.ilouli.com';

export const USE_MOCK_MODE = process.env.REACT_APP_USE_MOCK === 'true';

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  COMMUNITY: '/api/community',
  NOTIFICATIONS: '/api/notifications',
  AI: '/api/ai',
  FILES: '/api/files',
  ADMIN: '/api/admin',
  GAMES: '/api/games',
  CALENDAR: '/api/calendar',
};

export const API_TIMEOUT = 30000; // 30초
