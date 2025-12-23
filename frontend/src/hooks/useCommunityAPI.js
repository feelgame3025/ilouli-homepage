import { useCallback } from 'react';
import { POST_TYPES, CATEGORIES, REPORT_STATUS } from '../contexts/CommunityContext';

/**
 * CommunityContext에서 사용하는 API 로직을 추출한 훅
 * Mock 데이터 기반 구현 (localStorage)
 */
export const useCommunityAPI = (posts, setPosts, savePosts, reports, saveReports) => {
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
  const createPost = useCallback((type, title, content, author, category = null, files = []) => {
    const newPost = {
      id: `post-${Date.now()}`,
      type,
      category: type === POST_TYPES.COMMUNITY ? (category || CATEGORIES.GENERAL) : null,
      title,
      content,
      author: { id: author.id, name: author.name },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      attachments: files,
      reportCount: 0,
      isHidden: false
    };
    savePosts([newPost, ...posts]);
    return newPost;
  }, [posts, savePosts]);

  // 글 수정
  const updatePost = useCallback((postId, title, content, userId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    if (post.author.id !== userId) throw new Error('Not authorized');

    const updatedPosts = posts.map(p =>
      p.id === postId
        ? { ...p, title, content, updatedAt: new Date().toISOString() }
        : p
    );
    savePosts(updatedPosts);
  }, [posts, savePosts]);

  // 글 삭제
  const deletePost = useCallback((postId, userId, isAdmin) => {
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    if (post.author.id !== userId && !isAdmin) throw new Error('Not authorized');

    const updatedPosts = posts.filter(p => p.id !== postId);
    savePosts(updatedPosts);
  }, [posts, savePosts]);

  // 댓글 작성
  const addComment = useCallback((postId, content, author) => {
    const newComment = {
      id: `comment-${Date.now()}`,
      content,
      author: { id: author.id, name: author.name },
      createdAt: new Date().toISOString()
    };

    const updatedPosts = posts.map(p =>
      p.id === postId
        ? { ...p, comments: [...p.comments, newComment] }
        : p
    );
    savePosts(updatedPosts);
    return newComment;
  }, [posts, savePosts]);

  // 댓글 삭제
  const deleteComment = useCallback((postId, commentId, userId, isAdmin) => {
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.author.id !== userId && !isAdmin) throw new Error('Not authorized');

    const updatedPosts = posts.map(p =>
      p.id === postId
        ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
        : p
    );
    savePosts(updatedPosts);
  }, [posts, savePosts]);

  // 게시글 신고
  const reportPost = useCallback((postId, reason, reporter) => {
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    // 이미 신고했는지 확인
    const alreadyReported = reports.find(
      r => r.postId === postId && r.reporter.id === reporter.id && r.type === 'post'
    );
    if (alreadyReported) throw new Error('Already reported');

    const newReport = {
      id: `report-${Date.now()}`,
      type: 'post',
      postId,
      postTitle: post.title,
      reason,
      reporter: { id: reporter.id, name: reporter.name },
      author: post.author,
      status: REPORT_STATUS.PENDING,
      createdAt: new Date().toISOString()
    };

    saveReports([newReport, ...reports]);

    // 게시글의 신고 횟수 증가
    const updatedPosts = posts.map(p =>
      p.id === postId ? { ...p, reportCount: (p.reportCount || 0) + 1 } : p
    );
    savePosts(updatedPosts);

    return newReport;
  }, [posts, reports, savePosts, saveReports]);

  // 댓글 신고
  const reportComment = useCallback((postId, commentId, reason, reporter) => {
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) throw new Error('Comment not found');

    // 이미 신고했는지 확인
    const alreadyReported = reports.find(
      r => r.commentId === commentId && r.reporter.id === reporter.id && r.type === 'comment'
    );
    if (alreadyReported) throw new Error('Already reported');

    const newReport = {
      id: `report-${Date.now()}`,
      type: 'comment',
      postId,
      commentId,
      commentContent: comment.content.substring(0, 50),
      reason,
      reporter: { id: reporter.id, name: reporter.name },
      author: comment.author,
      status: REPORT_STATUS.PENDING,
      createdAt: new Date().toISOString()
    };

    saveReports([newReport, ...reports]);
    return newReport;
  }, [posts, reports, saveReports]);

  // 신고 목록 조회 (관리자용)
  const getReports = useCallback((status = null) => {
    return reports
      .filter(r => !status || r.status === status)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [reports]);

  // 신고 처리 (관리자용)
  const handleReport = useCallback((reportId, action, isAdmin) => {
    if (!isAdmin) throw new Error('Not authorized');

    const report = reports.find(r => r.id === reportId);
    if (!report) throw new Error('Report not found');

    let newStatus;
    if (action === 'dismiss') {
      newStatus = REPORT_STATUS.DISMISSED;
    } else if (action === 'hide') {
      newStatus = REPORT_STATUS.ACTIONED;
      // 게시글 숨김 처리
      if (report.type === 'post') {
        const updatedPosts = posts.map(p =>
          p.id === report.postId ? { ...p, isHidden: true } : p
        );
        savePosts(updatedPosts);
      } else if (report.type === 'comment') {
        // 댓글 삭제
        const updatedPosts = posts.map(p =>
          p.id === report.postId
            ? { ...p, comments: p.comments.filter(c => c.id !== report.commentId) }
            : p
        );
        savePosts(updatedPosts);
      }
    } else if (action === 'delete') {
      newStatus = REPORT_STATUS.ACTIONED;
      // 게시글 완전 삭제
      if (report.type === 'post') {
        const updatedPosts = posts.filter(p => p.id !== report.postId);
        savePosts(updatedPosts);
      }
    } else {
      newStatus = REPORT_STATUS.REVIEWED;
    }

    const updatedReports = reports.map(r =>
      r.id === reportId ? { ...r, status: newStatus, reviewedAt: new Date().toISOString() } : r
    );
    saveReports(updatedReports);
  }, [posts, reports, savePosts, saveReports]);

  // 숨긴 게시글 복원 (관리자용)
  const restorePost = useCallback((postId, isAdmin) => {
    if (!isAdmin) throw new Error('Not authorized');

    const updatedPosts = posts.map(p =>
      p.id === postId ? { ...p, isHidden: false, reportCount: 0 } : p
    );
    savePosts(updatedPosts);
  }, [posts, savePosts]);

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
