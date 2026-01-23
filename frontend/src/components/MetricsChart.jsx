import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown } from 'lucide-react';
import './MetricsChart.css';

function MetricsChart({ junction }) {
    // Sample comparison data - in production, this would come from API
    const comparisonData = [
        {
            metric: 'Waiting Time',
            baseline: 45,
            optimized: 29,
            unit: 'seconds'
        },
        {
            metric: 'Queue Length',
            baseline: 28,
            optimized: 15,
            unit: 'vehicles'
        },
        {
            metric: 'Spillback Events',
            baseline: 12,
            optimized: 2,
            unit: 'per hour'
        },
        {
            metric: 'Throughput',
            baseline: 6800,
            optimized: 7850,
            unit: 'veh/hr'
        }
    ];

    const improvements = {
        waitingTime: ((45 - 29) / 45 * 100).toFixed(0),
        queueLength: ((28 - 15) / 28 * 100).toFixed(0),
        spillback: ((12 - 2) / 12 * 100).toFixed(0),
        throughput: ((7850 - 6800) / 6800 * 100).toFixed(0)
    };

    return (
        <div className="metrics-chart">
            <div className="panel-header">
                <TrendingDown size={24} />
                <h2>Performance Metrics</h2>
            </div>

            <div className="improvement-summary">
                <div className="improvement-card">
                    <span className="improvement-value">-{improvements.waitingTime}%</span>
                    <span className="improvement-label">Waiting Time ↓</span>
                </div>
                <div className="improvement-card">
                    <span className="improvement-value">-{improvements.spillback}%</span>
                    <span className="improvement-label">Spillback Events ↓</span>
                </div>
                <div className="improvement-card success">
                    <span className="improvement-value">+{improvements.throughput}%</span>
                    <span className="improvement-label">Throughput ↑</span>
                </div>
            </div>

            <div className="chart-container">
                <h3>Baseline vs Optimized Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="metric"
                            tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <YAxis
                            tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                        />
                        <Bar
                            dataKey="baseline"
                            fill="#94a3b8"
                            radius={[8, 8, 0, 0]}
                            name="Fixed Timing (Baseline)"
                        />
                        <Bar
                            dataKey="optimized"
                            fill="#10b981"
                            radius={[8, 8, 0, 0]}
                            name="Webster Optimized"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="metrics-legend">
                <p className="legend-note">
                    <strong>Note:</strong> Metrics based on SUMO simulation comparison (600s duration).
                    Actual improvements may vary based on real-world traffic conditions.
                </p>
            </div>
        </div>
    );
}

export default MetricsChart;
