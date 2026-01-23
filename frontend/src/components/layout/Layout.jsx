import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../styles/layout.css';

const Layout = ({ children, activePage, setActivePage }) => {
  // Map page IDs to Titles
  const titles = {
    dashboard: 'City Overview',
    junctions: 'Junction Management',
    analytics: 'Traffic Analytics',
    settings: 'System Configuration'
  };

  return (
    <div className="layout-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <Header title={titles[activePage] || 'TrafficOS'} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
