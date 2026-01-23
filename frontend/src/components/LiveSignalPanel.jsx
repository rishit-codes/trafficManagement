import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Radio, Clock, ArrowRight } from 'lucide-react'
import './LiveSignalPanel.css'

function LiveSignalPanel({ junction }) {
    const [currentPhase, setCurrentPhase] = useState('NS')
    const [phaseTime, setPhaseTime] = useState(45)
    const [signalState, setSignalState] = useState({
        north: 'green',
        south: 'green',
        east: 'red',
        west: 'red'
    })

    // Simulate live signal changes
    useEffect(() => {
        const interval = setInterval(() => {
            setPhaseTime(prev => {
                if (prev <= 1) {
                    // Switch phase
                    setCurrentPhase(curr => curr === 'NS' ? 'EW' : 'NS')
                    setSignalState(prev => ({
                        north: prev.north === 'green' ? 'red' : 'green',
                        south: prev.south === 'green' ? 'red' : 'green',
                        east: prev.east === 'green' ? 'red' : 'green',
                        west: prev.west === 'green' ? 'red' : 'green'
                    }))
                    return 45
                }
                if (prev === 4) {
                    // Yellow phase
                    setSignalState(prev => ({
                        ...prev,
                        north: prev.north === 'green' ? 'yellow' : prev.north,
                        south: prev.south === 'green' ? 'yellow' : prev.south,
                        east: prev.east === 'green' ? 'yellow' : prev.east,
                        west: prev.west === 'green' ? 'yellow' : prev.west
                    }))
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const getSignalColor = (state) => {
        switch (state) {
            case 'green': return '#10b981'
            case 'yellow': return '#fbbf24'
            case 'red': return '#dc2626'
            default: return '#64748b'
        }
    }

    return (
        <div className="live-signal-panel glass">
            <div className="panel-header">
                <Radio size={20} className="pulse" />
                <h2>Live Signal Status</h2>
                <div className="live-badge">
                    <motion.div
                        className="live-dot"
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span>LIVE</span>
                </div>
            </div>

            <div className="signal-content">
                <div className="current-phase">
                    <Clock size={18} />
                    <div>
                        <div className="phase-name">Phase: {currentPhase}</div>
                        <div className="phase-time">{phaseTime}s remaining</div>
                    </div>
                    <motion.div
                        className="progress-ring"
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: (phaseTime / 45) * 283 }}
                    >
                        <svg width="60" height="60">
                            <circle
                                cx="30"
                                cy="30"
                                r="25"
                                fill="none"
                                stroke="rgba(59, 130, 246, 0.2)"
                                strokeWidth="4"
                            />
                            <circle
                                cx="30"
                                cy="30"
                                r="25"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="4"
                                strokeDasharray="283"
                                strokeDashoffset={(phaseTime / 45) * 283}
                                transform="rotate(-90 30 30)"
                                style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                            <text x="30" y="35" textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="600">
                                {phaseTime}
                            </text>
                        </svg>
                    </motion.div>
                </div>

                <div className="traffic-lights">
                    {['north', 'south', 'east', 'west'].map(direction => (
                        <div key={direction} className="traffic-light-group">
                            <div className="direction-label">{direction.charAt(0).toUpperCase() + direction.slice(1)}</div>
                            <div className="traffic-light">
                                {['red', 'yellow', 'green'].map(color => (
                                    <motion.div
                                        key={color}
                                        className={`light ${color} ${signalState[direction] === color ? 'active' : ''}`}
                                        animate={{
                                            boxShadow: signalState[direction] === color
                                                ? [`0 0 10px ${getSignalColor(color)}`, `0 0 20px ${getSignalColor(color)}`, `0 0 10px ${getSignalColor(color)}`]
                                                : '0 0 0px rgba(0,0,0,0)',
                                            scale: signalState[direction] === color ? [1, 1.1, 1] : 1
                                        }}
                                        transition={{ duration: 1, repeat: signalState[direction] === color ? Infinity : 0 }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="phase-timeline">
                    <div className="timeline-header">
                        <span>Phase Sequence</span>
                        <ArrowRight size={16} />
                    </div>
                    <div className="timeline">
                        <div className={`timeline-item ${currentPhase === 'NS' ? 'active' : ''}`}>
                            <div className="timeline-dot"></div>
                            <span>NS (45s)</span>
                        </div>
                        <div className="timeline-arrow">→</div>
                        <div className={`timeline-item ${currentPhase === 'EW' ? 'active' : ''}`}>
                            <div className="timeline-dot"></div>
                            <span>EW (45s)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LiveSignalPanel
