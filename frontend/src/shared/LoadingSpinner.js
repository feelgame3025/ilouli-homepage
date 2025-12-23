import React from 'react';
import PropTypes from 'prop-types';
import './LoadingSpinner.css';

const LoadingSpinner = ({
  size = 'md',
  color = null,
  text = null,
  fullScreen = false
}) => {
  const spinnerClasses = [
    'loading-spinner',
    `spinner-${size}`,
    fullScreen ? 'spinner-fullscreen' : ''
  ].filter(Boolean).join(' ');

  const spinnerContent = (
    <div className={spinnerClasses}>
      <div
        className="spinner-circle"
        style={color ? { borderTopColor: color } : {}}
      />
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="spinner-overlay">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.string,
  text: PropTypes.string,
  fullScreen: PropTypes.bool,
};

export default LoadingSpinner;
