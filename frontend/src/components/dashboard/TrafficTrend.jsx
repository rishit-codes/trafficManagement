import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const TrafficTrend = ({ data, loading, junctionName }) => {
  const hasData = data && data.length > 0;

  return (
    <div className="dashboard-card trend-card">
      <div className="trend-header">
        <h3 className="panel-title">
          Traffic Volume Trend {junctionName ? `- ${junctionName}` : ''}
        </h3>
        <span className="trend-subtitle">Last 24 Hours • Vehicle Count (PCU)</span>
      </div>
      {hasData ? (
        <div className="trend-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                dy={10}
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ color: '#1E40AF', fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#2563EB"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorVolume)"
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="trend-chart-container empty-trend">
          <div className="empty-content">
            <div className="spinner"></div>
            <p>Syncing historical data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficTrend;
