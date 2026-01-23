import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './JunctionDetail.css';

const AnalyticsChart = ({ junctionId }) => {
    // Mock data for demo - in prod fetch from /history/{id}
    const data = [
        { time: '06:00', flow: 400 },
        { time: '09:00', flow: 1200 },
        { time: '12:00', flow: 900 },
        { time: '15:00', flow: 1100 },
        { time: '18:00', flow: 1800 },
        { time: '21:00', flow: 600 },
        { time: '00:00', flow: 200 },
    ];

    return (
        <div className="detail-panel" style={{ marginTop: '24px' }}>
            <div className="panel-header-row">
                <h4 className="panel-title">Traffic Volume Trend (24h)</h4>
                <div className="chart-legend">
                    <span className="legend-dot"></span> Traffic Volume (PCU)
                </div>
            </div>

            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                            cursor={{ stroke: '#3B82F6', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="flow"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorFlow)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="chart-footer">
                <span>Analysis: Traffic volume peaks at 18:00 (Evening Rush)</span>
            </div>
        </div>
    );
};

export default AnalyticsChart;
