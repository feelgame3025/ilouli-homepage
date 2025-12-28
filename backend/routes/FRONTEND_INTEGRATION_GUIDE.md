# Frontend Integration Guide - Community API

## 개요

이 문서는 Frontend 개발자가 커뮤니티 API를 React 컴포넌트에 통합하는 방법을 안내합니다.

---

## API Service 설정

### 1. Community Service 생성

**위치**: `frontend/src/services/communityService.js`

```javascript
const API_BASE = 'https://api.ilouli.com/api/community';

// 게시글 목록 조회
export const getPosts = async (board = 'free', page = 1, limit = 20) => {
  const response = await fetch(
    `${API_BASE}/posts?board=${board}&page=${page}&limit=${limit}`
  );
  const data = await response.json();
  return data;
};

// 게시글 상세 조회
export const getPost = async (postId) => {
  const response = await fetch(`${API_BASE}/posts/${postId}`);
  const data = await response.json();
  return data;
};

// 게시글 작성
export const createPost = async (token, board, title, content) => {
  const response = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ board, title, content })
  });
  const data = await response.json();
  return data;
};

// 게시글 수정
export const updatePost = async (token, postId, title, content) => {
  const response = await fetch(`${API_BASE}/posts/${postId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, content })
  });
  const data = await response.json();
  return data;
};

