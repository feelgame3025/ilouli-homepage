import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, USER_TIERS } from '../contexts/AuthContext';
import { useCommunity, POST_TYPES, CATEGORIES } from '../contexts/CommunityContext';
import './Community.css';

const Community = ({ defaultTab = 'announcements' }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const {
    getAnnouncements,
    getCommunityPosts,
    getCategoryCount,
    getPostById,
    createPost,
    deletePost,
    addComment,
    deleteComment,
    reportPost,
    reportComment
  } = useCommunity();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES.GENERAL);
  const [attachments, setAttachments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [message, setMessage] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');

  const isAdmin = user?.tier === USER_TIERS.ADMIN;
  const canPost = isAuthenticated && user?.tier !== USER_TIERS.GUEST;

  const announcements = getAnnouncements();
  const communityPosts = getCommunityPosts(selectedCategory);
  const categoryCounts = getCategoryCount();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        newAttachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
          content: reader.result,
        });

        // Update state after the last file is read
        if (newAttachments.length === files.length) {
          setAttachments(prev => [...prev, ...newAttachments]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (fileName) => {
    setAttachments(prev => prev.filter(att => att.name !== fileName));
  };


  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const type = activeTab === 'announcements' ? POST_TYPES.ANNOUNCEMENT : POST_TYPES.COMMUNITY;
    createPost(type, newTitle, newContent, user, newCategory, attachments);
    setNewTitle('');
    setNewContent('');
    setNewCategory(CATEGORIES.GENERAL);
    setAttachments([]);
    setShowWriteForm(false);
    setMessage(t('community.success.posted'));
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeletePost = (postId) => {
    if (window.confirm(t('community.confirm.deletePost'))) {
      try {
        deletePost(postId, user.id, isAdmin);
        setSelectedPost(null);
        setMessage(t('community.success.deleted'));
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setMessage(t('community.error.deleteFailed'));
      }
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPost) return;

    addComment(selectedPost.id, newComment, user);
    setNewComment('');
    // 댓글 추가 후 선택된 포스트 새로고침
    const updatedPost = getPostById(selectedPost.id);
    setSelectedPost(updatedPost);
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm(t('community.confirm.deleteComment'))) {
      try {
        deleteComment(selectedPost.id, commentId, user.id, isAdmin);
        // 댓글 삭제 후 선택된 포스트 새로고침
        const updatedPost = getPostById(selectedPost.id);
        setSelectedPost(updatedPost);
      } catch (err) {
        setMessage(t('community.error.commentDeleteFailed'));
      }
    }
  };

  const openReportModal = (type, id) => {
    setReportTarget({ type, id });
    setReportReason('');
    setShowReportModal(true);
  };

  const handleReport = () => {
    if (!reportReason.trim()) return;

    try {
      if (reportTarget.type === 'post') {
        reportPost(selectedPost.id, reportReason, user);
      } else {
        reportComment(selectedPost.id, reportTarget.id, reportReason, user);
      }
      setShowReportModal(false);
      setMessage(t('community.success.reported'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      if (err.message === 'Already reported') {
        setMessage(t('community.error.alreadyReported'));
      } else {
        setMessage(t('community.error.reportFailed'));
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const currentPosts = activeTab === 'announcements' ? announcements : communityPosts;
  const canWriteInTab = activeTab === 'announcements' ? isAdmin : canPost;

  // 신고 모달
  const ReportModal = () => (
    <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{t('community.report.title')}</h3>
        <textarea
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          placeholder={t('community.report.placeholder')}
          rows={4}
        />
        <div className="modal-actions">
          <button onClick={() => setShowReportModal(false)} className="cancel-btn">
            {t('community.cancel')}
          </button>
          <button onClick={handleReport} className="submit-btn" disabled={!reportReason.trim()}>
            {t('community.report.submit')}
          </button>
        </div>
      </div>
    </div>
  );

  // 글 상세 보기
  if (selectedPost) {
    return (
      <div className="community-container">
        {showReportModal && <ReportModal />}

        <button className="back-btn" onClick={() => setSelectedPost(null)}>
          ← {t('community.back')}
        </button>

        {message && (
          <div className={`community-message ${message.includes('error') || message.includes('실패') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <article className="post-detail">
          <header className="post-header">
            <div className="post-badges">
              {selectedPost.type === POST_TYPES.ANNOUNCEMENT && (
                <span className="post-badge announcement">{t('community.badge.announcement')}</span>
              )}
              {selectedPost.category && (
                <span className={`post-badge category-${selectedPost.category}`}>
                  {t(`community.categories.${selectedPost.category}`)}
                </span>
              )}
            </div>
            <h1>{selectedPost.title}</h1>
            <div className="post-meta">
              <span className="author">{selectedPost.author.name}</span>
              <span className="date">{formatDate(selectedPost.createdAt)}</span>
            </div>
          </header>

          <div className="post-content">
            {selectedPost.content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {selectedPost.attachments && selectedPost.attachments.length > 0 && (
            <div className="post-attachments">
              <h4>{t('community.attachments')}</h4>
              <div className="attachment-list">
                {selectedPost.attachments.map(att => (
                  <div key={att.name} className="attachment-item">
                    {att.type.startsWith('image/') ? (
                      <img src={att.content} alt={att.name} className="attachment-preview-image" />
                    ) : (
                      <a href={att.content} download={att.name} className="attachment-file">
                        {att.name}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="post-actions">
            {(selectedPost.author.id === user?.id || isAdmin) && (
              <button onClick={() => handleDeletePost(selectedPost.id)} className="delete-btn">
                {t('community.delete')}
              </button>
            )}
            {canPost && selectedPost.author.id !== user?.id && (
              <button onClick={() => openReportModal('post')} className="report-btn">
                {t('community.report.button')}
              </button>
            )}
          </div>
        </article>

        {/* 댓글 섹션 */}
        <section className="comments-section">
          <h2>{t('community.comments')} ({selectedPost.comments?.length || 0})</h2>

          {canPost && (
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('community.commentPlaceholder')}
                rows={3}
              />
              <button type="submit" disabled={!newComment.trim()}>
                {t('community.submitComment')}
              </button>
            </form>
          )}

          <div className="comments-list">
            {(!selectedPost.comments || selectedPost.comments.length === 0) ? (
              <p className="no-comments">{t('community.noComments')}</p>
            ) : (
              selectedPost.comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author.name}</span>
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                  <div className="comment-actions">
                    {(comment.author.id === user?.id || isAdmin) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="comment-delete-btn"
                      >
                        {t('community.delete')}
                      </button>
                    )}
                    {canPost && comment.author.id !== user?.id && (
                      <button
                        onClick={() => openReportModal('comment', comment.id)}
                        className="comment-report-btn"
                      >
                        {t('community.report.button')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  // 글 목록 보기
  return (
    <div className="community-container">
      <header className="community-header">
        <h1>{t('community.title')}</h1>
        <p>{t('community.subtitle')}</p>
      </header>

      {message && (
        <div className={`community-message ${message.includes('error') || message.includes('실패') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* 탭 */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => { setActiveTab('announcements'); setShowWriteForm(false); setSelectedCategory(null); }}
        >
          {t('community.tabs.announcements')}
        </button>
        <button
          className={`tab ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => { setActiveTab('community'); setShowWriteForm(false); }}
        >
          {t('community.tabs.community')}
        </button>
      </div>

      <div className="community-layout">
        {/* 메인 콘텐츠 */}
        <div className="community-main">
          {/* 글쓰기 버튼 */}
          {canWriteInTab && !showWriteForm && (
            <button className="write-btn" onClick={() => setShowWriteForm(true)}>
              {t('community.write')}
            </button>
          )}

          {/* 글쓰기 폼 */}
          {showWriteForm && (
            <form onSubmit={handleCreatePost} className="write-form">
              {activeTab === 'community' && (
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="category-select"
                >
                  {Object.values(CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>
                      {t(`community.categories.${cat}`)}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('community.titlePlaceholder')}
                required
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={t('community.contentPlaceholder')}
                rows={6}
                required
              />

              <div className="form-group">
                <label htmlFor="attachments">{t('community.attachments')}</label>
                <input
                  type="file"
                  id="attachments"
                  multiple
                  onChange={handleFileChange}
                />
              </div>

              {attachments.length > 0 && (
                <div className="attachments-preview">
                  {attachments.map(att => (
                    <div key={att.name} className="attachment-chip">
                      <span>{att.name}</span>
                      <button type="button" onClick={() => removeAttachment(att.name)}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setShowWriteForm(false)} className="cancel-btn">
                  {t('community.cancel')}
                </button>
                <button type="submit" className="submit-btn">
                  {t('community.submit')}
                </button>
              </div>
            </form>
          )}

          {/* 글 목록 */}
          <div className="posts-list">
            {currentPosts.length === 0 ? (
              <p className="no-posts">{t('community.noPosts')}</p>
            ) : (
              currentPosts.map((post) => (
                <div
                  key={post.id}
                  className="post-item"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="post-item-header">
                    {post.type === POST_TYPES.ANNOUNCEMENT && (
                      <span className="post-badge announcement">{t('community.badge.announcement')}</span>
                    )}
                    {post.category && (
                      <span className={`post-badge category-${post.category}`}>
                        {t(`community.categories.${post.category}`)}
                      </span>
                    )}
                    <h3>{post.title}</h3>
                  </div>
                  <div className="post-item-meta">
                    <span className="author">{post.author.name}</span>
                    <span className="date">{formatDate(post.createdAt)}</span>
                    <span className="comments-count">
                      {t('community.commentsCount', { count: post.comments?.length || 0 })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 카테고리 사이드바 (커뮤니티 탭에서만 표시) */}
        {activeTab === 'community' && (
          <aside className="category-sidebar">
            <h3>{t('community.categoryTitle')}</h3>
            <ul className="category-list">
              <li
                className={`category-item ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                <span>{t('community.categories.all')}</span>
                <span className="category-count">{categoryCounts.all}</span>
              </li>
              {Object.values(CATEGORIES).map(cat => (
                <li
                  key={cat}
                  className={`category-item ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span>{t(`community.categories.${cat}`)}</span>
                  <span className="category-count">{categoryCounts[cat] || 0}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
};

export default Community;
