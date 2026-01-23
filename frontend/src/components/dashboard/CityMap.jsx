import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';

const CityMap = ({ junctions = [], loading = false }) => {
  const position = [22.3072, 73.1812]; // Vadodara Center

  if (loading) {
     return <div className="dashboard-card map-card-daylight" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>Loading Map Data...</div>;
  }

  const getColor = (status) => {
    switch (status) {
      case 'critical': return '#DC2626'; // Red
      case 'warning': return '#F59E0B'; // Amber
      case 'optimal': return '#16A34A'; // Deep Green
      default: return '#6B7280'; // Gray
    }
  };

  return (
    <div className="dashboard-card map-card-daylight">
      {/* Map Header */}
      <div className="map-card-header">
        <h3 className="map-title-day">City Traffic Map</h3>
        <p className="map-subtitle-day">Real-time usage • Daylight view</p>
      </div>

      <div className="map-wrapper-day">
        <MapContainer 
          center={position} 
          zoom={13} 
          scrollWheelZoom={false}
          style={{ height: '520px', width: '100%', background: '#E5E7EB' }}
        >
          {/* OSM HOT Tiles (Natural Colors) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, HOT'
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />
          
          {junctions && junctions.length > 0 ? (
            junctions
              .filter(j => j.lat != null && j.lng != null && Number.isFinite(j.lat) && Number.isFinite(j.lng))
              .map(j => (
              <CircleMarker 
                key={j.id} 
                center={[j.lat, j.lng]}
                radius={9}
                pathOptions={{ 
                  color: '#fff', 
                  fillColor: getColor(j.status), 
                  fillOpacity: 1, 
                  weight: 2,
                  className: 'marker-standard' 
                }}
                eventHandlers={{
                  click: () => console.log(`Junction clicked: ${j.id}`)
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1} className="day-map-tooltip">
                  <div className="tooltip-content-day">
                    <div className="tooltip-header-day">
                      <strong>{j.name}</strong>
                      <span className={`status-dot status-${j.status}`}></span>
                    </div>
                    <div className="tooltip-row-day">
                      <span>Status:</span>
                      <span style={{ color: getColor(j.status), fontWeight: 600, textTransform: 'uppercase', fontSize: '11px' }}>{j.status}</span>
                    </div>
                    <div className="tooltip-row-day">
                      <span>Flow Ratio:</span>
                      <span>{j.flow_ratio}</span>
                    </div>
                    <div className="tooltip-row-day">
                      <span>Queue:</span>
                      <span>{j.queue_pct}%</span>
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))
          ) : null}
          
          {/* Floating Daylight Legend (Bottom-Left) */}
          <div className="map-legend-day">
            <div className="legend-row-day"><span className="dot dot-green"></span> Optimal</div>
            <div className="legend-row-day"><span className="dot dot-amber"></span> Warning</div>
            <div className="legend-row-day"><span className="dot dot-red"></span> Critical</div>
            <div className="legend-row-day"><span className="dot dot-gray"></span> Offline</div>
          </div>

        </MapContainer>
        
        {/* Offline Overlay */}
        {junctions.length === 0 && (
          <div className="map-overlay-message">
            Awaiting live junction data
          </div>
        )}
      </div>
    </div>
  );
};

export default CityMap;
