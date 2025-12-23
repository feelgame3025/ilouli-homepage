import React from 'react';
import PropTypes from 'prop-types';
import './EmptyState.css';

const EmptyState = ({
  title = '데이터 없음',
  description,
  icon,
  action
}) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <div className="empty-state-content">
        <h3 className="empty-state-title">{title}</h3>
        {description && (
          <p className="empty-state-description">{description}</p>
        )}
      </div>
      {action && (
        <button
          className="empty-state-action"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.node,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
  })
};

export default EmptyState;
