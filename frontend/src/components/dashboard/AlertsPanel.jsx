import { Card, Badge } from '../common';
import './dashboard.css';

const alerts = [
  {
    id: 1,
    severity: 'critical',
    junction: 'Manjalpur Junction',
    message: 'Spillback detected on North approach - 92% occupancy',
    time: '2m ago',
  },
  {
    id: 2,
    severity: 'warning',
    junction: 'Sayajigunj Circle',
    message: 'Queue building on East approach',
    time: '5m ago',
  },
  {
    id: 3,
    severity: 'warning',
    junction: 'Karelibaug',
    message: 'Flow ratio approaching threshold (Y = 0.82)',
    time: '12m ago',
  },
    {
    id: 4,
    severity: 'optimal',
    junction: 'Alkapuri',
    message: 'Traffic flow normalized after VIP movement',
    time: '24m ago',
  },
];

function AlertItem({ alert }) {
  const isCritical = alert.severity === 'critical';
  const badgeVariant = 
    alert.severity === 'critical' ? 'danger' : 
    alert.severity === 'warning' ? 'warning' : 'success';

  return (
    <div className={`alert-item-govt ${isCritical ? 'critical-strip' : ''}`}>
      <div className="alert-top-row">
         <Badge variant={badgeVariant}>{alert.severity}</Badge>
         <span className="alert-time-muted">{alert.time}</span>
      </div>
      <div className="alert-content">
        <p className="alert-junction-name">{alert.junction}</p>
        <p className="alert-message-text">{alert.message}</p>
        <button className="alert-action-link">View Details →</button>
      </div>
    </div>
  );
}

function AlertsPanel() {
  const hasAlerts = alerts.length > 0;

  return (
    <Card className="alerts-panel-govt">
      <div className="alerts-header-govt">
        <div className="alerts-title-group">
          <h3 className="section-title">Live Alerts</h3>
          <div className="demo-badge">Demo</div>
        </div>
      </div>
      <div className="alerts-list-govt">
        {hasAlerts ? (
          alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
        ) : (
          <div className="alerts-empty">
            <p>All junctions operating normally</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default AlertsPanel;
