import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const TrafficTrend = ({ data, loading }) => {
  const hasData = data && data.length > 0;

  return (
    <div className="dashboard-card trend-card">
      <div className="trend-header">
        <h3 className="panel-title">
            Traffic Volume Trend 
        </h3>
      </div>
      {hasData ? (
        <div className="trend-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="volume" 
                stroke="#1E40AF" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="trend-chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#6B7280', fontStyle: 'italic' }}>Historical data unavailable</div>
        </div>
      )}
    </div>
  );
};

export default TrafficTrend;
