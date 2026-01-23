// Status thresholds based on Y (degree of saturation)
export const STATUS_THRESHOLDS = {
  OPTIMAL: 0.7,      // Y < 0.7 = Green/Optimal
  WARNING: 0.85,     // 0.7 ≤ Y < 0.85 = Yellow/Warning
  // Y ≥ 0.85 = Red/Critical
};

// Status color mapping
export const STATUS_COLORS = {
  optimal: {
    bg: '#ECFDF5',
    text: '#065F46',
    border: '#D1FAE5',
    icon: '#059669',
  },
  warning: {
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
    icon: '#D97706',
  },
  critical: {
    bg: '#FEE2E2',
    text: '#991B1B',
    border: '#FCA5A5',
    icon: '#DC2626',
  },
  offline: {
    bg: '#F3F4F6',
    text: '#4B5563',
    border: '#E5E7EB',
    icon: '#6B7280',
  },
};

// Signal phase colors
export const SIGNAL_COLORS = {
  green: '#059669',
  yellow: '#D97706',
  red: '#DC2626',
  all_red: '#7F1D1D',
};

// API refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  REALTIME: 5000,      // 5 seconds for live data
  FREQUENT: 30000,     // 30 seconds
  STANDARD: 60000,     // 1 minute
  SLOW: 300000,        // 5 minutes
};

// Map configuration for Vadodara
export const MAP_CONFIG = {
  center: [22.3072, 73.1812], // Vadodara coordinates
  zoom: 13,
  maxZoom: 18,
  minZoom: 10,
};

// Vehicle types and their PCU values
export const PCU_VALUES = {
  car: 1.0,
  bus: 3.0,
  truck: 2.5,
  motorcycle: 0.5,
  auto: 0.75,
  bicycle: 0.3,
};

// Navigation items for sidebar
export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', iconName: 'LayoutDashboard' },
  { path: '/junctions', label: 'Live Monitoring', iconName: 'Video' },
  { path: '/analytics', label: 'Analytics', iconName: 'BarChart2' },
  { path: '/control', label: 'Control Panel', iconName: 'Settings' },
  { path: '/admin', label: 'Administration', iconName: 'Shield' },
];
