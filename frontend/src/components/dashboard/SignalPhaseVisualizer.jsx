import React, { useEffect, useState } from 'react';
import './SignalPhaseVisualizer.css';

const SignalPhaseVisualizer = ({ junctionName, active, loading, compact = false, override, status }) => {
    const [timeLeft, setTimeLeft] = useState(45);
    const [phase, setPhase] = useState('GREEN'); // GREEN, YELLOW, RED
    const [aiConfidence, setAiConfidence] = useState(98);

    // Effect: Adjust Confidence based on Status
    useEffect(() => {
        if (override?.active) {
            setAiConfidence(100);
        } else if (status === 'critical') {
            setAiConfidence(45); // Low confidence
        } else if (status === 'warning') {
            setAiConfidence(72); // Moderate confidence
        } else {
            setAiConfidence(98); // High confidence
        }
    }, [status, override]);

    // Mock animation loop
    useEffect(() => {
        if (override?.active) {
            if (override.action && override.action.includes('RED')) setPhase('RED');
            else if (override.action && override.action.includes('GREEN')) setPhase('GREEN');
            else if (override.action && override.action.includes('YELLOW')) setPhase('YELLOW');
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Switch phase
                    setPhase((p) => {
                        if (p === 'GREEN') return 'YELLOW';
                        if (p === 'YELLOW') return 'RED';
                        return 'GREEN';
                    });
                    return phase === 'YELLOW' ? 60 : (phase === 'RED' ? 45 : 5);
                }
                return prev - 1;
            });

            // Fluctuate confidence slightly
            if (Math.random() > 0.7) {
                setAiConfidence(95 + Math.floor(Math.random() * 5));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [phase]);

    if (loading) return <div className="signal-viz-loading">Connecting to Signal Controller...</div>;

    return (
        <div className="dashboard-card signal-card">
            <div className="signal-header">
                <h3 className="panel-title">AI Signal Control</h3>
                <span className="live-tag">
                    <span className="pulse-dot-small"></span> LIVE
                </span>
            </div>

            <div className="signal-content">
                <div className="signal-info">
                    <div className="info-label">Current Junction</div>
                    <div className="info-value">{junctionName || 'Select a Junction'}</div>

                    <div className="info-label mt-2">Optimization Confidence</div>
                    <div className="confidence-meter">
                        <div className="confidence-bar" style={{ width: `${aiConfidence}%` }}></div>
                    </div>
                    <div className="confidence-text">
                        {aiConfidence}% {aiConfidence < 60 ? 'Degraded' : (aiConfidence < 85 ? 'Sub-optimal' : 'Optimal')}
                    </div>
                </div>

                <div className="traffic-light-container">
                    <div className={`light red ${phase === 'RED' ? 'active' : ''}`}></div>
                    <div className={`light yellow ${phase === 'YELLOW' ? 'active' : ''}`}></div>
                    <div className={`light green ${phase === 'GREEN' ? 'active' : ''}`}></div>
                </div>

                <div className="timer-display">
                    <div className="timer-value">{timeLeft}s</div>
                    <div className="timer-label">To Next Phase</div>
                </div>
            </div>

            <div className="signal-footer">
                <div className="metric-pill">
                    <span className="icon">⚡</span>
                    <span>Latency: 42ms</span>
                </div>
                <div className="metric-pill">
                    <span className="icon">🤖</span>
                    <span>AI Mode: Active</span>
                </div>
            </div>
        </div>
    );
};

export default SignalPhaseVisualizer;
