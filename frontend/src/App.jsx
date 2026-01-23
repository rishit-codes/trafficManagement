import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import trafficAPI from './utils/api'
import TrafficMap from './components/TrafficMap'
import LiveSignalPanel from './components/LiveSignalPanel'
import OptimizationPanel from './components/OptimizationPanel'
import SpillbackAlert from './components/SpillbackAlert'
import MetricsDashboard from './components/MetricsDashboard'
import { Activity, Zap, AlertTriangle, TrendingUp } from 'lucide-react'
import './App.css'

function App() {
  const [junctions, setJunctions] = useState([])
  const [selectedJunction, setSelectedJunction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [liveMode, setLiveMode] = useState(true)

  useEffect(() => {
    loadJunctions()
    // Simulate live updates every 5 seconds
    const interval = setInterval(() => {
      if (liveMode) {
        // Trigger re-render for animations
        setJunctions(prev => [...prev])
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [liveMode])

  const loadJunctions = async () => {
    try {
      setLoading(true)
      const response = await trafficAPI.getJunctions()
      setJunctions(response.data.junctions || [])
      if (response.data.junctions && response.data.junctions.length > 0) {
        setSelectedJunction(response.data.junctions[0])
      }
      setError(null)
    } catch (err) {
      setError('Failed to load junctions. Make sure the API is running at http://localhost:8000')
      console.error('Error loading junctions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJunctionChange = (junction) => {
    setSelectedJunction(junction)
  }

  return (
    <div className="app">
      {/* Animated Background */}
      <div className="bg-gradient"></div>
      <div className="bg-overlay"></div>

      <header className="app-header glass">
        <motion.div
          className="header-content"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="logo">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Activity size={36} className="logo-icon" />
            </motion.div>
            <div>
              <h1>Traffic Management System</h1>
              <p className="subtitle">Vadodara Smart City • Real-Time Intelligence</p>
            </div>
          </div>

          <div className="header-stats">
            <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
              <Zap size={20} />
              <div>
                <div className="stat-value">-35%</div>
                <div className="stat-label">Delay Reduction</div>
              </div>
            </motion.div>
            <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
              <TrendingUp size={20} />
              <div>
                <div className="stat-value">+15%</div>
                <div className="stat-label">Throughput</div>
              </div>
            </motion.div>
            <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
              <AlertTriangle size={20} />
              <div>
                <div className="stat-value">-83%</div>
                <div className="stat-label">Spillback Events</div>
              </div>
            </motion.div>
          </div>

          <div className="live-indicator">
            <motion.div
              className="pulse-dot"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span>LIVE</span>
          </div>
        </motion.div>
      </header>

      <main className="app-main">
        {loading && (
          <div className="loading">
            <motion.div
              className="spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p>Loading traffic network...</p>
          </div>
        )}

        {error && (
          <motion.div
            className="error-banner glass"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p>{error}</p>
            <button onClick={loadJunctions}>Retry Connection</button>
          </motion.div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            <motion.div
              className="dashboard-layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Left Side: Interactive Map */}
              <div className="map-section">
                <TrafficMap
                  junctions={junctions}
                  selectedJunction={selectedJunction}
                  onJunctionSelect={handleJunctionChange}
                />
              </div>

              {/* Right Side: Control Panels */}
              <div className="control-panels">
                {selectedJunction && (
                  <>
                    <LiveSignalPanel junction={selectedJunction} />
                    <OptimizationPanel junction={selectedJunction} />
                    <SpillbackAlert junction={selectedJunction} />
                  </>
                )}
              </div>

              {/* Bottom: Metrics Dashboard */}
              <div className="metrics-section">
                <MetricsDashboard junctions={junctions} selectedJunction={selectedJunction} />
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <footer className="app-footer glass">
        <p>&#169; 2026 Vadodara Smart City Initiative | Zero Hardware • Software-Only Solution • ₹27.5L Cost Savings</p>
      </footer>
    </div>
  )
}

export default App