// 게시글 삭제
export const deletePost = async (token, postId) => {
  const response = await fetch(`${API_BASE}/posts/${postId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data;
};

// 댓글 목록 조회
export const getComments = async (postId) => {
  const response = await fetch(`${API_BASE}/posts/${postId}/comments`);
  const data = await response.json();
  return data;
};

// 댓글 작성
export const createComment = async (token, postId, content, parentId = null) => {
  const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content, parent_id: parentId })
  });
  const data = await response.json();
  return data;
};

// 댓글 삭제
export const deleteComment = async (token, commentId) => {
  const response = await fetch(`${API_BASE}/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data;
};

// 신고 접수
export const reportContent = async (token, targetId, targetType, reason) => {
  const response = await fetch(`${API_BASE}/posts/${targetId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ target_type: targetType, reason })
  });
  const data = await response.json();
  return data;
};

// 신고 목록 조회 (관리자)
export const getReports = async (token, status = null) => {
  let url = `${API_BASE}/reports`;
  if (status) {
    url += `?status=${status}`;
  }
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data;
};

// 신고 처리 (관리자)
export const handleReport = async (token, reportId, status, action = null) => {
  const body = { status };
  if (action) {
    body.action = action;
  }

  const response = await fetch(`${API_BASE}/reports/${reportId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  return data;
};
```

---

## React 컴포넌트 예시

### 1. 게시글 목록 컴포넌트

```javascript
import React, { useState, useEffect } from 'react';
import { getPosts } from '../services/communityService';

function PostList({ board }) {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadPosts();
  }, [board, page]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await getPosts(board, page, 20);
      if (response.success) {
        setPosts(response.data.posts);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="post-list">
      {posts.map(post => (
        <div key={post.id} className="post-item">
          <h3>{post.title}</h3>
          <p>{post.content.substring(0, 100)}...</p>
          <div className="post-meta">
            <span>{post.author_name}</span>
            <span>조회 {post.views}</span>
            <span>댓글 {post.comment_count}</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          이전
        </button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button
          disabled={page >= pagination.totalPages}
          onClick={() => setPage(page + 1)}
        >
          다음
        </button>
      </div>
    </div>
  );
}

export default PostList;
```

### 2. 게시글 작성 컴포넌트

```javascript
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../services/communityService';
import { AuthContext } from '../contexts/AuthContext';

function CreatePost({ board }) {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createPost(token, board, title, content);
      if (response.success) {
        alert('게시글이 작성되었습니다.');
        navigate(`/community/${board}/${response.data.id}`);
      } else {
        alert('게시글 작성 실패: ' + response.error);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-post-form">
      <input
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
      />
      <textarea
        placeholder="내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? '작성 중...' : '작성하기'}
      </button>
    </form>
  );
}

export default CreatePost;
```

### 3. 게시글 상세 및 댓글 컴포넌트

```javascript
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { getPost, createComment, deleteComment } from '../services/communityService';
import { AuthContext } from '../contexts/AuthContext';

function PostDetail() {
  const { postId } = useParams();
  const { user, token } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const response = await getPost(postId);
      if (response.success) {
        setPost(response.data.post);
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await createComment(token, postId, newComment);
      if (response.success) {
        setComments([...comments, response.data]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      const response = await deleteComment(token, commentId);
      if (response.success) {
        setComments(comments.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="post-detail">
      {/* 게시글 */}
      <div className="post">
        <h1>{post.title}</h1>
        <div className="post-meta">
          <span>{post.author_name}</span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          <span>조회 {post.views}</span>
        </div>
        <div className="post-content">
          {post.content}
        </div>
      </div>

      {/* 댓글 목록 */}
      <div className="comments">
        <h3>댓글 ({comments.length})</h3>
        {comments.map(comment => (
          <div key={comment.id} className="comment">
            <div className="comment-author">{comment.author_name}</div>
            <div className="comment-content">{comment.content}</div>
            <div className="comment-meta">
              <span>{new Date(comment.created_at).toLocaleDateString()}</span>
              {user && (user.id === comment.user_id || user.tier === 'admin') && (
                <button onClick={() => handleDeleteComment(comment.id)}>
                  삭제
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 댓글 작성 */}
      {user && (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <textarea
            placeholder="댓글을 입력하세요"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <button type="submit">댓글 작성</button>
        </form>
      )}
    </div>
  );
}

export default PostDetail;
```

### 4. 신고 버튼 컴포넌트

```javascript
import React, { useState, useContext } from 'react';
import { reportContent } from '../services/communityService';
import { AuthContext } from '../contexts/AuthContext';

function ReportButton({ targetId, targetType }) {
  const { token } = useContext(AuthContext);
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState('');

  const handleReport = async () => {
    if (!reason.trim()) {
      alert('신고 사유를 입력해주세요.');
      return;
    }

    try {
      const response = await reportContent(token, targetId, targetType, reason);
      if (response.success) {
        alert('신고가 접수되었습니다.');
        setShowDialog(false);
        setReason('');
      } else {
        alert(response.error || '신고 접수에 실패했습니다.');
      }
    } catch (error) {
      console.error('Report error:', error);
      alert('신고 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <button onClick={() => setShowDialog(true)} className="report-btn">
        신고
      </button>

      {showDialog && (
        <div className="modal">
          <div className="modal-content">
            <h3>신고하기</h3>
            <textarea
              placeholder="신고 사유를 입력해주세요"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            <div className="modal-actions">
              <button onClick={handleReport}>신고 접수</button>
              <button onClick={() => setShowDialog(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ReportButton;
```

### 5. 신고 관리 컴포넌트 (Admin)

```javascript
import React, { useState, useEffect, useContext } from 'react';
import { getReports, handleReport } from '../services/communityService';
import { AuthContext } from '../contexts/AuthContext';

function ReportManagement() {
  const { token } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await getReports(token, filter);
      if (response.success) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId, deleteTarget = false) => {
    try {
      const response = await handleReport(
        token,
        reportId,
        'approved',
        deleteTarget ? 'delete_target' : null
      );
      if (response.success) {
        alert('신고가 승인되었습니다.');
        loadReports();
      }
    } catch (error) {
      console.error('Failed to handle report:', error);
    }
  };

  const handleReject = async (reportId) => {
    try {
      const response = await handleReport(token, reportId, 'rejected');
      if (response.success) {
        alert('신고가 거절되었습니다.');
        loadReports();
      }
    } catch (error) {
      console.error('Failed to handle report:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="report-management">
      <h2>신고 관리</h2>

      {/* 필터 */}
      <div className="filters">
        <button onClick={() => setFilter('pending')}>대기 중</button>
        <button onClick={() => setFilter('approved')}>승인됨</button>
        <button onClick={() => setFilter('rejected')}>거절됨</button>
        <button onClick={() => setFilter(null)}>전체</button>
      </div>

      {/* 신고 목록 */}
      <div className="report-list">
        {reports.map(report => (
          <div key={report.id} className="report-item">
            <div className="report-header">
              <span className="report-type">{report.target_type}</span>
              <span className="report-status">{report.status}</span>
            </div>
            <div className="report-reason">
              <strong>사유:</strong> {report.reason}
            </div>
            <div className="report-reporter">
              <strong>신고자:</strong> {report.reporter_name} ({report.reporter_email})
            </div>
            {report.target_content && (
              <div className="report-content">
                <strong>내용:</strong>
                {report.target_type === 'post' ? (
                  <div>
                    <div><strong>{report.target_content.title}</strong></div>
                    <div>{report.target_content.content.substring(0, 100)}...</div>
                  </div>
                ) : (
                  <div>{report.target_content.content}</div>
                )}
              </div>
            )}
            {report.status === 'pending' && (
              <div className="report-actions">
                <button onClick={() => handleApprove(report.id, true)}>
                  승인 및 삭제
                </button>
                <button onClick={() => handleApprove(report.id, false)}>
                  승인만
                </button>
                <button onClick={() => handleReject(report.id)}>
                  거절
                </button>
              </div>
            )}
            {report.handled_by && (
              <div className="report-handler">
                <strong>처리자:</strong> {report.handler_name}
                <span>({new Date(report.handled_at).toLocaleDateString()})</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReportManagement;
```

---

## Router 설정

```javascript
// frontend/src/routers/CommunityRouter.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PostList from '../features/community/PostList';
import PostDetail from '../features/community/PostDetail';
import CreatePost from '../features/community/CreatePost';
import ProtectedRoute from '../shared/ProtectedRoute';

function CommunityRouter() {
  return (
    <Routes>
      <Route path="/" element={<PostList board="free" />} />
      <Route path="/announcements" element={<PostList board="announcement" />} />
      <Route path="/free-board" element={<PostList board="free" />} />
      <Route path="/:board/:postId" element={<PostDetail />} />
      <Route
        path="/create"
        element={
          <ProtectedRoute minTier="general">
            <CreatePost board="free" />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default CommunityRouter;
```

---

## 주의사항

### 1. 인증 토큰
- 모든 쓰기 작업(POST, PUT, DELETE)은 `Authorization: Bearer {token}` 헤더 필요
- `AuthContext`에서 토큰을 가져와 사용

### 2. 에러 처리
- API 응답의 `success` 필드를 확인하여 성공 여부 판단
- `response.error`에 에러 메시지가 포함됨

### 3. 권한 체크
- 게시글/댓글 수정/삭제는 작성자 또는 관리자만 가능
- Frontend에서도 UI 레벨에서 권한 체크 필요

### 4. 대댓글 처리
- `parent_id`를 사용하여 대댓글 구현 가능
- 댓글 목록에서 `parent_id`를 확인하여 트리 구조 생성

---

## 다음 단계

1. `frontend/src/services/communityService.js` 파일 생성
2. 각 컴포넌트를 `frontend/src/features/community/` 폴더에 생성
3. Router에 경로 추가
4. Admin Dashboard에 신고 관리 페이지 추가

---

## 테스트

Backend API 테스트 스크립트를 실행하여 모든 엔드포인트가 정상 동작하는지 확인:

```bash
chmod +x /home/feel3025/myproject/homepage/backend/routes/test-community-api.sh
/home/feel3025/myproject/homepage/backend/routes/test-community-api.sh
```
