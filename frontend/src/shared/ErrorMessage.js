import React from 'react';
import PropTypes from 'prop-types';
import './ErrorMessage.css';

const ErrorMessage = ({ message, type = 'error', onRetry, onDismiss, title }) => {
  const icons = {
    error: '⚠️',
    warning: '⚡',
    info: 'ℹ️'
  };

  return (
    <div className={`error-message error-message-${type}`}>
      <div className="error-message-content">
        <span className="error-message-icon">{icons[type]}</span>
        <div className="error-message-text">
          {title && <strong className="error-message-title">{title}</strong>}
          <span className="error-message-body">{message}</span>
        </div>
      </div>
      <div className="error-message-actions">
        {onRetry && (
          <button className="error-message-btn retry-btn" onClick={onRetry}>
            재시도
          </button>
        )}
        {onDismiss && (
          <button className="error-message-btn dismiss-btn" onClick={onDismiss}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['error', 'warning', 'info']),
  onRetry: PropTypes.func,
  onDismiss: PropTypes.func,
  title: PropTypes.string
};

export default ErrorMessage;
