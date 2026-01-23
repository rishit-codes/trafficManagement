import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-area">
        <Header />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
