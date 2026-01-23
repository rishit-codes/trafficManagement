import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Bell, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut,
  AlertCircle
} from 'lucide-react';
import './Header.css';

/**
 * Header Component
 * 
 * Main application header with:
 * - VMC branding
 * - System status indicator (from API)
 * - Notification bell
 * - User profile dropdown
 */
const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch system status every 30 seconds
  const { data: systemStatus } = useQuery({
    queryKey: ['system', 'status'],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/system/status`);
        if (!response.ok) throw new Error('Failed to fetch status');
        return response.json();
      } catch (error) {
        return { status: 'error', message: 'Connection failed' };
      }
    },
    refetchInterval: 30000,
    retry: false,
  });

  // Mock user data (replace with actual API call when auth is implemented)
  const userData = {
    name: 'Admin User',
    role: 'System Administrator',
    initials: 'AU',
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine status styling
  const getStatusClass = () => {
    const status = systemStatus?.status || 'unknown';
    if (status === 'healthy' || status === 'online') return 'status-healthy';
    if (status === 'warning' || status === 'degraded') return 'status-warning';
    return 'status-error';
  };

  const getStatusText = () => {
    const status = systemStatus?.status || 'unknown';
    if (status === 'healthy' || status === 'online') return 'System Online';
    if (status === 'warning' || status === 'degraded') return 'Degraded Performance';
    if (status === 'error' || status === 'offline') return 'Connection Error';
    return 'Checking Status...';
  };

  return (
    <header className="header">
      {/* Left Section - Logo & Brand */}
      <div className="header-left">
        <div className="header-logo">
          <span className="logo-text">VMC</span>
        </div>
        <div className="header-brand">
          <h1 className="brand-title">Vadodara Traffic Management System</h1>
          <p className="brand-subtitle">Municipal Corporation Control Center</p>
        </div>
      </div>

      {/* Middle Section - System Status */}
      <div className={`header-status ${getStatusClass()}`}>
        <span className="status-dot" aria-hidden="true"></span>
        <span className="status-text">{getStatusText()}</span>
      </div>

      {/* Right Section - Notifications & Profile */}
      <div className="header-right">
        {/* Notification Button */}
        <button 
          className="notification-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={20} />
          <span className="notification-badge" aria-label="3 unread notifications"></span>
        </button>

        {/* User Profile Dropdown */}
        <div className="profile-dropdown" ref={dropdownRef}>
          <button 
            className={`profile-trigger ${dropdownOpen ? 'active' : ''}`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="profile-avatar">
              {userData.initials}
            </div>
            <div className="profile-info">
              <span className="profile-name">{userData.name}</span>
              <span className="profile-role">{userData.role}</span>
            </div>
            <ChevronDown 
              size={16} 
              className={`profile-chevron ${dropdownOpen ? 'open' : ''}`} 
            />
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu" role="menu">
              <button className="dropdown-item" role="menuitem">
                <User size={16} />
                <span>Profile</span>
              </button>
              <button className="dropdown-item" role="menuitem">
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item dropdown-item-danger" role="menuitem">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
