import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';

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

  const savePosts = (newPosts) => {
    setPosts(newPosts);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(newPosts));
  };

  const saveReports = (newReports) => {
    setReports(newReports);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(newReports));
  };

  // 공지사항 목록 조회
  const getAnnouncements = () => {
    return posts
      .filter(p => p.type === POST_TYPES.ANNOUNCEMENT)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // 커뮤니티 글 목록 조회 (카테고리 필터 지원)
  const getCommunityPosts = (category = null) => {
    return posts
      .filter(p => p.type === POST_TYPES.COMMUNITY && !p.isHidden)
      .filter(p => !category || p.category === category)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // 카테고리별 글 수 조회
  const getCategoryCount = () => {
    const communityPosts = posts.filter(p => p.type === POST_TYPES.COMMUNITY && !p.isHidden);
    const counts = { all: communityPosts.length };
    Object.values(CATEGORIES).forEach(cat => {
      counts[cat] = communityPosts.filter(p => p.category === cat).length;
    });
    return counts;
  };

  // 글 상세 조회
  const getPostById = (postId) => {
    return posts.find(p => p.id === postId);
  };

  // 글 작성
  const createPost = (type, title, content, author, category = null, files = []) => {
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
  };

  // 글 수정
  const updatePost = (postId, title, content, userId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    if (post.author.id !== userId) throw new Error('Not authorized');

    const updatedPosts = posts.map(p =>
      p.id === postId
        ? { ...p, title, content, updatedAt: new Date().toISOString() }
        : p
    );
    savePosts(updatedPosts);
  };

  // 글 삭제
  const deletePost = (postId, userId, isAdmin) => {
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    if (post.author.id !== userId && !isAdmin) throw new Error('Not authorized');

    const updatedPosts = posts.filter(p => p.id !== postId);
    savePosts(updatedPosts);
  };

  // 댓글 작성
  const addComment = (postId, content, author) => {
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
  };

  // 댓글 삭제
  const deleteComment = (postId, commentId, userId, isAdmin) => {
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
  };

  // 게시글 신고
  const reportPost = (postId, reason, reporter) => {
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
  };

  // 댓글 신고
  const reportComment = (postId, commentId, reason, reporter) => {
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
  };

  // 신고 목록 조회 (관리자용)
  const getReports = (status = null) => {
    return reports
      .filter(r => !status || r.status === status)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // 신고 처리 (관리자용)
  const handleReport = (reportId, action, isAdmin) => {
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
  };

  // 숨긴 게시글 복원 (관리자용)
  const restorePost = (postId, isAdmin) => {
    if (!isAdmin) throw new Error('Not authorized');

    const updatedPosts = posts.map(p =>
      p.id === postId ? { ...p, isHidden: false, reportCount: 0 } : p
    );
    savePosts(updatedPosts);
  };

  // 숨겨진 게시글 조회 (관리자용)
  const getHiddenPosts = () => {
    return posts.filter(p => p.isHidden).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const value = {
    posts,
    reports,
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
    getHiddenPosts,
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
