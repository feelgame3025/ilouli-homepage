import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export const NOTIFICATION_TYPES = {
  COMMENT: 'comment',           // 내 글에 댓글
  REPLY: 'reply',               // 내 댓글에 답글
  REPORT_RESULT: 'report_result', // 신고 처리 결과
  APPROVAL: 'approval',         // 회원 승인/거절
  MENTION: 'mention',           // 멘션
  SYSTEM: 'system'              // 시스템 공지
};

const NOTIFICATIONS_STORAGE_KEY = 'ilouli_notifications';
const NOTIFICATION_SETTINGS_KEY = 'ilouli_notification_settings';

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    enableSound: true,
    enableEmail: false,
    types: {
      [NOTIFICATION_TYPES.COMMENT]: true,
      [NOTIFICATION_TYPES.REPLY]: true,
      [NOTIFICATION_TYPES.REPORT_RESULT]: true,
      [NOTIFICATION_TYPES.APPROVAL]: true,
      [NOTIFICATION_TYPES.MENTION]: true,
      [NOTIFICATION_TYPES.SYSTEM]: true
    }
  });

  // 알림 로드
  const loadNotifications = useCallback(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) {
      const allNotifications = JSON.parse(stored);
      // 현재 사용자의 알림만 필터링
      const userNotifications = allNotifications.filter(n => n.userId === user.id);
      setNotifications(userNotifications);
    }
  }, [user]);

  // 설정 로드
  const loadSettings = useCallback(() => {
    if (!user) return;
    const stored = localStorage.getItem(`${NOTIFICATION_SETTINGS_KEY}_${user.id}`);
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, [loadNotifications, loadSettings]);

  // 모든 알림 저장
  const saveNotifications = (userNotifications) => {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const allNotifications = stored ? JSON.parse(stored) : [];

    // 다른 사용자의 알림 유지
    const otherNotifications = allNotifications.filter(n => n.userId !== user?.id);
    const combined = [...otherNotifications, ...userNotifications];

    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(combined));
    setNotifications(userNotifications);
  };

  // 설정 저장
  const saveSettings = (newSettings) => {
    if (!user) return;
    localStorage.setItem(`${NOTIFICATION_SETTINGS_KEY}_${user.id}`, JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  // 알림 추가
  const addNotification = (targetUserId, type, title, message, link = null, metadata = {}) => {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const allNotifications = stored ? JSON.parse(stored) : [];

    const newNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: targetUserId,
      type,
      title,
      message,
      link,
      metadata,
      read: false,
      createdAt: new Date().toISOString()
    };

    const updated = [newNotification, ...allNotifications];
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

    // 현재 로그인한 사용자에게 온 알림이면 상태 업데이트
    if (user && targetUserId === user.id) {
      setNotifications(prev => [newNotification, ...prev]);
    }

    return newNotification;
  };

  // 알림 읽음 처리
  const markAsRead = (notificationId) => {
    if (!user) return;

    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = () => {
    if (!user) return;

    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  // 알림 삭제
  const deleteNotification = (notificationId) => {
    if (!user) return;

    const updated = notifications.filter(n => n.id !== notificationId);
    saveNotifications(updated);
  };

  // 모든 알림 삭제
  const clearAllNotifications = () => {
    if (!user) return;
    saveNotifications([]);
  };

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter(n => !n.read).length;

  // 알림 설정 업데이트
  const updateSettings = (newSettings) => {
    saveSettings({ ...settings, ...newSettings });
  };

  // 특정 타입 알림 설정 토글
  const toggleNotificationType = (type) => {
    const newSettings = {
      ...settings,
      types: {
        ...settings.types,
        [type]: !settings.types[type]
      }
    };
    saveSettings(newSettings);
  };

  // 알림이 활성화되어 있는지 확인
  const isTypeEnabled = (type) => {
    return settings.types[type] ?? true;
  };

  const value = {
    notifications,
    unreadCount,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateSettings,
    toggleNotificationType,
    isTypeEnabled,
    loadNotifications,
    NOTIFICATION_TYPES
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
