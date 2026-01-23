import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ComparisonCharts = () => {
  const data = [
    { time: '06:00', fixed: 45, geoflow: 38 },
    { time: '08:00', fixed: 80, geoflow: 55 },
    { time: '10:00', fixed: 65, geoflow: 48 },
    { time: '12:00', fixed: 60, geoflow: 45 },
    { time: '14:00', fixed: 55, geoflow: 42 },
    { time: '16:00', fixed: 70, geoflow: 50 },
    { time: '18:00', fixed: 95, geoflow: 65 }, // Peak improvement
    { time: '20:00', fixed: 50, geoflow: 40 },
    { time: '22:00', fixed: 30, geoflow: 28 },
  ];

  return (
    <div className="analytics-card">
      <div className="chart-container-large">
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
              label={{ value: 'Avg Delay (s)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36} />
            <Line 
              name="Fixed Signal (Baseline)"
              type="monotone" 
              dataKey="fixed" 
              stroke="#9CA3AF" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              dot={false} 
            />
            <Line 
              name="GeoFlow Optimized"
              type="monotone" 
              dataKey="geoflow" 
              stroke="#059669" 
              strokeWidth={3} 
              dot={{ r: 4 }} 
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#059669', fontWeight: '500' }}>
        Result: 31% reduction in delay during 18:00 peak hours
      </div>
    </div>
  );
};

export default ComparisonCharts;
