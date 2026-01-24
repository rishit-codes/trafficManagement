import React, { useEffect, useState } from 'react';
import './SignalPhaseVisualizer.css';

const SignalPhaseVisualizer = ({ junctionName, active, loading, compact = false, override, status, externalCounts }) => {
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
        // Original timer removed in favor of adaptive one below
    }, [override]);


    // --- ADAPTIVE ALGORITHM SIMULATION (PCU BASED) ---
    // Counts: Cars, Buses, Bikes, Trucks
    const [vehicleCounts, setVehicleCounts] = useState({ cars: 12, buses: 0, bikes: 5, trucks: 1 });
    const [dynamicLog, setDynamicLog] = useState("Initializing Vision Control...");

    useEffect(() => {
        if (externalCounts) {
            // SYNC MODE: Use authoritative external data
            setVehicleCounts(externalCounts);
            return;
        }

        // DEMO MODE: Update virtual vehicle counts randomly
        const vehicleTimer = setInterval(() => {
            setVehicleCounts({
                cars: Math.floor(Math.random() * 25) + 5,
                buses: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
                bikes: Math.floor(Math.random() * 15) + 5,
                trucks: Math.random() > 0.8 ? 1 : 0
            });
        }, 4000);
        return () => clearInterval(vehicleTimer);
    }, [externalCounts]);

    // Helper: Calculate Green Time based on PCU Formula
    const calculateTimeFromPCU = (counts) => {
        // 1. Calculate PCU (Passenger Car Unit)
        // Weights: Bike=0.5, Car=1.0, Bus=3.0, Truck=3.0
        const pcu = (counts.bikes * 0.5) + (counts.cars * 1.0) + (counts.buses * 3.0) + (counts.trucks * 3.0);
        
        // 2. Mock Total PCU for the intersection (Active + Waiting phases)
        // Assume total intersection load fluctuates around a baseline
        const totalIntersectionPCU = pcu + 40 + (Math.random() * 20); 

        // 3. Formula: G_i = clamp( (PCU_i / Total_PCU) * 120, 15, 60 )
        const rawTime = (pcu / totalIntersectionPCU) * 120;
        const clampedTime = Math.max(15, Math.min(60, rawTime));

        return { time: Math.round(clampedTime), pcu: pcu.toFixed(1) };
    };

    // Main Signal Loop
    // Main Signal Loop
    useEffect(() => {
        if (override?.active) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Time's up! Calculate Next Phase & Duration
                    let nextPhase = '';
                    let nextDuration = 0;

                    if (phase === 'GREEN') {
                        nextPhase = 'YELLOW';
                        nextDuration = 3;
                    } else if (phase === 'YELLOW') {
                        nextPhase = 'RED';
                        nextDuration = 10;
                    } else { // RED -> GREEN (Dynamic)
                        nextPhase = 'GREEN';
                        const { time, pcu } = calculateTimeFromPCU(vehicleCounts);
                        nextDuration = time;

                        // Log Logic
                        if (time > 40) {
                            setDynamicLog(`High Traffic (PCU: ${pcu}) → Extending Green to ${time}s`);
                        } else if (time < 20) {
                            setDynamicLog(`Low Demand (PCU: ${pcu}) → Shortening Cycle (${time}s)`);
                        } else {
                            setDynamicLog(`Standard Flow (PCU: ${pcu}) → Optimization Active`);
                        }
                    }

                    setPhase(nextPhase);
                    return nextDuration;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, vehicleCounts, override]);

    if (loading) return <div className="signal-viz-loading">Connecting to Signal Controller...</div>;

    return (
        <div className="dashboard-card signal-card">
            <div className="signal-header">
                <h3 className="panel-title">Simulated Real-Time Vision-Based Signal Control</h3>
                <span className="live-tag">
                    <span className="pulse-dot-small"></span> SYSTEM ACTIVE
                </span>
            </div>

            <div className="signal-content">
                <div className="signal-info">
                    <div className="info-label">Active Signal Plan</div>
                    <div className="info-value">{junctionName || 'Select a Junction'}</div>

                    {/* New Vision Analytics Section */}
                    <div className="vision-analytics-box" style={{ marginTop: '12px', padding: '10px', background: '#F0FDF4', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                        <div className="vision-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803D', textTransform: 'uppercase' }}>
                                📷 Computer Vision Metrics
                            </span>
                            <span className="pulse-dot-small" style={{ background: '#16A34A' }}></span>
                        </div>
                        
                        <div className="vision-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center' }}>
                            <div className="v-metric">
                                <span style={{ fontSize: '9px', color: '#6B7280' }}>Cars</span>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>{vehicleCounts.cars}</div>
                            </div>
                            <div className="v-metric">
                                <span style={{ fontSize: '9px', color: '#6B7280' }}>Bikes</span>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>{vehicleCounts.bikes}</div>
                            </div>
                            <div className="v-metric">
                                <span style={{ fontSize: '9px', color: '#6B7280' }}>Buses</span>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#D97706' }}>{vehicleCounts.buses}</div>
                            </div>
                            <div className="v-metric">
                                <span style={{ fontSize: '9px', color: '#6B7280' }}>Heavy</span>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#DC2626' }}>{vehicleCounts.trucks}</div>
                            </div>
                        </div>

                        <div className="dynamic-action" style={{ marginTop: '8px', borderTop: '1px dashed #BBF7D0', paddingTop: '6px' }}>
                            <span style={{ fontSize: '10px', color: '#166534', fontStyle: 'italic', display:'block', lineHeight:'1.4' }}>
                                ⚡ {dynamicLog}
                            </span>
                        </div>
                    </div>

                    <div className="info-label mt-2">Logic Confidence</div>
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
                    <span>Latency: 0ms</span>
                </div>
                <div className="metric-pill">
                    <span className="icon">⚙️</span>
                    <span>Mode: Simulation</span>
                </div>
            </div>
        </div>
    );
};

export default SignalPhaseVisualizer;
