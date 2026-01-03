import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './SubMenu.css';

/**
 * 얇은 서브 메뉴 컴포넌트
 * @param {Array} items - 메뉴 아이템 배열 [{ path, label, icon }]
 * @param {string} basePath - 기본 경로 (선택사항)
 */
const SubMenu = ({ items, basePath = '' }) => {
  const location = useLocation();

  return (
    <nav className="sub-menu">
      <div className="sub-menu-inner">
        {items.map((item) => {
          const fullPath = basePath ? `${basePath}${item.path}` : item.path;
          const isActive = location.pathname === fullPath ||
                          (item.path === '/' && location.pathname === basePath);

          return (
            <NavLink
              key={item.path}
              to={fullPath}
              className={`sub-menu-item ${isActive ? 'active' : ''}`}
            >
              {item.icon && <span className="sub-menu-icon">{item.icon}</span>}
              <span className="sub-menu-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default SubMenu;
