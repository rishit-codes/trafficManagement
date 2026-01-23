import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const TrafficTrend = () => {
  const data = [
    { time: '00:00', volume: 120 }, { time: '03:00', volume: 80 },
    { time: '06:00', volume: 450 }, { time: '09:00', volume: 2200 },
    { time: '12:00', volume: 1800 }, { time: '15:00', volume: 1600 },
    { time: '18:00', volume: 2400 }, { time: '21:00', volume: 900 },
    { time: '23:59', volume: 300 },
  ];

  return (
    <div className="dashboard-card trend-card">
      <div className="trend-header">
        <h3 className="panel-title">Traffic Volume Trend (24h)</h3>
      </div>
      <div className="trend-chart-container">
        <ResponsiveContainer width="100%" height="100%">
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
    </div>
  );
};

export default TrafficTrend;
