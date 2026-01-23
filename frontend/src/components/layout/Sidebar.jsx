import React from 'react';
import './Sidebar.css';

const Sidebar = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'monitoring', label: 'Live Monitoring' },
    { id: 'junction', label: 'Junction Detail' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'control', label: 'Control Panel' },
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
            <li key={item.id}>
              <button 
                className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                onClick={() => onNavigate && onNavigate(item.id)}
              >
                {item.label}
              </button>
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
