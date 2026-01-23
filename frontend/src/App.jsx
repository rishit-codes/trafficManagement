import React, { useState } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import JunctionDetail from './components/junction/JunctionDetail';
import Analytics from './components/analytics/Analytics';
import ControlPanel from './components/control/ControlPanel';
import LiveMonitoring from './components/monitoring/LiveMonitoring';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'monitoring':
        return <LiveMonitoring />;
      case 'junction':
        return <JunctionDetail />;
      case 'analytics':
        return <Analytics />;
      case 'control':
        return <ControlPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderContent()}
    </Layout>
  );
}

export default App;
