import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/live', label: 'Live Monitoring' },
    { path: '/junction', label: 'Junction Detail' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/control', label: 'Control Panel' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-block">
          <span className="brand-geo">Geo</span>
          <span className="brand-flow">Flow</span>
        </div>
        <p className="brand-subtitle">Traffic intelligence platform</p>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        v1.0.0 Alpha
      </div>
    </aside>
  );
};

export default Sidebar;
