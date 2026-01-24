import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const ConductorPanel = ({ junctionId }) => {
    const [status, setStatus] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);

    // Poll for status and prediction
    useEffect(() => {
        let interval;

        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Get Overall Conductor Status
                const statusRes = await fetch('http://localhost:8000/api/conductor/status');
                const statusData = await statusRes.json();

                // 2. Get Specific Prediction
                const predictRes = await fetch(`http://localhost:8000/api/conductor/predict?junction_id=${junctionId}&horizon_minutes=30`, {
                    method: 'POST'
                });
                const predictData = await predictRes.json();

                setStatus(statusData);
                setPrediction(predictData);
                setLoading(false);
            } catch (err) {
                console.error("Conductor fetch failed", err);
            }
        };

        fetchData();
        interval = setInterval(fetchData, 30000); // 30s update

        return () => clearInterval(interval);
    }, [junctionId]);

    if (!status) return null;

    const eventType = status.active_events?.[junctionId] || "NORMAL";
    const isEventActive = eventType !== "NORMAL";

    // Format trend for active decision
    const recommendation = prediction?.recommendation?.replace(/_/g, " ").toUpperCase() || "MONITORING";

    return (
        <div className={`dashboard-card conductor-card ${isEventActive ? 'conductor-active' : ''}`}>
            <div className="conductor-header">
                <h3 className="panel-title">
                    {isEventActive ? '⚠️ AI CONDUCTOR: EVENT MODE' : '🧠 AI Conductor'}
                </h3>
                <span className="live-tag">
                    {isEventActive ? 'INTERVENTION' : 'IDLE'}
                </span>
            </div>

            <div className="conductor-content">
                {/* Event Section */}
                {isEventActive ? (
                    <div className="event-banner">
                        <div className="event-icon">🏟️</div>
                        <div className="event-details">
                            <h4>{eventType} DETECTED</h4>
                            <p>Adjusting signal timing for surge.</p>
                        </div>
                    </div>
                ) : (
                    <div className="status-row">
                        <span className="status-label">System Mode:</span>
                        <span className="status-value">PROACTIVE MONITORING</span>
                    </div>
                )}

                <div className="divider" />

                {/* Prediction Section */}
                <div className="prediction-section">
                    <h4>Traffic Forecast (Next 30m)</h4>
                    <div className="forecast-stats">
                        <div className="stat-box">
                            <span className="stat-label">Predicted Load</span>
                            <span className="stat-value">
                                {prediction?.predicted_volumes?.[0] || '--'} <small>PCU</small>
                            </span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">AI Recommendation</span>
                            <span className={`stat-value decision ${recommendation.includes('INCREASE') ? 'alert' : 'neutral'}`}>
                                {recommendation}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConductorPanel;
