import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Signup = () => {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.signup.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.signup.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      await signup(name, email, password);
      setIsSuccess(true);
    } catch (err) {
      setError(t('auth.signup.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // 계정 생성 성공 화면
  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="pending-notice">
            <div className="pending-icon">✅</div>
            <h1>계정 생성 완료</h1>
            <p>새 계정이 성공적으로 생성되었습니다.<br />회원 관리 페이지에서 승인 처리해주세요.</p>
            <button
              onClick={() => navigate('/')}
              className="auth-button"
              style={{ marginTop: '1rem' }}
            >
              관리자 대시보드로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>새 계정 생성</h1>
        <p className="auth-subtitle">관리자 전용 - 이메일 계정을 생성합니다</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">{t('auth.name')}</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.namePlaceholder')}
              required
              autoComplete="name"
            />
          </div>

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
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? '생성 중...' : '계정 생성'}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/">← 관리자 대시보드로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
