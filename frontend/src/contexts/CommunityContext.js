import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useCommunityAPI } from '../hooks/useCommunityAPI';

export const POST_TYPES = {
  ANNOUNCEMENT: 'announcement',
  COMMUNITY: 'community'
};

export const CATEGORIES = {
  GENERAL: 'general',
  QUESTION: 'question',
  DISCUSSION: 'discussion',
  SHOWCASE: 'showcase',
  TIP: 'tip'
};

export const REPORT_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  DISMISSED: 'dismissed',
  ACTIONED: 'actioned'
};

const CommunityContext = createContext(null);

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within CommunityProvider');
  }
  return context;
};

// 기본 공지사항 데이터
const DEFAULT_POSTS = [
  {
    id: 'post-001',
    type: POST_TYPES.ANNOUNCEMENT,
    category: null,
    title: 'Welcome to ilouli.com!',
    content: 'Welcome to our platform. We are excited to have you here. Explore our AI Storyboard features and connect with your family in our Family Space.',
    author: { id: 'admin-001', name: 'Administrator' },
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    comments: [],
    attachments: [],
    reportCount: 0,
    isHidden: false
  }
];

export const CommunityProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);

  // localStorage 초기화
  useEffect(() => {
    const storedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (storedPosts) {
      setPosts(JSON.parse(storedPosts));
    } else {
      setPosts(DEFAULT_POSTS);
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(DEFAULT_POSTS));
    }

    const storedReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (storedReports) {
      setReports(JSON.parse(storedReports));
    }
  }, []);

  // localStorage 저장 헬퍼 함수
  const savePosts = useCallback((newPosts) => {
    setPosts(newPosts);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(newPosts));
  }, []);

  const saveReports = useCallback((newReports) => {
    setReports(newReports);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(newReports));
  }, []);

  // API 로직을 useCommunityAPI 훅으로 분리
  const api = useCommunityAPI(posts, setPosts, savePosts, reports, saveReports);

  const value = {
    posts,
    reports,
    ...api,
    POST_TYPES,
    CATEGORIES,
    REPORT_STATUS
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};
