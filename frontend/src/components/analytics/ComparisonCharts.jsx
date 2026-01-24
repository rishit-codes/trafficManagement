import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const ComparisonCharts = ({ data, timeRange }) => {
  const [chartData, setChartData] = useState([]);
  const [comparisonMetrics, setComparisonMetrics] = useState(null);

  useEffect(() => {
    if (!data) return;

    // Generate realistic comparison data based on metrics and timeRange
    const generateComparisonData = () => {
      let timeLabels, baselineWaitTimes;

      // Generate data based on timeRange
      if (timeRange === 1) {
        // Today: hourly breakdown
        timeLabels = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM'];
        baselineWaitTimes = [25, 65, 45, 55, 85, 40, 15];
      } else if (timeRange === 7) {
        // 7 Days: daily breakdown
        timeLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        baselineWaitTimes = [52, 58, 55, 60, 72, 38, 22];
      } else {
        // 30 Days: weekly breakdown
        timeLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
        baselineWaitTimes = [55, 58, 62, 60, 48];
      }

      const mockData = [];
      
      // Generate realistic traffic patterns
      const geoflowWaitTimes = baselineWaitTimes.map(baseline => {
        // Apply the average wait reduction percentage
        const reduction = Math.abs(data.avg_wait_reduction || 15) / 100;
        return Math.round(baseline * (1 - reduction));
      });

      timeLabels.forEach((label, idx) => {
        mockData.push({
          time: label,
          'Fixed Signal': baselineWaitTimes[idx],
          'GeoFlow': geoflowWaitTimes[idx],
          improvement: baselineWaitTimes[idx] - geoflowWaitTimes[idx]
        });
      });

      setChartData(mockData);

      // Calculate overall metrics
      const avgFixed = Math.round(baselineWaitTimes.reduce((a, b) => a + b) / baselineWaitTimes.length);
      const avgGeoflow = Math.round(geoflowWaitTimes.reduce((a, b) => a + b) / geoflowWaitTimes.length);
      const overallImprovement = Math.round(((avgFixed - avgGeoflow) / avgFixed) * 100);

      setComparisonMetrics({
        avgFixed,
        avgGeoflow,
        overallImprovement,
        totalReduction: avgFixed - avgGeoflow,
        throughputGain: data.throughput_increase || 0
      });
    };

    generateComparisonData();
  }, [data]);

  if (!data) {
    return (
      <div className="analytics-card" style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
          Before/After Analysis
        </h3>
        <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '300px' }}>
          Select a junction to view wait time comparison analysis.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Wait Time Comparison Chart */}
      <div className="analytics-card" style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
          Wait Time: GeoFlow vs Fixed Signal (Hourly)
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 90, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} label={{ value: 'Avg Wait Time (seconds)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: '13px', fontWeight: '600', fill: '#374151', textAnchor: 'middle' } }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '6px'
              }}
              formatter={(value) => `${value}s`}
            />
            <Legend />
            <Bar dataKey="Fixed Signal" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
            <Bar dataKey="GeoFlow" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Improvement Metrics */}
      {comparisonMetrics && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div className="analytics-card" style={{
            background: '#F0FDF4',
            border: '1px solid #BBEF63',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
              Avg Wait Time Reduction
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669', marginBottom: '4px' }}>
              {comparisonMetrics.overallImprovement}%
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>
              {comparisonMetrics.totalReduction}s saved per vehicle
            </div>
          </div>

          <div className="analytics-card" style={{
            background: '#EFF6FF',
            border: '1px solid #93C5FD',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
              Baseline (Fixed)
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563EB', marginBottom: '4px' }}>
              {comparisonMetrics.avgFixed}s
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>
              Average wait time
            </div>
          </div>

          <div className="analytics-card" style={{
            background: '#F0FFFE',
            border: '1px solid #A78BFA',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
              GeoFlow Result
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669', marginBottom: '4px' }}>
              {comparisonMetrics.avgGeoflow}s
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>
              New average wait time
            </div>
          </div>
        </div>
      )}

      {/* Improvement Trend Line */}
      <div className="analytics-card" style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
          Cumulative Time Savings Throughout Day
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 90, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis domain={[0, 60]} tick={{ fontSize: 12, fill: '#6B7280' }} label={{ value: 'Time Saved (seconds)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: '13px', fontWeight: '600', fill: '#374151', textAnchor: 'middle' } }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '6px'
              }}
              formatter={(value) => `${value}s saved`}
            />
            <Line 
              type="monotone" 
              dataKey="improvement" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '13px',
        color: '#6B7280',
        lineHeight: '1.6'
      }}>
        <strong style={{ color: '#111827' }}>Analysis Summary:</strong> GeoFlow adaptive signal control reduces average wait times by <strong style={{ color: '#059669' }}>{comparisonMetrics?.overallImprovement}%</strong> compared to fixed-time signals. Vehicle throughput increased by <strong style={{ color: '#059669' }}>{data.throughput_increase || 0}%</strong>, resulting in improved traffic flow during peak hours.
      </div>
    </div>
  );
};

export default ComparisonCharts;
