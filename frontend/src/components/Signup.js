import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Signup = () => {
  const { t } = useTranslation();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

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
      const result = await signup(name, email, password);
      if (result.pending) {
        setIsPending(true);
      }
    } catch (err) {
      setError(t('auth.signup.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // 승인 대기 화면
  if (isPending) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="pending-notice">
            <div className="pending-icon">⏳</div>
            <h1>{t('auth.signup.pendingTitle')}</h1>
            <p>{t('auth.signup.pendingMessage')}</p>
            <Link to="/" className="auth-button" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', marginTop: '1rem' }}>
              {t('auth.signup.backToHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('auth.signup.title')}</h1>
        <p className="auth-subtitle">{t('auth.signup.subtitle')}</p>

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
            {isLoading ? t('auth.signup.loading') : t('auth.signup.button')}
          </button>
        </form>

        <p className="auth-switch">
          {t('auth.signup.hasAccount')}{' '}
          <Link to="/login">{t('auth.signup.loginLink')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
