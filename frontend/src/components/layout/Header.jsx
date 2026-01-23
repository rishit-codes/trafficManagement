import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        {/* Title removed as per user request */}
      </div>

      <div className="header-right">
        <div className="status-pill status-live">
          <span className="status-dot"></span>
          Live system active
        </div>
        <div className="user-avatar">
          OP
        </div>
      </div>
    </header>
  );
};

export default Header;
