import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCommunityAPI } from '../hooks/useCommunityAPI';
import * as communityService from '../services/community';

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

export const CommunityProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Backend API에서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 공지사항과 커뮤니티 게시글을 병렬로 로드
        const [announcementsRes, communityRes] = await Promise.all([
          communityService.getPosts('announcement', 1, 100),
          communityService.getPosts('free', 1, 100)
        ]);

        // Backend response format: { success: true, data: { posts, pagination } }
        // 두 보드의 게시글을 합쳐서 저장
        const allPosts = [
          ...(announcementsRes.data?.posts || []),
          ...(communityRes.data?.posts || [])
        ];

        // Backend 데이터 형식을 Frontend 형식으로 변환
        const formattedPosts = allPosts.map(post => ({
          id: post.id,
          type: post.board === 'announcement' ? POST_TYPES.ANNOUNCEMENT : POST_TYPES.COMMUNITY,
          category: null, // TODO: 카테고리 추가 필요
          title: post.title,
          content: post.content,
          author: {
            id: post.author_id,
            name: post.author_name,
            email: post.author_email,
            picture: post.author_picture
          },
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          comments: [], // 상세 조회 시 로드
          attachments: [],
          reportCount: 0,
          isHidden: false
        }));

        setPosts(formattedPosts);

        // 관리자인 경우 신고 목록도 로드 (에러 무시)
        try {
          const reportsRes = await communityService.getReports();
          setReports(reportsRes.data || []);
        } catch (err) {
          // 권한이 없는 경우 에러 무시
          console.log('Reports not loaded (admin only)');
        }
      } catch (err) {
        console.error('Failed to load community data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // API 로직을 useCommunityAPI 훅으로 분리
  const api = useCommunityAPI(posts, setPosts, reports, setReports);

  const value = {
    posts,
    reports,
    loading,
    error,
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
