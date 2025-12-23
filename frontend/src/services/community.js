import { API_BASE_URL } from '../config/api';
import { getToken } from './api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// GET /api/community/posts - 게시글 목록 조회
export const getPosts = async (board, page = 1, limit = 10) => {
  const response = await fetch(
    `${API_BASE_URL}/api/community/posts?board=${board}&page=${page}&limit=${limit}`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch posts');
  }

  return response.json();
};

// GET /api/community/posts/:id - 게시글 상세 조회
export const getPostById = async (postId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/community/posts/${postId}`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch post');
  }

  return response.json();
};

// POST /api/community/posts - 게시글 작성
export const createPost = async (board, title, content) => {
  const response = await fetch(
    `${API_BASE_URL}/api/community/posts`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ board, title, content })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create post');
  }

  return response.json();
};

// PUT /api/community/posts/:id - 게시글 수정
export const updatePost = async (postId, title, content) => {
  const response = await fetch(
    `${API_BASE_URL}/api/community/posts/${postId}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, content })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update post');
  }

  return response.json();
};

// DELETE /api/community/posts/:id - 게시글 삭제
export const deletePost = async (postId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/community/posts/${postId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete post');
  }

  return response.json();
};

// POST /api/community/posts/:id/comments - 댓글 작성
export const createComment = async (postId, content, parentId = null) => {
  const response = await fetch(
    `${API_BASE_URL}/api/community/posts/${postId}/comments`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, parentId })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create comment');
  }

  return response.json();
};

// POST /api/community/posts/:id/report - 게시글 신고
export const reportPost = async (postId, type, reason) => {
  const response = await fetch(
    `${API_BASE_URL}/api/community/posts/${postId}/report`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type, reason })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to report post');
  }

  return response.json();
};

// GET /api/community/reports - 신고 목록 조회 (관리자 전용)
export const getReports = async (status = null) => {
  const url = status
    ? `${API_BASE_URL}/api/community/reports?status=${status}`
    : `${API_BASE_URL}/api/community/reports`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch reports');
  }

  return response.json();
};

// PUT /api/community/reports/:id - 신고 상태 변경 (관리자 전용)
export const updateReportStatus = async (reportId, status) => {
  const response = await fetch(
    `${API_BASE_URL}/api/community/reports/${reportId}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update report');
  }

  return response.json();
};

// PUT /api/community/posts/:id/hide - 게시글 숨김 (관리자 전용)
export const hidePost = async (postId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/community/posts/${postId}/hide`,
    {
      method: 'PUT',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to hide post');
  }

  return response.json();
};

// PUT /api/community/comments/:id/hide - 댓글 숨김 (관리자 전용)
export const hideComment = async (commentId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/community/comments/${commentId}/hide`,
    {
      method: 'PUT',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to hide comment');
  }

  return response.json();
};
