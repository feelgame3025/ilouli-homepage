import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as notificationAPI from '../services/notifications';
import { STORAGE_KEYS } from '../constants/storageKeys';

export const NOTIFICATION_TYPES = {
  COMMENT: 'comment',           // 내 글에 댓글
  REPLY: 'reply',               // 내 댓글에 답글
  REPORT_RESULT: 'report_result', // 신고 처리 결과
  APPROVAL: 'approval',         // 회원 승인/거절
  MENTION: 'mention',           // 멘션
  SYSTEM: 'system'              // 시스템 공지
};

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
  const loadNotifications = useCallback(async () => {
    if (!user || !user.token) {
      setNotifications([]);
      return;
    }

    try {
      const data = await notificationAPI.fetchNotifications(user.token);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Fallback to localStorage on error
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) {
        const allNotifications = JSON.parse(stored);
        const userNotifications = allNotifications.filter(n => n.userId === user.id);
        setNotifications(userNotifications);
      }
    }
  }, [user]);

  // 설정 로드
  const loadSettings = useCallback(() => {
    if (!user) return;
    const stored = localStorage.getItem(`${STORAGE_KEYS.NOTIFICATION_SETTINGS}_${user.id}`);
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
    const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const allNotifications = stored ? JSON.parse(stored) : [];

    // 다른 사용자의 알림 유지
    const otherNotifications = allNotifications.filter(n => n.userId !== user?.id);
    const combined = [...otherNotifications, ...userNotifications];

    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(combined));
    setNotifications(userNotifications);
  };

  // 설정 저장
  const saveSettings = (newSettings) => {
    if (!user) return;
    localStorage.setItem(`${STORAGE_KEYS.NOTIFICATION_SETTINGS}_${user.id}`, JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  // 알림 추가 (로컬 전용 - 실시간 알림용)
  const addNotification = async (targetUserId, type, title, message, link = null, metadata = {}) => {
    // 서버에 알림 생성 시도 (Admin만 가능)
    if (user && user.token && user.tier === 'admin') {
      try {
        const response = await notificationAPI.createNotification(user.token, {
          userId: targetUserId,
          type,
          title,
          message,
          link,
          metadata
        });

        // 현재 로그인한 사용자에게 온 알림이면 상태 업데이트
        if (targetUserId === user.id && response.notification) {
          setNotifications(prev => [response.notification, ...prev]);
        }

        return response.notification;
      } catch (error) {
        console.error('Failed to create notification on server:', error);
      }
    }

    // Fallback: localStorage에 저장 (서버 실패 시 또는 non-admin)
    const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
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
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));

    // 현재 로그인한 사용자에게 온 알림이면 상태 업데이트
    if (user && targetUserId === user.id) {
      setNotifications(prev => [newNotification, ...prev]);
    }

    return newNotification;
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId) => {
    if (!user || !user.token) return;

    try {
      await notificationAPI.markNotificationAsRead(user.token, notificationId);

      // 로컬 상태 업데이트
      const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updated);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    if (!user || !user.token) return;

    try {
      await notificationAPI.markAllNotificationsAsRead(user.token);

      // 로컬 상태 업데이트
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // 알림 삭제
  const deleteNotification = async (notificationId) => {
    if (!user || !user.token) return;

    try {
      await notificationAPI.deleteNotification(user.token, notificationId);

      // 로컬 상태 업데이트
      const updated = notifications.filter(n => n.id !== notificationId);
      setNotifications(updated);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // 모든 알림 삭제
  const clearAllNotifications = async () => {
    if (!user || !user.token) return;

    try {
      await notificationAPI.deleteAllNotifications(user.token);

      // 로컬 상태 업데이트
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
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
