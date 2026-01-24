import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';
import './CityMap.css';
import { GREEN_CORRIDORS } from '../../config/greenCorridors';

// Component to handle map animation
const MapEffect = ({ selectedId, junctions }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;

    const target = junctions.find(j => j.id === selectedId);
    if (target && target.lat && target.lng) {
      map.flyTo([target.lat, target.lng], 15, {
        animate: true,
        duration: 1.5 // Smooth flight
      });
    }
  }, [selectedId, junctions, map]);

  return null;
};

const CityMap = ({
  junctions = [],
  loading = false,
  onJunctionSelect,
  selectedId,
  activeGreenCorridorState = { active: false, corridorId: null, currentJunctionIndex: -1 }
}) => {
  const position = [22.3072, 73.1812]; // Vadodara Center

  if (loading) {
    return <div className="dashboard-card map-card-daylight" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map Data...</div>;
  }

  // --- Green Corridor Logic ---
  const activeCorridor = activeGreenCorridorState.active
    ? GREEN_CORRIDORS.find(c => c.id === activeGreenCorridorState.corridorId)
    : null;

  // Extract corridor path coordinates
  const corridorPath = activeCorridor
    ? activeCorridor.junctions
      .map(id => junctions.find(j => j.id === id))
      .filter(j => j && j.lat && j.lng)
      .map(j => [j.lat, j.lng])
    : [];

  const getColor = (status, isCorridorActive, isCurrentPriority) => {
    if (isCurrentPriority) return '#10B981'; // Bright Green for current target
    if (isCorridorActive) return '#34D399'; // Lighter Green for corridor path

    switch (status) {
      case 'critical': return '#DC2626'; // Red
      case 'warning': return '#F59E0B'; // Amber
      case 'optimal': return '#16A34A'; // Deep Green
      default: return '#16A34A'; // Default to Green
    }
  };

  return (
    <div className="dashboard-card map-card-daylight" style={{ position: 'relative' }}>
      {/* Map Header */}
      <div className="map-card-header">
        <h3 className="map-title-day">Vadodara Pilot Zone Map</h3>
        <p className="map-subtitle-day">Click on a junction to view live camera feed</p>
      </div>

      {/* Corridor Overlay UI */}
      {activeCorridor && (
        <div className="green-corridor-overlay">
          <div className="green-corridor-title">
            <span className="pulse-dot"></span>
            GREEN CORRIDOR ACTIVE
          </div>
          <div className="green-corridor-subtitle">
            {activeCorridor.name}
          </div>
        </div>
      )}

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

          <MapEffect selectedId={selectedId} junctions={junctions} />

          {/* Render Green Corridor Path Polyline */}
          {activeCorridor && corridorPath.length > 0 && (
            <Polyline
              positions={corridorPath}
              pathOptions={{
                color: '#10B981',
                weight: 6,
                opacity: 0.6,
                dashArray: '10, 10',
                lineCap: 'round'
              }}
            />
          )}

          {junctions && junctions.length > 0 ? (
            junctions
              .filter(j => j.lat != null && j.lng != null && Number.isFinite(j.lat) && Number.isFinite(j.lng))
              .map(j => {
                const isSelected = selectedId === j.id;

                // Check Corridor Status
                const isCorridorJunction = activeCorridor?.junctions.includes(j.id);
                const isCurrentPriority = activeCorridor &&
                  activeCorridor.junctions[activeGreenCorridorState.currentJunctionIndex] === j.id;

                // Determine Styles
                const markerRadius = isCurrentPriority ? 16 : (isSelected ? 14 : (isCorridorJunction ? 12 : 10));
                const markerColor = getColor(j.status, isCorridorJunction, isCurrentPriority);
                const strokeColor = isCurrentPriority ? '#064E3B' : (isSelected ? '#2563EB' : (j.status === 'critical' ? '#DC2626' : '#fff'));
                const className = isCurrentPriority ? 'corridor-marker-priority' : (isCorridorJunction ? 'corridor-marker-path' : '');

                return (
                  <CircleMarker
                    key={j.id}
                    center={[j.lat, j.lng]}
                    radius={markerRadius}
                    pathOptions={{
                      color: strokeColor,
                      fillColor: markerColor,
                      fillOpacity: isCurrentPriority ? 1 : 0.8,
                      weight: isCurrentPriority ? 4 : (isSelected ? 4 : 2),
                      className: className
                    }}
                    eventHandlers={{
                      click: () => onJunctionSelect && onJunctionSelect(j)
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={1} className="day-map-tooltip">
                      <div className="tooltip-content-day">
                        {isCurrentPriority && (
                          <div className="priority-tooltip-header">PRIORITY TARGET</div>
                        )}
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
                          <span style={{ color: markerColor, fontWeight: 600, textTransform: 'uppercase', fontSize: '11px' }}>
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
            <div className="legend-row-day"><span className="dot" style={{ background: '#16A34A' }}></span> Operational</div>
            <div className="legend-row-day"><span className="dot" style={{ background: '#F59E0B' }}></span> Warning</div>
            <div className="legend-row-day"><span className="dot" style={{ background: '#DC2626' }}></span> Critical</div>
            {activeCorridor && (
              <div className="legend-row-day" style={{ marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '4px' }}>
                <span className="dot" style={{ background: '#10B981' }}></span> Green Corridor
              </div>
            )}
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
