import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Menu } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';
import './Layout.css';

// LocalStorage key for sidebar state
const SIDEBAR_STATE_KEY = 'vtms_sidebar_collapsed';

/**
 * Layout Component
 * 
 * Main application layout wrapper that provides:
 * - Fixed Header at top
 * - Collapsible Sidebar on left (state persisted in localStorage)
 * - Main content area with responsive margins
 * - Mobile support with overlay sidebar
 */
const Layout = ({ children }) => {
  // Initialize sidebar state from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persist sidebar state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(sidebarCollapsed));
    } catch (error) {
      console.warn('Failed to save sidebar state:', error);
    }
  }, [sidebarCollapsed]);

  // Close mobile menu on route change or window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleMobileMenuOpen = () => {
    setMobileMenuOpen(true);
  };

  return (
    <div className="layout">
      {/* Header */}
      <Header onMobileMenuToggle={handleMobileMenuOpen} />

      {/* Content Wrapper */}
      <div className="layout-content-wrapper">
        {/* Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
          mobileOpen={mobileMenuOpen}
          onMobileClose={handleMobileMenuClose}
        />

        {/* Main Content */}
        <main 
          className={`main-content ${sidebarCollapsed ? 'main-content-collapsed' : ''}`}
          role="main"
          id="main-content"
        >
          <div className="content-container">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Button (Fixed position) */}
      <button 
        className="mobile-menu-btn"
        onClick={handleMobileMenuOpen}
        aria-label="Open navigation menu"
        aria-expanded={mobileMenuOpen}
        aria-controls="sidebar-nav"
      >
        <Menu size={24} />
      </button>
    </div>
  );
};

Layout.propTypes = {
  /** Page content to render in main area */
  children: PropTypes.node.isRequired,
};

export default Layout;
