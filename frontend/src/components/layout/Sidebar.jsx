import React from 'react';
import { LayoutDashboard, Map, BarChart2, Settings, TrafficCone } from 'lucide-react';

const Sidebar = ({ activePage, setActivePage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'junctions', label: 'Junctions', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <TrafficCone size={28} />
        <span>TrafficOS</span>
      </div>
      
      <nav className="nav-links">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button 
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
