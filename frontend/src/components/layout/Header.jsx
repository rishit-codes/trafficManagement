import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        {/* Title removed as per user request */}
      </div>

      <div className="header-right">
        <div className="status-pill">
          <span className="status-dot"></span>
          Backend Offline (Demo)
        </div>
        <div className="user-avatar">
          OP
        </div>
      </div>
    </header>
  );
};

export default Header;
