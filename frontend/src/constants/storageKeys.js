/**
 * localStorage/sessionStorage 키 상수
 * 모든 스토리지 접근은 이 상수를 사용
 */

export const STORAGE_KEYS = {
  // 인증
  TOKEN: 'ilouli_token',
  USER: 'ilouli_user',

  // 커뮤니티
  POSTS: 'ilouli_posts',
  REPORTS: 'ilouli_reports',

  // 알림
  NOTIFICATIONS: 'ilouli_notifications',
  NOTIFICATION_SETTINGS: 'ilouli_notification_settings',

  // 캘린더
  CALENDAR: 'ilouli_family_calendar',
  GOOGLE_CALENDAR_TOKEN: 'google_calendar_token',

  // 에셋
  ASSETS: 'ilouli_assets',

  // 비디오 크리에이터
  VIDEO_HISTORY: 'ilouli_video_history',
};

// 쿠키 키
export const COOKIE_KEYS = {
  TOKEN: 'ilouli_token',
};
