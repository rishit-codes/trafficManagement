import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TimePatterns = () => {
  const data = [
    { hour: '00', volume: 100 }, { hour: '04', volume: 50 },
    { hour: '08', volume: 800 }, { hour: '12', volume: 600 },
    { hour: '16', volume: 750 }, { hour: '20', volume: 400 },
    { hour: '23', volume: 200 },
  ];

  return (
    <div className="analytics-card">
      <div className="chart-container-medium">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <YAxis hide />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="#3B82F6" 
              fill="#DBEAFE" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '12px' }}>
        System automatically widens green lanes during 08:00 and 16:00 peaks.
      </p>
    </div>
  );
};

export default TimePatterns;
