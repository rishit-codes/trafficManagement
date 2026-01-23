import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingDown, Zap, Clock, Activity } from 'lucide-react'
import './MetricsDashboard.css'

function MetricsDashboard({ junctions, selectedJunction }) {
    // Sample comparison data
    const comparisonData = [
        { metric: 'Waiting Time', baseline: 45, optimized: 29, unit: 's' },
        { metric: 'Queue Length', baseline: 28, optimized: 15, unit: 'veh' },
        { metric: 'Spillback', baseline: 12, optimized: 2, unit: '/hr' },
        { metric: 'Throughput', baseline: 6800, optimized: 7850, unit: 'veh/hr' }
    ]

    // Time-series data for trend line
    const trendData = Array.from({ length: 12 }, (_, i) => ({
        time: `${i}:00`,
        baseline: 45 + Math.random() * 10 - 5,
        optimized: 29 + Math.random() * 5 - 2.5
    }))

    const improvements = {
        waitingTime: 35,
        spillback: 83,
        throughput: 15
    }

    return (
        <div className="metrics-dashboard glass">
            <div className="metrics-header">
                <TrendingDown size={24} />
                <h2>Performance Analytics</h2>
                <div className="time-range">
                    <Clock size={16} />
                    <span>Last 24 Hours</span>
                </div>
            </div>

            <div className="metrics-grid">
                {/* Impact Cards */}
                <motion.div
                    className="impact-card reduction glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="card-icon">
                        <Activity />
                    </div>
                    <div className="card-content">
                        <div className="card-value">-{improvements.waitingTime}%</div>
                        <div className="card-label">Delay Reduction</div>
                        <div className="card-trend">↓ 45s → 29s per vehicle</div>
                    </div>
                </motion.div>

                <motion.div
                    className="impact-card reduction glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="card-icon">
                        <Zap />
                    </div>
                    <div className="card-content">
                        <div className="card-value">-{improvements.spillback}%</div>
                        <div className="card-label">Spillback Events</div>
                        <div className="card-trend">↓ 12 → 2 events/hour</div>
                    </div>
                </motion.div>

                <motion.div
                    className="impact-card increase glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="card-icon">
                        <TrendingDown />
                    </div>
                    <div className="card-content">
                        <div className="card-value">+{improvements.throughput}%</div>
                        <div className="card-label">Throughput Increase</div>
                        <div className="card-trend">↑ 6.8k → 7.9k veh/hr</div>
                    </div>
                </motion.div>

                {/* Comparison Chart */}
                <div className="chart-container glass">
                    <h3>Baseline vs Optimized Comparison</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="metric"
                                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                            />
                            <YAxis
                                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(30, 41, 59, 0.95)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '15px', color: 'white' }}
                            />
                            <Bar
                                dataKey="baseline"
                                fill="rgba(148, 163, 184, 0.8)"
                                radius={[6, 6, 0, 0]}
                                name="Fixed Timing"
                            />
                            <Bar
                                dataKey="optimized"
                                fill="rgba(16, 185, 129, 0.8)"
                                radius={[6, 6, 0, 0]}
                                name="Optimized"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Trend Chart */}
                <div className="chart-container glass">
                    <h3>Waiting Time Trend (12 Hours)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="time"
                                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                            />
                            <YAxis
                                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                                label={{ value: 'Seconds', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(30, 41, 59, 0.95)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                            />
                            <Legend wrapperStyle={{ color: 'white' }} />
                            <Line
                                type="monotone"
                                dataKey="baseline"
                                stroke="#94a3b8"
                                strokeWidth={2}
                                name="Fixed Timing"
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="optimized"
                                stroke="#10b981"
                                strokeWidth={2}
                                name="Optimized"
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

export default MetricsDashboard
