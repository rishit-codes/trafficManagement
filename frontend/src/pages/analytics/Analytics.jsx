import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Clock, TrendingUp } from 'lucide-react';

const data = [
  { name: '00:00', vehicles: 120 },
  { name: '04:00', vehicles: 80 },
  { name: '08:00', vehicles: 2400 },
  { name: '12:00', vehicles: 1800 },
  { name: '16:00', vehicles: 2800 },
  { name: '20:00', vehicles: 1400 },
  { name: '23:59', vehicles: 400 },
];

const vehicleTypes = [
  { name: 'Cars', count: 12450 },
  { name: 'Bikes', count: 8200 },
  { name: 'Buses', count: 1400 },
  { name: 'Trucks', count: 850 },
];

const Analytics = () => {
  return (
    <div className="analytics-grid">
      <div className="kpi-row">
        <div className="kpi-card">
          <span className="kpi-label">Total Traffic Vol</span>
          <div className="kpi-value">22,840</div>
          <div className="kpi-change positive">
            <TrendingUp size={16} /> <span>+12.5% vs yesterday</span>
          </div>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Avg Wait Time</span>
          <div className="kpi-value">38s</div>
          <div className="kpi-change negative">
            <Clock size={16} /> <span>-5% improvement</span>
          </div>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">System Efficiency</span>
          <div className="kpi-value">94%</div>
          <div className="kpi-change positive">
            <Activity size={16} /> <span>Optimal</span>
          </div>
        </div>
      </div>

      <div className="chart-section" style={{ gridColumn: '1 / 2' }}>
        <h3 className="chart-title">Traffic Volume (24h)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="var(--color-text-dim)" />
            <YAxis stroke="var(--color-text-dim)" />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-primary)' }}
              itemStyle={{ color: 'var(--color-text-main)' }}
            />
            <Area type="monotone" dataKey="vehicles" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorVehicles)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section" style={{ gridColumn: '2 / 3' }}>
        <h3 className="chart-title">Vehicle Composition</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={vehicleTypes}>
             <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="var(--color-text-dim)" />
            <YAxis stroke="var(--color-text-dim)" />
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.05)'}}
              contentStyle={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-secondary)' }}
            />
            <Bar dataKey="count" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;
