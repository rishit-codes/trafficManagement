import { DashboardHeader, KpiGrid, CityMap, AlertsPanel, TrafficTrends } from '../../components/dashboard';
import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <DashboardHeader />
        <KpiGrid />
        
        <section className="map-alerts-section">
          <CityMap />
          <AlertsPanel />
        </section>

        <TrafficTrends />
      </div>

      <footer className="status-footer-govt">
        <div className="footer-item">
          <span className="footer-dot offline" />
          <span>API Server: OFFLINE</span>
        </div>
        <div className="footer-item">
          <span className="footer-dot offline" />
          <span>Vision System: OFFLINE</span>
        </div>
        <div className="footer-item">
          <span className="footer-dot offline" />
          <span>Database: OFFLINE</span>
        </div>
        <div className="footer-item">
          <span>System Uptime: 99.98%</span>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
