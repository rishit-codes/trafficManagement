import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';

const CityMap = ({ junctions = [], loading = false, onJunctionSelect, selectedId }) => {
  const position = [22.3072, 73.1812]; // Vadodara Center

  if (loading) {
     return <div className="dashboard-card map-card-daylight" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>Loading Map Data...</div>;
  }

  const getColor = (status) => {
    switch (status) {
      case 'critical': return '#DC2626'; // Red
      case 'warning': return '#F59E0B'; // Amber
      case 'optimal': return '#16A34A'; // Deep Green
      default: return '#16A34A'; // Default to Green for pilot if status missing
    }
  };

  return (
    <div className="dashboard-card map-card-daylight">
      {/* Map Header */}
      <div className="map-card-header">
        <h3 className="map-title-day">Vadodara Pilot Zone Map</h3>
        <p className="map-subtitle-day">Click on a junction to view live camera feed</p>
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
              .map(j => {
                const isSelected = selectedId === j.id;
                return (
                  <CircleMarker 
                    key={j.id} 
                    center={[j.lat, j.lng]}
                    radius={isSelected ? 14 : 10}
                    pathOptions={{ 
                      color: isSelected ? '#2563EB' : '#fff', // Blue border if selected 
                      fillColor: getColor(j.status), 
                      fillOpacity: 1, 
                      weight: isSelected ? 4 : 2,
                      className: isSelected ? 'marker-selected' : 'marker-standard' 
                    }}
                    eventHandlers={{
                      click: () => onJunctionSelect && onJunctionSelect(j)
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={1} className="day-map-tooltip">
                      <div className="tooltip-content-day">
                        <div className="tooltip-header-day">
                          <strong>{j.name}</strong>
                          {isSelected && <span className="selection-badge">VIEWING</span>}
                        </div>
                    
                        <div className="tooltip-row-day">
                             <span>ID:</span>
                             <span>{j.id}</span>
                        </div>
                        <div className="tooltip-row-day">
                          <span>Status:</span>
                          <span style={{ color: getColor(j.status), fontWeight: 600, textTransform: 'uppercase', fontSize: '11px' }}>
                              {j.status || 'Active'}
                          </span>
                        </div>
                        <div className="tooltip-education">Click to view camera</div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })
          ) : null}
          
          {/* Legend */}
          <div className="map-legend-day">
            <div className="legend-row-day"><span className="dot dot-green"></span> Operational</div>
            <div className="legend-row-day"><span className="dot dot-amber"></span> Warning</div>
            <div className="legend-row-day"><span className="dot dot-red"></span> Critical</div>
          </div>

        </MapContainer>
        
        {/* Offline Overlay */}
        {junctions.length === 0 && (
          <div className="map-overlay-message">
            Initializing Pilot Zone Map...
          </div>
        )}
      </div>
    </div>
  );
};

export default CityMap;
