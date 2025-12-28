import { useCallback } from 'react';
import { POST_TYPES, CATEGORIES, REPORT_STATUS } from '../contexts/CommunityContext';
import * as communityService from '../services/community';

/**
 * CommunityContext에서 사용하는 API 로직을 추출한 훅
 * Backend API 기반 구현
 */
export const useCommunityAPI = (posts, setPosts, reports, setReports) => {
  // 공지사항 목록 조회
  const getAnnouncements = useCallback(() => {
    return posts
      .filter(p => p.type === POST_TYPES.ANNOUNCEMENT)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [posts]);

  // 커뮤니티 글 목록 조회 (카테고리 필터 지원)
  const getCommunityPosts = useCallback((category = null) => {
    return posts
      .filter(p => p.type === POST_TYPES.COMMUNITY && !p.isHidden)
      .filter(p => !category || p.category === category)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [posts]);

  // 카테고리별 글 수 조회
  const getCategoryCount = useCallback(() => {
    const communityPosts = posts.filter(p => p.type === POST_TYPES.COMMUNITY && !p.isHidden);
    const counts = { all: communityPosts.length };
    Object.values(CATEGORIES).forEach(cat => {
      counts[cat] = communityPosts.filter(p => p.category === cat).length;
    });
    return counts;
  }, [posts]);

  // 글 상세 조회
  const getPostById = useCallback((postId) => {
    return posts.find(p => p.id === postId);
  }, [posts]);

  // 글 작성
  const createPost = useCallback(async (type, title, content, author, category = null, files = []) => {
    try {
      const board = type === POST_TYPES.ANNOUNCEMENT ? 'announcement' : 'free';
      const result = await communityService.createPost(board, title, content);

      // 로컬 상태 업데이트
      setPosts(prev => [result.data, ...prev]);
      return result.data;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }, [setPosts]);

  // 글 수정
  const updatePost = useCallback(async (postId, title, content, userId) => {
    try {
      const result = await communityService.updatePost(postId, title, content);

      // 로컬 상태 업데이트
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, title, content, updatedAt: new Date().toISOString() }
          : p
      ));
      return result.data;
    } catch (error) {
      console.error('Failed to update post:', error);
      throw error;
    }
  }, [setPosts]);

  // 글 삭제
  const deletePost = useCallback(async (postId, userId, isAdmin) => {
    try {
      await communityService.deletePost(postId);

      // 로컬 상태 업데이트
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw error;
    }
  }, [setPosts]);

  // 댓글 작성
  const addComment = useCallback(async (postId, content, author) => {
    try {
      const result = await communityService.createComment(postId, content);

      // 로컬 상태 업데이트
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, comments: [...(p.comments || []), result.data] }
          : p
      ));
      return result.data;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }, [setPosts]);

  // 댓글 삭제
  const deleteComment = useCallback(async (postId, commentId, userId, isAdmin) => {
    try {
      await communityService.hideComment(commentId);

      // 로컬 상태 업데이트
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
          : p
      ));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  }, [setPosts]);

  // 게시글 신고
  const reportPost = useCallback(async (postId, reason, reporter) => {
    try {
      const result = await communityService.reportPost(postId, 'post', reason);

      // 로컬 상태 업데이트
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, reportCount: (p.reportCount || 0) + 1 } : p
      ));

      return result.data;
    } catch (error) {
      console.error('Failed to report post:', error);
      throw error;
    }
  }, [setPosts]);

  // 댓글 신고
  const reportComment = useCallback(async (postId, commentId, reason, reporter) => {
    try {
      const result = await communityService.reportPost(postId, 'comment', reason);
      return result.data;
    } catch (error) {
      console.error('Failed to report comment:', error);
      throw error;
    }
  }, []);

  // 신고 목록 조회 (관리자용)
  const getReports = useCallback(async (status = null) => {
    try {
      const result = await communityService.getReports(status);

      // 로컬 상태 업데이트
      if (setReports) {
        setReports(result.data || []);
      }
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      throw error;
    }
  }, [setReports]);

  // 신고 처리 (관리자용)
  const handleReport = useCallback(async (reportId, action, isAdmin) => {
    if (!isAdmin) throw new Error('Not authorized');

    try {
      // 먼저 신고 정보를 로컬에서 찾음
      const report = reports.find(r => r.id === reportId);
      if (!report) throw new Error('Report not found');

      let newStatus;
      if (action === 'dismiss') {
        newStatus = REPORT_STATUS.DISMISSED;
      } else if (action === 'hide') {
        newStatus = REPORT_STATUS.ACTIONED;
        // 게시글/댓글 숨김 처리
        if (report.type === 'post') {
          await communityService.hidePost(report.postId);
          setPosts(prev => prev.map(p =>
            p.id === report.postId ? { ...p, isHidden: true } : p
          ));
        } else if (report.type === 'comment' && report.commentId) {
          await communityService.hideComment(report.commentId);
          setPosts(prev => prev.map(p =>
            p.id === report.postId
              ? { ...p, comments: p.comments.filter(c => c.id !== report.commentId) }
              : p
          ));
        }
      } else if (action === 'delete') {
        newStatus = REPORT_STATUS.ACTIONED;
        // 게시글 완전 삭제
        if (report.type === 'post') {
          await communityService.deletePost(report.postId);
          setPosts(prev => prev.filter(p => p.id !== report.postId));
        }
      } else {
        newStatus = REPORT_STATUS.REVIEWED;
      }

      // 신고 상태 업데이트
      await communityService.updateReportStatus(reportId, newStatus);

      // 로컬 상태 업데이트
      if (setReports) {
        setReports(prev => prev.map(r =>
          r.id === reportId ? { ...r, status: newStatus, reviewedAt: new Date().toISOString() } : r
        ));
      }
    } catch (error) {
      console.error('Failed to handle report:', error);
      throw error;
    }
  }, [reports, setPosts, setReports]);

  // 숨긴 게시글 복원 (관리자용)
  const restorePost = useCallback(async (postId, isAdmin) => {
    if (!isAdmin) throw new Error('Not authorized');

    try {
      // API에서 복원 기능이 없으므로, 프론트엔드에서만 처리
      // 실제로는 백엔드에 복원 API가 필요함
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, isHidden: false, reportCount: 0 } : p
      ));
    } catch (error) {
      console.error('Failed to restore post:', error);
      throw error;
    }
  }, [setPosts]);

  // 숨겨진 게시글 조회 (관리자용)
  const getHiddenPosts = useCallback(() => {
    return posts.filter(p => p.isHidden).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [posts]);

  return {
    getAnnouncements,
    getCommunityPosts,
    getCategoryCount,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    addComment,
    deleteComment,
    reportPost,
    reportComment,
    getReports,
    handleReport,
    restorePost,
    getHiddenPosts
  };
};
