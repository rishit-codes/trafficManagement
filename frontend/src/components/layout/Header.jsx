import React from 'react';
import { Bell, User } from 'lucide-react';

const Header = ({ title }) => {
  return (
    <header className="header">
      <div className="header-title">
        <h2>{title}</h2>
      </div>
      
      <div className="header-actions">
        <div className="status-badge">
          <span className="status-dot"></span>
          System Online
        </div>
        
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={20} color="var(--color-text-muted)" />
        </button>
        
        <button className="icon-btn" aria-label="User Profile">
          <div className="avatar">
            <User size={20} color="var(--color-text-main)" />
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
