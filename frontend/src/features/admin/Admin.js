import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, USER_TIERS } from '../../contexts/AuthContext';
import { useCommunity, REPORT_STATUS } from '../../contexts/CommunityContext';
import { useNotification, NOTIFICATION_TYPES } from '../../contexts/NotificationContext';
import './Admin.css';

const Admin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const [apiFilter, setApiFilter] = useState('all'); // all, completed, pending, needs-key
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    kling: '',
    replicate: ''
  });
  const [apiKeyStatus, setApiKeyStatus] = useState({
    openai: false,
    kling: false,
    replicate: false
  });
  const [savingKeys, setSavingKeys] = useState(false);
  const [keyMessage, setKeyMessage] = useState('');

  // API 키 모달 상태
  const [keyModal, setKeyModal] = useState({ open: false, keyName: '', keyLabel: '', keyDesc: '' });
  const [modalKeyValue, setModalKeyValue] = useState('');

  // API 키 정보 매핑
  const apiKeyInfo = {
    openai: { label: 'OpenAI', desc: 'GPT-4, TTS, 숏폼 영상 생성에 사용', placeholder: 'sk-...' },
    kling: { label: 'Kling AI', desc: '이미지→영상 변환에 사용', placeholder: 'API 키 입력...' },
    replicate: { label: 'Replicate', desc: '이미지 업스케일링 (Real-ESRGAN)에 사용', placeholder: 'r8_...' }
  };

  // API ID와 필요한 키 매핑
  const apiKeyMapping = {
    11: 'kling',      // 이미지→영상
    12: 'replicate',  // 업스케일링
    13: 'openai'      // 숏폼 생성
  };

  // API 목록 정의 (상세 설명 포함)
  const apiList = [
    // 인증 API (완료)
    { id: 1, category: '인증', method: 'POST', endpoint: '/api/auth/login', description: '로그인', status: 'completed', priority: 'high',
      tooltip: 'Request: { email, password }\nResponse: { token, user }' },
    { id: 2, category: '인증', method: 'POST', endpoint: '/api/auth/signup', description: '회원가입', status: 'completed', priority: 'high',
      tooltip: 'Request: { name, email, password }\nResponse: { success, message }' },
    { id: 3, category: '인증', method: 'POST', endpoint: '/api/auth/social-login', description: '소셜 로그인 (Google/Kakao)', status: 'completed', priority: 'high',
      tooltip: 'Request: { provider, token }\nResponse: { token, user, isNewUser }' },
    { id: 4, category: '인증', method: 'GET', endpoint: '/api/auth/me', description: '현재 사용자 정보 조회', status: 'completed', priority: 'high',
      tooltip: 'Headers: Authorization Bearer\nResponse: { user }' },

    // 사용자 관리 API (완료)
    { id: 5, category: '사용자', method: 'GET', endpoint: '/api/users', description: '전체 회원 목록 (Admin)', status: 'completed', priority: 'high',
      tooltip: 'Admin 전용\nResponse: [{ id, name, email, tier, ... }]' },
    { id: 6, category: '사용자', method: 'GET', endpoint: '/api/users/pending', description: '승인 대기 회원 목록', status: 'completed', priority: 'high',
      tooltip: 'Admin 전용\nResponse: [{ id, name, email, joinDate }]' },
    { id: 7, category: '사용자', method: 'POST', endpoint: '/api/users/:id/approve', description: '회원 승인', status: 'completed', priority: 'high',
      tooltip: 'Admin 전용\nstatus를 approved로 변경' },
    { id: 8, category: '사용자', method: 'POST', endpoint: '/api/users/:id/reject', description: '회원 거절', status: 'completed', priority: 'high',
      tooltip: 'Admin 전용\n사용자 계정 삭제' },
    { id: 9, category: '사용자', method: 'PUT', endpoint: '/api/users/:id/tier', description: '회원 등급 변경', status: 'completed', priority: 'high',
      tooltip: 'Admin 전용\nRequest: { tier }\ntier: guest|general|subscriber|family|admin' },
    { id: 10, category: '사용자', method: 'DELETE', endpoint: '/api/users/:id', description: '회원 삭제', status: 'completed', priority: 'high',
      tooltip: 'Admin 전용\n본인 계정 삭제 불가' },

    // AI 기능 API (API 키 필요)
    { id: 11, category: 'AI', method: 'POST', endpoint: '/api/ai/image-to-video', description: '이미지→영상 변환', status: 'needs-key', priority: 'high',
      tooltip: 'Request: FormData { image, motionStyle, duration, resolution }\nResponse: { jobId, statusUrl }', note: 'Kling API 키 필요' },
    { id: 12, category: 'AI', method: 'POST', endpoint: '/api/ai/upscale', description: '이미지 업스케일링 (2x/4x)', status: 'needs-key', priority: 'high',
      tooltip: 'Request: FormData { image, scale, enhanceDetails }\nResponse: { jobId, statusUrl }', note: 'Replicate API 키 필요' },
    { id: 13, category: 'AI', method: 'POST', endpoint: '/api/ai/shortform/generate', description: '숏폼 영상 생성 요청', status: 'needs-key', priority: 'high',
      tooltip: 'Request: { topic, style, duration, resolution }\nResponse: { jobId, estimatedTime }', note: 'OpenAI API 키 필요' },
    { id: 14, category: 'AI', method: 'GET', endpoint: '/api/ai/job/:jobId', description: 'AI 작업 상태 조회', status: 'completed', priority: 'medium',
      tooltip: 'Response: { job: { status, parameters, outputFile } }\nstatus: pending|completed|failed' },
    { id: 15, category: 'AI', method: 'GET', endpoint: '/api/ai/job/:jobId/download', description: 'AI 결과물 다운로드', status: 'completed', priority: 'medium',
      tooltip: '완료된 작업의 결과 파일 다운로드\nContent-Type: application/octet-stream' },
    { id: 16, category: 'AI', method: 'GET', endpoint: '/api/ai/usage', description: 'AI 사용량 통계', status: 'completed', priority: 'low',
      tooltip: 'Admin 전용\nResponse: { stats: { total, today, topUsers } }' },

    // 커뮤니티 API (완료)
    { id: 17, category: '커뮤니티', method: 'GET', endpoint: '/api/community/posts', description: '게시글 목록 조회', status: 'completed', priority: 'medium',
      tooltip: 'Query: { board, page, limit }\nResponse: { posts, total, page }' },
    { id: 18, category: '커뮤니티', method: 'POST', endpoint: '/api/community/posts', description: '게시글 작성', status: 'completed', priority: 'medium',
      tooltip: 'Request: { board, title, content }\nResponse: { post }' },
    { id: 19, category: '커뮤니티', method: 'GET', endpoint: '/api/community/posts/:id', description: '게시글 상세 조회', status: 'completed', priority: 'medium',
      tooltip: 'Response: { post, comments }\n조회수 증가 처리' },
    { id: 20, category: '커뮤니티', method: 'PUT', endpoint: '/api/community/posts/:id', description: '게시글 수정', status: 'completed', priority: 'medium',
      tooltip: 'Request: { title, content }\n작성자만 수정 가능' },
    { id: 21, category: '커뮤니티', method: 'DELETE', endpoint: '/api/community/posts/:id', description: '게시글 삭제', status: 'completed', priority: 'medium',
      tooltip: '작성자 또는 Admin만 삭제 가능\n댓글도 함께 삭제' },
    { id: 22, category: '커뮤니티', method: 'POST', endpoint: '/api/community/posts/:id/comments', description: '댓글 작성', status: 'completed', priority: 'medium',
      tooltip: 'Request: { content, parentId? }\n대댓글 지원' },
    { id: 23, category: '커뮤니티', method: 'POST', endpoint: '/api/community/posts/:id/report', description: '게시글/댓글 신고', status: 'completed', priority: 'low',
      tooltip: 'Request: { type, targetId, reason }\ntype: post|comment' },

    // 파일 관리 API (부분 완료)
    { id: 24, category: '파일', method: 'POST', endpoint: '/api/files/upload', description: '파일 업로드', status: 'completed', priority: 'high',
      tooltip: 'Request: FormData { file, folder? }\n최대 50MB, 이미지/문서 지원' },
    { id: 25, category: '파일', method: 'GET', endpoint: '/api/files/view/:filename', description: '파일 조회/다운로드', status: 'completed', priority: 'high',
      tooltip: '저장된 파일 직접 서빙\nContent-Type 자동 설정' },
    { id: 26, category: '파일', method: 'DELETE', endpoint: '/api/files/:id', description: '파일 삭제', status: 'completed', priority: 'low',
      tooltip: 'DB 레코드 및 실제 파일 삭제\n업로더 또는 Admin만 가능' },
    { id: 27, category: '파일', method: 'GET', endpoint: '/api/files/list', description: '업로드 파일 목록', status: 'completed', priority: 'low',
      tooltip: 'Query: { folder?, limit? }\nResponse: { files }' },

    // 알림 API (완료)
    { id: 28, category: '알림', method: 'GET', endpoint: '/api/notifications', description: '알림 목록 조회', status: 'completed', priority: 'medium',
      tooltip: 'Query: { unreadOnly?, limit? }\nResponse: { notifications, unreadCount }' },
    { id: 29, category: '알림', method: 'PUT', endpoint: '/api/notifications/:id/read', description: '알림 읽음 처리', status: 'completed', priority: 'medium',
      tooltip: 'isRead를 true로 변경\nResponse: { success }' },
    { id: 30, category: '알림', method: 'DELETE', endpoint: '/api/notifications/:id', description: '알림 삭제', status: 'completed', priority: 'low',
      tooltip: '해당 알림 삭제\n본인 알림만 삭제 가능' },
  ];

  // 툴팁 상태
  const [activeTooltip, setActiveTooltip] = useState(null);

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

  // API 키 상태 로드
  const loadApiKeyStatus = async () => {
    try {
      const response = await fetch('https://api.ilouli.com/api/admin/api-keys/status', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeyStatus(data.status || {});
      }
    } catch (err) {
      console.error('Failed to load API key status');
    }
  };

  // API 키 저장
  const saveApiKey = async (keyName, keyValue) => {
    if (!keyValue.trim()) {
      setKeyMessage('API 키를 입력해주세요.');
      return;
    }

    setSavingKeys(true);
    try {
      const response = await fetch('https://api.ilouli.com/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keyName, keyValue })
      });

      if (response.ok) {
        setKeyMessage(`${keyName.toUpperCase()} API 키가 저장되었습니다.`);
        setApiKeys(prev => ({ ...prev, [keyName]: '' }));
        loadApiKeyStatus();
      } else {
        const data = await response.json();
        setKeyMessage(data.error || 'API 키 저장 실패');
      }
    } catch (err) {
      setKeyMessage('API 키 저장 중 오류 발생');
    }
    setSavingKeys(false);
    setTimeout(() => setKeyMessage(''), 3000);
  };

  // API 키 삭제
  const deleteApiKey = async (keyName) => {
    if (!window.confirm(`${apiKeyInfo[keyName]?.label || keyName} API 키를 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(`https://api.ilouli.com/api/admin/api-keys/${keyName}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setKeyMessage(`${apiKeyInfo[keyName]?.label || keyName} API 키가 삭제되었습니다.`);
        loadApiKeyStatus();
        setKeyModal({ open: false, keyName: '', keyLabel: '', keyDesc: '' });
      }
    } catch (err) {
      setKeyMessage('API 키 삭제 중 오류 발생');
    }
    setTimeout(() => setKeyMessage(''), 3000);
  };

  // API 키 모달 열기
  const openKeyModal = (keyName) => {
    const info = apiKeyInfo[keyName];
    if (!info) return;
    setKeyModal({
      open: true,
      keyName,
      keyLabel: info.label,
      keyDesc: info.desc
    });
    setModalKeyValue('');
  };

  // API 키 모달에서 저장
  const saveKeyFromModal = async () => {
    if (!modalKeyValue.trim()) {
      setKeyMessage('API 키를 입력해주세요.');
      setTimeout(() => setKeyMessage(''), 3000);
      return;
    }
    await saveApiKey(keyModal.keyName, modalKeyValue);
    setKeyModal({ open: false, keyName: '', keyLabel: '', keyDesc: '' });
    setModalKeyValue('');
  };

  // 상태 버튼 클릭 핸들러
  const handleStatusClick = (api) => {
    // needs-key 상태이거나, 이미 키가 설정된 AI API인 경우 모달 열기
    const keyName = apiKeyMapping[api.id];
    if (keyName) {
      openKeyModal(keyName);
    }
  };

  useEffect(() => {
    if (user && user.tier === 'admin') {
      loadUsers();
      loadPendingUsers();
      loadReports();
      loadHiddenPosts();
      loadApiKeyStatus();
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
        <button
          className={`admin-tab ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          API 관리
          <span className="tab-badge api-badge">{apiList.filter(a => a.status === 'pending').length}</span>
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
              <div className="users-header-top">
                <h2>{t('admin.members.title')}</h2>
                <button
                  onClick={() => navigate('/signup')}
                  className="create-account-btn"
                >
                  + 새 계정 생성
                </button>
              </div>
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

      {/* API 관리 탭 */}
      {activeTab === 'api' && (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <span className="stat-number">{apiList.length}</span>
              <span className="stat-label">전체 API</span>
            </div>
            <div className="stat-card stat-completed">
              <span className="stat-number">{apiList.filter(a => a.status === 'completed').length}</span>
              <span className="stat-label">완료</span>
            </div>
            <div className="stat-card stat-needs-key">
              <span className="stat-number">{apiList.filter(a => a.status === 'needs-key').length}</span>
              <span className="stat-label">API 키 필요</span>
            </div>
            <div className="stat-card stat-pending">
              <span className="stat-number">{apiList.filter(a => a.status === 'pending').length}</span>
              <span className="stat-label">대기</span>
            </div>
          </div>

          {/* API 키 상태 요약 */}
          <div className="api-keys-summary">
            <h3>API 키 상태</h3>
            <p className="section-desc">아래 표에서 "API키 필요" 또는 "키 설정됨" 버튼을 클릭하여 API 키를 설정하거나 변경할 수 있습니다.</p>
            <div className="key-status-chips">
              <button
                className={`key-chip ${apiKeyStatus.openai ? 'active' : 'inactive'}`}
                onClick={() => openKeyModal('openai')}
              >
                OpenAI {apiKeyStatus.openai ? '✅' : '❌'}
              </button>
              <button
                className={`key-chip ${apiKeyStatus.kling ? 'active' : 'inactive'}`}
                onClick={() => openKeyModal('kling')}
              >
                Kling AI {apiKeyStatus.kling ? '✅' : '❌'}
              </button>
              <button
                className={`key-chip ${apiKeyStatus.replicate ? 'active' : 'inactive'}`}
                onClick={() => openKeyModal('replicate')}
              >
                Replicate {apiKeyStatus.replicate ? '✅' : '❌'}
              </button>
            </div>
          </div>

          {keyMessage && (
            <div className={`key-message ${keyMessage.includes('실패') || keyMessage.includes('오류') || keyMessage.includes('입력') ? 'error' : 'success'}`}>
              {keyMessage}
            </div>
          )}

          <div className="api-section">
            <div className="api-header">
              <h2>API 엔드포인트 목록</h2>
              <div className="api-filter">
                <button
                  className={`filter-btn ${apiFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setApiFilter('all')}
                >
                  전체 ({apiList.length})
                </button>
                <button
                  className={`filter-btn ${apiFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setApiFilter('completed')}
                >
                  ✅ 완료 ({apiList.filter(a => a.status === 'completed').length})
                </button>
                <button
                  className={`filter-btn ${apiFilter === 'needs-key' ? 'active' : ''}`}
                  onClick={() => setApiFilter('needs-key')}
                >
                  🔑 API키 필요 ({apiList.filter(a => a.status === 'needs-key').length})
                </button>
                <button
                  className={`filter-btn ${apiFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setApiFilter('pending')}
                >
                  ⏳ 대기 ({apiList.filter(a => a.status === 'pending').length})
                </button>
              </div>
            </div>

            <div className="api-table-container">
              <table className="api-table">
                <thead>
                  <tr>
                    <th>카테고리</th>
                    <th>메소드</th>
                    <th>엔드포인트</th>
                    <th>설명</th>
                    <th>상태</th>
                    <th>우선순위</th>
                  </tr>
                </thead>
                <tbody>
                  {apiList
                    .filter(api => {
                      if (apiFilter === 'all') return true;
                      if (apiFilter === 'completed') return api.status === 'completed';
                      if (apiFilter === 'needs-key') return api.status === 'needs-key';
                      if (apiFilter === 'pending') return api.status === 'pending';
                      return true;
                    })
                    .map((api) => (
                      <tr
                        key={api.id}
                        className={`api-row ${api.status}`}
                        onMouseEnter={() => setActiveTooltip(api.id)}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <td>
                          <span className={`category-badge category-${api.category}`}>
                            {api.category}
                          </span>
                        </td>
                        <td>
                          <span className={`method-badge method-${api.method.toLowerCase()}`}>
                            {api.method}
                          </span>
                        </td>
                        <td className="endpoint-cell">
                          <code>{api.endpoint}</code>
                          {activeTooltip === api.id && api.tooltip && (
                            <div className="api-tooltip">
                              <pre>{api.tooltip}</pre>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="api-description">
                            {api.description}
                            {api.note && <span className="api-note">{api.note}</span>}
                          </div>
                        </td>
                        <td>
                          {apiKeyMapping[api.id] ? (
                            // AI API - 클릭 가능한 버튼
                            <button
                              className={`status-btn api-status-${apiKeyStatus[apiKeyMapping[api.id]] ? 'key-set' : 'needs-key'}`}
                              onClick={() => handleStatusClick(api)}
                            >
                              {apiKeyStatus[apiKeyMapping[api.id]]
                                ? '✅ 키 설정됨'
                                : '🔑 API키 필요'}
                            </button>
                          ) : (
                            // 일반 API - 일반 배지
                            <span className={`status-badge api-status-${api.status}`}>
                              {api.status === 'completed' ? '✅ 완료' : api.status === 'pending' ? '⏳ 대기' : '🔧 진행중'}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`priority-badge priority-${api.priority}`}>
                            {api.priority === 'high' ? '🔥 높음' : api.priority === 'medium' ? '➖ 중간' : '⬇️ 낮음'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* 카테고리별 요약 */}
            <div className="api-summary">
              <h3>카테고리별 현황</h3>
              <div className="summary-cards">
                {['인증', '사용자', 'AI', '커뮤니티', '파일', '알림'].map(category => {
                  const categoryApis = apiList.filter(a => a.category === category);
                  const completed = categoryApis.filter(a => a.status === 'completed').length;
                  const total = categoryApis.length;
                  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div key={category} className="summary-card">
                      <div className="summary-header">
                        <span className="summary-category">{category}</span>
                        <span className="summary-count">{completed}/{total}</span>
                      </div>
                      <div className="progress-bar-mini">
                        <div
                          className="progress-fill-mini"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="summary-percentage">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* API 키 입력 모달 */}
      {keyModal.open && (
        <div className="modal-overlay" onClick={() => setKeyModal({ open: false, keyName: '', keyLabel: '', keyDesc: '' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{keyModal.keyLabel} API 키 {apiKeyStatus[keyModal.keyName] ? '변경' : '설정'}</h3>
              <button
                className="modal-close"
                onClick={() => setKeyModal({ open: false, keyName: '', keyLabel: '', keyDesc: '' })}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">{keyModal.keyDesc}</p>

              {apiKeyStatus[keyModal.keyName] && (
                <div className="current-key-status">
                  <span className="key-status active">✅ 현재 키가 설정되어 있습니다</span>
                </div>
              )}

              <div className="modal-input-group">
                <label>API 키</label>
                <input
                  type="password"
                  placeholder={apiKeyInfo[keyModal.keyName]?.placeholder || 'API 키 입력...'}
                  value={modalKeyValue}
                  onChange={(e) => setModalKeyValue(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              {apiKeyStatus[keyModal.keyName] && (
                <button
                  className="modal-btn delete"
                  onClick={() => deleteApiKey(keyModal.keyName)}
                >
                  키 삭제
                </button>
              )}
              <button
                className="modal-btn cancel"
                onClick={() => setKeyModal({ open: false, keyName: '', keyLabel: '', keyDesc: '' })}
              >
                취소
              </button>
              <button
                className="modal-btn save"
                onClick={saveKeyFromModal}
                disabled={savingKeys}
              >
                {savingKeys ? '저장 중...' : apiKeyStatus[keyModal.keyName] ? '키 변경' : '키 저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
