import { useState } from 'react';
import trafficAPI from '../utils/api';
import { Zap, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import './OptimizationPanel.css';

function OptimizationPanel({ junction }) {
    const [flows, setFlows] = useState({
        north: 800,
        south: 750,
        east: 1200,
        west: 1100
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFlowChange = (direction, value) => {
        setFlows(prev => ({
            ...prev,
            [direction]: parseInt(value) || 0
        }));
    };

    const handleOptimize = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await trafficAPI.optimizeJunction(junction.id, flows);
            setResult(response.data);
        } catch (err) {
            setError('Failed to optimize. ' + (err.response?.data?.detail || err.message));
            console.error('Optimization error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPhaseColor = (phaseName) => {
        if (phaseName.includes('NS')) return '#3b82f6';
        if (phaseName.includes('EW')) return '#10b981';
        return '#8b5cf6';
    };

    return (
        <div className="optimization-panel">
            <div className="panel-header">
                <Zap size={24} />
                <h2>Signal Optimization</h2>
            </div>

            <div className="flow-inputs">
                <h3>Traffic Flows (PCU/hr)</h3>
                <div className="flow-grid">
                    {Object.keys(flows).map(direction => (
                        <div key={direction} className="flow-input">
                            <label>{direction.charAt(0).toUpperCase() + direction.slice(1)}</label>
                            <input
                                type="number"
                                value={flows[direction]}
                                onChange={(e) => handleFlowChange(direction, e.target.value)}
                                min="0"
                                max="3000"
                            />
                            <span className="unit">PCU/hr</span>
                        </div>
                    ))}
                </div>
            </div>

            <button
                className="optimize-button"
                onClick={handleOptimize}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <div className="spinner-small"></div>
                        Optimizing...
                    </>
                ) : (
                    <>
                        <TrendingUp size={20} />
                        Calculate Optimal Timing
                    </>
                )}
            </button>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className="optimization-result">
                    <div className="result-header">
                        <Clock size={20} />
                        <h3>Optimized Timing Plan</h3>
                    </div>

                    <div className="cycle-info">
                        <div className="info-card">
                            <span className="label">Cycle Length</span>
                            <span className="value">{result.cycle_length_s}s</span>
                        </div>
                        <div className="info-card">
                            <span className="label">Flow Ratio</span>
                            <span className="value">{(result.sum_flow_ratios * 100).toFixed(1)}%</span>
                        </div>
                        <div className={`info-card ${result.is_oversaturated ? 'warning' : 'success'}`}>
                            <span className="label">Status</span>
                            <span className="value">
                                {result.is_oversaturated ? '⚠️ Oversaturated' : '✅ Optimal'}
                            </span>
                        </div>
                    </div>

                    <div className="phases-container">
                        <h4>Phase Timings</h4>
                        {result.phases && result.phases.map((phase, idx) => (
                            <div key={idx} className="phase-card" style={{ borderLeftColor: getPhaseColor(phase.name) }}>
                                <div className="phase-header">
                                    <span className="phase-name">{phase.name}</span>
                                    <span className="phase-total">{phase.green_s + phase.yellow_s + phase.red_s}s total</span>
                                </div>
                                <div className="phase-timing">
                                    <div className="timing-item green">
                                        <span className="dot"></span>
                                        <span>Green: {phase.green_s}s</span>
                                    </div>
                                    <ArrowRight size={16} className="arrow" />
                                    <div className="timing-item yellow">
                                        <span className="dot"></span>
                                        <span>Yellow: {phase.yellow_s}s</span>
                                    </div>
                                    <ArrowRight size={16} className="arrow" />
                                    <div className="timing-item red">
                                        <span className="dot"></span>
                                        <span>Red: {phase.red_s}s</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default OptimizationPanel;
