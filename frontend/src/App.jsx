import React, { useState } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import JunctionDetails from './pages/junction/JunctionDetails';
import Analytics from './pages/analytics/Analytics';
import Settings from './pages/settings/Settings';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'junctions':
        return <JunctionDetails />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
