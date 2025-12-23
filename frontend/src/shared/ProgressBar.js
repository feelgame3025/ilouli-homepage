import React from 'react';
import PropTypes from 'prop-types';
import './ProgressBar.css';

const ProgressBar = ({
  value = 0,
  max = 100,
  showLabel = false,
  size = 'md',
  color = 'primary',
  animated = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const progressClasses = [
    'progress-bar',
    `progress-${size}`,
    `progress-${color}`,
    animated ? 'progress-animated' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={progressClasses}>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          {animated && <div className="progress-shimmer" />}
        </div>
      </div>
      {showLabel && (
        <span className="progress-label">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  showLabel: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['primary', 'success', 'warning', 'error']),
  animated: PropTypes.bool,
};

export default ProgressBar;
