import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, USER_TIERS } from '../contexts/AuthContext';
import { useCommunity, REPORT_STATUS } from '../contexts/CommunityContext';
import { useNotification, NOTIFICATION_TYPES } from '../contexts/NotificationContext';
import './Admin.css';

const Admin = () => {
  const { t } = useTranslation();
  const { getAllUsers, updateUserTier, deleteUser, getPendingUsers, approveUser, rejectUser, user } = useAuth();
  const { getReports, handleReport, getHiddenPosts, restorePost } = useCommunity();
  const { addNotification } = useNotification();

  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [hiddenPosts, setHiddenPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [providerFilter, setProviderFilter] = useState('all'); // all, google, kakao, email

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers.filter(u => u.status === 'approved' || !u.status));
    } catch (err) {
      setMessage(t('admin.error.loadFailed'));
    }
  };

  const loadPendingUsers = async () => {
    try {
      const pending = await getPendingUsers();
      setPendingUsers(pending);
    } catch (err) {
      console.error('Failed to load pending users');
    }
  };

  const loadReports = () => {
    try {
      const allReports = getReports();
      setReports(allReports);
    } catch (err) {
      console.error('Failed to load reports');
    }
  };

  const loadHiddenPosts = () => {
    try {
      const hidden = getHiddenPosts();
      setHiddenPosts(hidden);
    } catch (err) {
      console.error('Failed to load hidden posts');
    }
  };

  useEffect(() => {
    if (user && user.tier === 'admin') {
      loadUsers();
      loadPendingUsers();
      loadReports();
      loadHiddenPosts();
    }
  }, [user]);

  const handleTierChange = async (userId, newTier) => {
    try {
      await updateUserTier(userId, newTier);
      setMessage(t('admin.success.tierUpdated'));
      await loadUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(t('admin.error.updateFailed'));
    }
  };

  const handleDelete = async (userId, userName) => {
    if (window.confirm(t('admin.confirm.delete', { name: userName }))) {
      try {
        await deleteUser(userId);
        setMessage(t('admin.success.deleted'));
        await loadUsers();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setMessage(err.message === 'Cannot delete yourself'
          ? t('admin.error.cannotDeleteSelf')
          : t('admin.error.deleteFailed'));
      }
    }
  };

  const handleApprove = async (userId, userName) => {
    try {
      await approveUser(userId);
      setMessage(t('admin.success.approved', { name: userName }));
      await loadUsers();
      await loadPendingUsers();
      setTimeout(() => setMessage(''), 3000);

      // 승인된 회원에게 알림 발송
      addNotification(
        userId,
        NOTIFICATION_TYPES.APPROVAL,
        t('notification.messages.accountApproved'),
        t('notification.messages.accountApproved'),
        '/profile'
      );
    } catch (err) {
      setMessage(t('admin.error.approveFailed'));
    }
  };

  const handleReject = async (userId, userName) => {
    if (window.confirm(t('admin.confirm.reject', { name: userName }))) {
      try {
        // 거절 전에 알림 발송 (거절되면 사용자가 삭제되므로)
        addNotification(
          userId,
          NOTIFICATION_TYPES.APPROVAL,
          t('notification.messages.accountRejected'),
          t('notification.messages.accountRejected'),
          null
        );

        await rejectUser(userId);
        setMessage(t('admin.success.rejected', { name: userName }));
        await loadPendingUsers();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setMessage(t('admin.error.rejectFailed'));
      }
    }
  };

  const handleReportAction = (reportId, action) => {
    try {
      // 처리 전에 신고자 정보 가져오기
      const report = reports.find(r => r.id === reportId);

      handleReport(reportId, action, true);
      setMessage(t('admin.moderation.success.' + action));
      loadReports();
      loadHiddenPosts();
      setTimeout(() => setMessage(''), 3000);

      // 신고자에게 알림 발송
      if (report && report.reporter) {
        addNotification(
          report.reporter.id,
          NOTIFICATION_TYPES.REPORT_RESULT,
          t('notification.messages.reportProcessed'),
          action === 'hide'
            ? t('admin.moderation.success.hide')
            : t('admin.moderation.success.dismiss'),
          '/community'
        );
      }
    } catch (err) {
      setMessage(t('admin.moderation.error.actionFailed'));
    }
  };

  const handleRestorePost = (postId) => {
    try {
      restorePost(postId, true);
      setMessage(t('admin.moderation.success.restored'));
      loadHiddenPosts();
      loadReports();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(t('admin.moderation.error.restoreFailed'));
    }
  };

  const getTierDisplayName = (tier) => {
    const tierMap = {
      guest: t('auth.tiers.guest'),
      general: t('auth.tiers.general'),
      subscriber: t('auth.tiers.subscriber'),
      family: t('auth.tiers.family'),
      admin: t('auth.tiers.admin')
    };
    return tierMap[tier] || tier;
  };

  const getProviderInfo = (socialProvider) => {
    if (socialProvider === 'google') {
      return { name: 'Google', icon: '🔵', className: 'provider-google' };
    } else if (socialProvider === 'kakao') {
      return { name: 'Kakao', icon: '🟡', className: 'provider-kakao' };
    } else {
      return { name: '이메일', icon: '✉️', className: 'provider-email' };
    }
  };

  const filteredUsers = users.filter(u => {
    if (providerFilter === 'all') return true;
    if (providerFilter === 'google') return u.social_provider === 'google';
    if (providerFilter === 'kakao') return u.social_provider === 'kakao';
    if (providerFilter === 'email') return !u.social_provider;
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case REPORT_STATUS.PENDING: return 'status-pending';
      case REPORT_STATUS.REVIEWED: return 'status-reviewed';
      case REPORT_STATUS.DISMISSED: return 'status-dismissed';
      case REPORT_STATUS.ACTIONED: return 'status-actioned';
      default: return '';
    }
  };

  const pendingReports = reports.filter(r => r.status === REPORT_STATUS.PENDING);

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>{t('admin.title')}</h1>
        <p>{t('admin.subtitle')}</p>
      </header>

      {message && (
        <div className={`admin-message ${message.includes('error') || message.includes('실패') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* 탭 */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          {t('admin.tabs.users')}
          {pendingUsers.length > 0 && <span className="tab-badge">{pendingUsers.length}</span>}
        </button>
        <button
          className={`admin-tab ${activeTab === 'moderation' ? 'active' : ''}`}
          onClick={() => setActiveTab('moderation')}
        >
          {t('admin.tabs.moderation')}
          {pendingReports.length > 0 && <span className="tab-badge">{pendingReports.length}</span>}
        </button>
      </div>

      {/* 회원 관리 탭 */}
      {activeTab === 'users' && (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <span className="stat-number">{users.length}</span>
              <span className="stat-label">{t('admin.stats.totalUsers')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{pendingUsers.length}</span>
              <span className="stat-label">{t('admin.stats.pendingUsers')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{users.filter(u => u.tier === 'family').length}</span>
              <span className="stat-label">{t('admin.stats.familyMembers')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{users.filter(u => u.tier === 'admin').length}</span>
              <span className="stat-label">{t('admin.stats.admins')}</span>
            </div>
          </div>

          {pendingUsers.length > 0 && (
            <div className="pending-section">
              <h2>{t('admin.pending.title')}</h2>
              <div className="pending-cards">
                {pendingUsers.map((u) => (
                  <div key={u.id} className="pending-card">
                    <div className="pending-info">
                      <strong>{u.name}</strong>
                      <span>{u.email}</span>
                      <span className="pending-date">{t('admin.pending.appliedOn')} {u.joinDate}</span>
                    </div>
                    <div className="pending-actions">
                      <button
                        onClick={() => handleApprove(u.id, u.name)}
                        className="approve-btn"
                      >
                        {t('admin.pending.approve')}
                      </button>
                      <button
                        onClick={() => handleReject(u.id, u.name)}
                        className="reject-btn"
                      >
                        {t('admin.pending.reject')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="users-section">
            <div className="users-header">
              <h2>{t('admin.members.title')}</h2>
              <div className="provider-filter">
                <button
                  className={`filter-btn ${providerFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setProviderFilter('all')}
                >
                  전체 ({users.length})
                </button>
                <button
                  className={`filter-btn ${providerFilter === 'google' ? 'active' : ''}`}
                  onClick={() => setProviderFilter('google')}
                >
                  🔵 Google ({users.filter(u => u.social_provider === 'google').length})
                </button>
                <button
                  className={`filter-btn ${providerFilter === 'kakao' ? 'active' : ''}`}
                  onClick={() => setProviderFilter('kakao')}
                >
                  🟡 Kakao ({users.filter(u => u.social_provider === 'kakao').length})
                </button>
                <button
                  className={`filter-btn ${providerFilter === 'email' ? 'active' : ''}`}
                  onClick={() => setProviderFilter('email')}
                >
                  ✉️ 이메일 ({users.filter(u => !u.social_provider).length})
                </button>
              </div>
            </div>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>가입방법</th>
                    <th>{t('admin.table.name')}</th>
                    <th>{t('admin.table.email')}</th>
                    <th>{t('admin.table.tier')}</th>
                    <th>가입일</th>
                    <th>마지막 접속</th>
                    <th>{t('admin.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const providerInfo = getProviderInfo(u.social_provider);
                    return (
                      <tr key={u.id} className={u.id === user.id ? 'current-user' : ''}>
                        <td>
                          <span className={`provider-badge ${providerInfo.className}`}>
                            {providerInfo.icon} {providerInfo.name}
                          </span>
                        </td>
                        <td>
                          {u.name}
                          {u.id === user.id && <span className="you-badge">{t('admin.you')}</span>}
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <select
                            value={u.tier}
                            onChange={(e) => handleTierChange(u.id, e.target.value)}
                            className="tier-select"
                          >
                            <option value={USER_TIERS.GUEST}>{getTierDisplayName('guest')}</option>
                            <option value={USER_TIERS.GENERAL}>{getTierDisplayName('general')}</option>
                            <option value={USER_TIERS.SUBSCRIBER}>{getTierDisplayName('subscriber')}</option>
                            <option value={USER_TIERS.FAMILY}>{getTierDisplayName('family')}</option>
                            <option value={USER_TIERS.ADMIN}>{getTierDisplayName('admin')}</option>
                          </select>
                        </td>
                        <td>{u.join_date || '-'}</td>
                        <td>{u.last_login ? formatDate(u.last_login) : '-'}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            className="delete-btn"
                            disabled={u.id === user.id}
                          >
                            {t('admin.table.delete')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 콘텐츠 관리 탭 */}
      {activeTab === 'moderation' && (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <span className="stat-number">{pendingReports.length}</span>
              <span className="stat-label">{t('admin.moderation.stats.pending')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{reports.length}</span>
              <span className="stat-label">{t('admin.moderation.stats.total')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{hiddenPosts.length}</span>
              <span className="stat-label">{t('admin.moderation.stats.hidden')}</span>
            </div>
          </div>

          {/* 신고 목록 */}
          <div className="moderation-section">
            <h2>{t('admin.moderation.reports')}</h2>
            {reports.length === 0 ? (
              <p className="no-data">{t('admin.moderation.noReports')}</p>
            ) : (
              <div className="reports-list">
                {reports.map((report) => (
                  <div key={report.id} className={`report-card ${report.status}`}>
                    <div className="report-header">
                      <span className={`report-type ${report.type}`}>
                        {report.type === 'post' ? t('admin.moderation.type.post') : t('admin.moderation.type.comment')}
                      </span>
                      <span className={`report-status ${getStatusBadgeClass(report.status)}`}>
                        {t(`admin.moderation.status.${report.status}`)}
                      </span>
                    </div>
                    <div className="report-content">
                      <p className="report-target">
                        <strong>{report.type === 'post' ? report.postTitle : report.commentContent}...</strong>
                      </p>
                      <p className="report-reason">{t('admin.moderation.reason')}: {report.reason}</p>
                      <div className="report-meta">
                        <span>{t('admin.moderation.reportedBy')}: {report.reporter.name}</span>
                        <span>{t('admin.moderation.author')}: {report.author.name}</span>
                        <span>{formatDate(report.createdAt)}</span>
                      </div>
                    </div>
                    {report.status === REPORT_STATUS.PENDING && (
                      <div className="report-actions">
                        <button
                          onClick={() => handleReportAction(report.id, 'hide')}
                          className="action-btn hide"
                        >
                          {t('admin.moderation.actions.hide')}
                        </button>
                        <button
                          onClick={() => handleReportAction(report.id, 'dismiss')}
                          className="action-btn dismiss"
                        >
                          {t('admin.moderation.actions.dismiss')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 숨겨진 게시글 */}
          {hiddenPosts.length > 0 && (
            <div className="moderation-section">
              <h2>{t('admin.moderation.hiddenPosts')}</h2>
              <div className="hidden-posts-list">
                {hiddenPosts.map((post) => (
                  <div key={post.id} className="hidden-post-card">
                    <div className="hidden-post-info">
                      <strong>{post.title}</strong>
                      <span>{post.author.name}</span>
                      <span>{t('admin.moderation.reportCount')}: {post.reportCount}</span>
                    </div>
                    <button
                      onClick={() => handleRestorePost(post.id)}
                      className="restore-btn"
                    >
                      {t('admin.moderation.actions.restore')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Admin;
