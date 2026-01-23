import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Video, 
  BarChart3, 
  Settings, 
  Shield,
  ChevronsLeft,
  ChevronsRight,
  X
} from 'lucide-react';
import PropTypes from 'prop-types';
import './Sidebar.css';

/**
 * Sidebar Component
 * 
 * Collapsible navigation sidebar with:
 * - Navigation items with active state
 * - Collapse/expand functionality
 * - Role-based item filtering (future)
 */

const navigationItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/junctions', label: 'Live Monitoring', icon: Video },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/control', label: 'Control Panel', icon: Settings, requiresAdmin: true },
  { path: '/admin', label: 'Administration', icon: Shield, requiresAdmin: true },
];

const Sidebar = ({ 
  collapsed = false, 
  onToggle,
  mobileOpen = false,
  onMobileClose
}) => {
  const location = useLocation();

  // Filter items based on user role (placeholder - implement with actual auth)
  const visibleItems = navigationItems; // All items visible for now

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}
        aria-label="Main navigation"
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <span className={`sidebar-header-text ${collapsed ? 'hidden' : ''}`}>
            Navigation
          </span>
          
          {/* Mobile Close Button */}
          <button 
            className="sidebar-close-btn mobile-only"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

          {/* Collapse Toggle (Desktop) */}
          <button 
            className="sidebar-toggle desktop-only"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" role="navigation">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${active ? 'nav-item-active' : ''} ${collapsed ? 'nav-item-collapsed' : ''}`}
                title={collapsed ? item.label : undefined}
                onClick={onMobileClose}
              >
                <Icon size={20} className="nav-icon" aria-hidden="true" />
                <span className={`nav-label ${collapsed ? 'hidden' : ''}`}>
                  {item.label}
                </span>
                {active && !collapsed && (
                  <span className="nav-active-indicator" aria-hidden="true" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <span className={`version-text ${collapsed ? 'hidden' : ''}`}>
            Version 2.5.0 Beta
          </span>
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  /** Whether sidebar is collapsed */
  collapsed: PropTypes.bool,
  /** Callback when collapse toggle is clicked */
  onToggle: PropTypes.func,
  /** Whether mobile menu is open */
  mobileOpen: PropTypes.bool,
  /** Callback to close mobile menu */
  onMobileClose: PropTypes.func,
};

export default Sidebar;
