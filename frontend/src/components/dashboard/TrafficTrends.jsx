import { Card } from '../common';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './dashboard.css';

const data = [
  { time: '00:00', volume: 120, congestion: 10 },
  { time: '04:00', volume: 80, congestion: 5 },
  { time: '08:00', volume: 850, congestion: 65 },
  { time: '12:00', volume: 600, congestion: 40 },
  { time: '16:00', volume: 950, congestion: 78 },
  { time: '20:00', volume: 500, congestion: 35 },
  { time: '23:59', volume: 200, congestion: 20 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-time">{label}</p>
        <p className="tooltip-value blue">Volume: {payload[0].value} PCU</p>
        <p className="tooltip-value red">Congestion: {payload[1].value}%</p>
      </div>
    );
  }
  return null;
};

function TrafficTrends() {
  return (
    <Card className="traffic-trends-card">
        <div className="chart-header">
            <div>
                <h3 className="chart-title">Traffic Volume Trends</h3>
                <p className="chart-subtitle">24-hour traffic patterns across monitored junctions</p>
            </div>
        </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B' }}
                dy={10}
            />
            <YAxis 
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="volume" 
                stroke="#2563EB" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }} 
            />
            <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="congestion" 
                stroke="#DC2626" 
                strokeWidth={2} 
                dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default TrafficTrends;
