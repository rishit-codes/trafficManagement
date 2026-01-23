import { MetricCard, Badge } from '../common';
import './dashboard.css';
import { Clock } from 'lucide-react';

// Custom layout for Active Junctions card to match spec
const ActiveJunctionsContent = () => (
  <div className="kpi-custom-content">
    <div className="kpi-subtext">88% operational</div>
    <div className="kpi-badges-row">
      <Badge variant="success">4 Optimal</Badge>
      <Badge variant="warning">2 Warning</Badge>
      <Badge variant="danger">1 Critical</Badge>
    </div>
  </div>
);

// Custom layout for System Efficiency
const EfficiencyContent = ({ value }) => (
  <div className="kpi-custom-content">
    <div className="kpi-subtext">Overall performance</div>
    <div className="progress-bar-container">
      <div className="progress-bar" style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

function KpiGrid() {
  return (
    <section className="kpi-grid">
      {/* Card 1: Active Junctions */}
      <MetricCard
        title="Active Junctions"
        value="7 / 8"
        trend="+2 vs yesterday"
        className="kpi-card"
      >
        <ActiveJunctionsContent />
      </MetricCard>

      {/* Card 2: Average Wait Time */}
      <MetricCard
        title="Average Wait Time"
        value="32"
        unit="s"
        trend="-29%"
        isTrendPositive={true} // In this context negative number is good (green)
        icon={<Clock size={20} className="text-warning" />}
        className="kpi-card"
      >
        <div className="kpi-subtext">vs 45s baseline</div>
      </MetricCard>

      {/* Card 3: Active Spillback Events */}
      <MetricCard
        title="Active Spillback Events"
        value="1"
        className="kpi-card"
        trend={<span className="link-text">View affected junctions →</span>}
      >
        <div className="mb-sm">
          <Badge variant="danger" dot>CRITICAL</Badge>
        </div>
      </MetricCard>

      {/* Card 4: System Efficiency */}
      <MetricCard
        title="System Efficiency"
        value="87"
        unit="%"
        className="kpi-card"
      >
        <EfficiencyContent value={87} />
      </MetricCard>
    </section>
  );
}

export default KpiGrid;
