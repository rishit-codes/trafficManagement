import { useState } from 'react';
import trafficAPI from '../utils/api';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import './SpillbackAlert.css';

function SpillbackAlert({ junction }) {
    const [queues, setQueues] = useState({
        north: 15,
        south: 12,
        east: 35,
        west: 8
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleQueueChange = (direction, value) => {
        setQueues(prev => ({
            ...prev,
            [direction]: parseInt(value) || 0
        }));
    };

    const handleAnalyze = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await trafficAPI.analyzeSpillback(junction.id, queues);
            setResult(response.data);
        } catch (err) {
            setError('Failed to analyze spillback. ' + (err.response?.data?.detail || err.message));
            console.error('Spillback error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'OK': return 'success';
            case 'WARNING': return 'warning';
            case 'CRITICAL': return 'critical';
            default: return 'info';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'OK': return <CheckCircle size={20} />;
            case 'WARNING': return <Info size={20} />;
            case 'CRITICAL': return <AlertTriangle size={20} />;
            default: return <Info size={20} />;
        }
    };

    return (
        <div className="spillback-alert">
            <div className="panel-header">
                <AlertTriangle size={24} />
                <h2>Spillback Prevention</h2>
            </div>

            <div className="queue-inputs">
                <h3>Queue Lengths (vehicles)</h3>
                <div className="queue-grid">
                    {Object.keys(queues).map(direction => (
                        <div key={direction} className="queue-input">
                            <label>{direction.charAt(0).toUpperCase() + direction.slice(1)}</label>
                            <input
                                type="number"
                                value={queues[direction]}
                                onChange={(e) => handleQueueChange(direction, e.target.value)}
                                min="0"
                                max="100"
                            />
                            <span className="unit">vehicles</span>
                        </div>
                    ))}
                </div>
            </div>

            <button
                className="analyze-button"
                onClick={handleAnalyze}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <div className="spinner-small"></div>
                        Analyzing...
                    </>
                ) : (
                    <>
                        <AlertTriangle size={20} />
                        Analyze Spillback Risk
                    </>
                )}
            </button>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className="spillback-result">
                    <div className={`overall-status ${getStatusColor(result.overall_status)}`}>
                        {getStatusIcon(result.overall_status)}
                        <div className="status-info">
                            <span className="status-label">Overall Status</span>
                            <span className="status-value">{result.overall_status}</span>
                        </div>
                    </div>

                    {result.recommended_action && (
                        <div className="recommendation">
                            <h4>Recommended Action</h4>
                            <p>{result.recommended_action}</p>
                        </div>
                    )}

                    {result.approaches && Object.keys(result.approaches).length > 0 && (
                        <div className="approaches-container">
                            <h4>Approach Details</h4>
                            {Object.entries(result.approaches).map(([direction, data]) => (
                                <div key={direction} className={`approach-card ${getStatusColor(data.status)}`}>
                                    <div className="approach-header">
                                        <span className="approach-name">{direction.charAt(0).toUpperCase() + direction.slice(1)}</span>
                                        <span className={`status-badge ${getStatusColor(data.status)}`}>
                                            {data.status}
                                        </span>
                                    </div>
                                    <div className="approach-details">
                                        <div className="detail-item">
                                            <span className="detail-label">Occupancy</span>
                                            <div className="occupancy-bar">
                                                <div
                                                    className="occupancy-fill"
                                                    style={{
                                                        width: `${Math.min(data.occupancy_pct, 100)}%`,
                                                        backgroundColor: data.status === 'CRITICAL' ? '#dc2626' :
                                                            data.status === 'WARNING' ? '#f59e0b' : '#10b981'
                                                    }}
                                                ></div>
                                                <span className="occupancy-text">{data.occupancy_pct.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SpillbackAlert;
