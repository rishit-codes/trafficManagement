import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import JunctionDetail from './components/junction/JunctionDetail';
import Analytics from './components/analytics/Analytics';
import ControlPanel from './components/control/ControlPanel';
import LiveMonitoring from './components/monitoring/LiveMonitoring';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/live" element={<LiveMonitoring />} />
        <Route path="/junction" element={<JunctionDetail />} />
        <Route path="/junction/:id" element={<JunctionDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/control" element={<ControlPanel />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
