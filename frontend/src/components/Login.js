import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { openInExternalBrowser } from '../services/socialAuth';
import './Login.css';

const Login = () => {
  const { t } = useTranslation();
  const { login, socialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('social'); // 'social' or 'email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [showExternalBrowserPrompt, setShowExternalBrowserPrompt] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.message === 'Account pending approval') {
        setError(t('auth.login.errorPending'));
      } else if (err.message === 'Account rejected') {
        setError(t('auth.login.errorRejected'));
      } else {
        setError(t('auth.login.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError('');
    setShowExternalBrowserPrompt(false);
    setSocialLoading(provider);

    try {
      await socialLogin(provider);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Social login error:', err);
      if (err.message === 'Account rejected') {
        setError(t('auth.login.errorRejected'));
      } else if (err.error === 'popup_closed_by_user') {
        // 사용자가 팝업 닫음 - 에러 표시 안함
      } else if (err.type === 'webview_blocked') {
        // WebView에서 Google 로그인 차단됨
        setShowExternalBrowserPrompt(true);
      } else {
        setError(t('auth.social.error') + ` (${err.message || err.error || 'Unknown error'})`);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleOpenInExternalBrowser = () => {
    openInExternalBrowser(window.location.href);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('URL이 복사되었습니다.\nChrome 또는 Safari에서 붙여넣기 하세요.');
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('auth.login.title')}</h1>
        <p className="auth-subtitle">{t('auth.login.subtitle')}</p>

        {error && <div className="auth-error">{error}</div>}

        {/* 외부 브라우저 안내 */}
        {showExternalBrowserPrompt && (
          <div className="external-browser-prompt">
            <div className="prompt-icon">🌐</div>
            <div className="prompt-content">
              <strong>외부 브라우저에서 로그인해주세요</strong>
              <p>
                Google 로그인은 보안상 인앱 브라우저에서 지원되지 않습니다.
                Chrome 또는 Safari에서 열어주세요.
              </p>
              <div className="prompt-actions">
                <button onClick={handleOpenInExternalBrowser} className="open-browser-btn">
                  외부 브라우저로 열기
                </button>
                <button onClick={handleCopyUrl} className="copy-url-btn">
                  URL 복사
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 로그인 탭 */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            간편 로그인
          </button>
          <button
            type="button"
            className={`login-tab ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            이메일 로그인
          </button>
        </div>

        {/* 소셜 로그인 탭 */}
        {activeTab === 'social' && (
          <div className="social-login-section">
            <button
              type="button"
              className="social-btn kakao-btn"
              onClick={() => handleSocialLogin('kakao')}
              disabled={socialLoading}
            >
              <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.84 5.18 4.59 6.55-.2.76-.73 2.75-.84 3.18-.14.54.2.53.42.39.17-.11 2.72-1.85 3.83-2.6.65.09 1.32.14 2 .14 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
              </svg>
              {socialLoading === 'kakao' ? t('auth.social.loading') : t('auth.social.kakao')}
            </button>

            <button
              type="button"
              className="social-btn google-btn"
              onClick={() => handleSocialLogin('google')}
              disabled={socialLoading}
            >
              <svg className="social-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {socialLoading === 'google' ? t('auth.social.loading') : t('auth.social.google')}
            </button>
          </div>
        )}

        {/* 이메일 로그인 탭 */}
        {activeTab === 'email' && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">{t('auth.email')}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('auth.password')}</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? t('auth.login.loading') : t('auth.login.button')}
            </button>

            <p className="admin-login-hint">
              관리자 계정만 이메일 로그인이 가능합니다
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
