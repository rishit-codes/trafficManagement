import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import { motion } from 'framer-motion'
import { MapPin, Navigation, Zap } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './TrafficMap.css'

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons for different junction statuses
const createCustomIcon = (status) => {
    const color = status === 'CRITICAL' ? '#DC2626' :
        status === 'WARNING' ? '#F59E0B' : '#10B981'

    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div class="marker-pin ${status.toLowerCase()}" style="background-color: ${color}">
        <div class="marker-pulse"></div>
      </div>
    `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    })
}

// Component to update map view when junction selected
function ChangeView({ center, zoom }) {
    const map = useMap()
    map.setView(center, zoom)
    return null
}

function TrafficMap({ junctions, selectedJunction, onJunctionSelect }) {
    // Vadodara city center
    const defaultCenter = [22.3072, 73.1812]
    const mapCenter = selectedJunction
        ? [selectedJunction.coordinates.lat, selectedJunction.coordinates.lon]
        : defaultCenter

    // Create heatmap circles based on traffic load
    const getTrafficLoad = (junction) => {
        // Simulate traffic load (in production, this would come from real-time data)
        const hash = junction.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return 50 + (hash % 40) // 50-90% load
    }

    const getHeatmapColor = (load) => {
        if (load > 80) return { color: '#DC2626', opacity: 0.6 }
        if (load > 60) return { color: '#F59E0B', opacity: 0.5 }
        return { color: '#10B981', opacity: 0.4 }
    }

    const getStatus = (junction) => {
        const load = getTrafficLoad(junction)
        if (load > 80) return 'CRITICAL'
        if (load > 60) return 'WARNING'
        return 'OK'
    }

    return (
        <div className="traffic-map-container glass">
            <div className="map-header">
                <Navigation size={20} />
                <h2>Live Traffic Network</h2>
                <div className="map-legend">
                    <div className="legend-item">
                        <div className="legend-dot ok"></div>
                        <span>Normal</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot warning"></div>
                        <span>Congested</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot critical"></div>
                        <span>Critical</span>
                    </div>
                </div>
            </div>

            <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                zoomControl={true}
            >
                <ChangeView center={mapCenter} zoom={selectedJunction ? 15 : 13} />

                {/* OpenStreetMap Tiles */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Dark mode alternative - Uncomment for dark theme
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        */}

                {/* Junction Markers and Heatmaps */}
                {junctions.map((junction) => {
                    const load = getTrafficLoad(junction)
                    const heatmap = getHeatmapColor(load)
                    const status = getStatus(junction)

                    return (
                        <div key={junction.id}>
                            {/* Traffic heatmap circle */}
                            <Circle
                                center={[junction.coordinates.lat, junction.coordinates.lon]}
                                radius={300}
                                pathOptions={{
                                    fillColor: heatmap.color,
                                    fillOpacity: heatmap.opacity,
                                    color: heatmap.color,
                                    weight: 2,
                                    opacity: 0.8
                                }}
                            />

                            {/* Junction marker */}
                            <Marker
                                position={[junction.coordinates.lat, junction.coordinates.lon]}
                                icon={createCustomIcon(status)}
                                eventHandlers={{
                                    click: () => onJunctionSelect(junction)
                                }}
                            >
                                <Popup>
                                    <div className="marker-popup">
                                        <h3>{junction.name}</h3>
                                        <p><strong>Junction ID:</strong> {junction.id}</p>
                                        <p><strong>Status:</strong> <span className={`status-badge ${status.toLowerCase()}`}>{status}</span></p>
                                        <p><strong>Traffic Load:</strong> {load}%</p>
                                        <p><strong>Approaches:</strong> {Object.keys(junction.approaches || {}).length}</p>
                                        <button
                                            className="popup-button"
                                            onClick={() => onJunctionSelect(junction)}
                                        >
                                            <Zap size={16} />
                                            View Details
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        </div>
                    )
                })}
            </MapContainer>

            {selectedJunction && (
                <motion.div
                    className="map-info-panel glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <MapPin size={18} />
                    <div className="info-content">
                        <h4>{selectedJunction.name}</h4>
                        <p>{selectedJunction.id} • {Object.keys(selectedJunction.approaches || {}).length} Approaches</p>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

export default TrafficMap
