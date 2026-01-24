import React, { useEffect, useMemo, memo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, Polyline, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';
import './CityMap.css';
import { GREEN_CORRIDORS } from '../../config/greenCorridors';
import GreenCorridorPanel from '../control/GreenCorridorPanel';

// --- Sub-components for Stability ---

// 0. Force Map Resize on Mount/Updates (Fixes 0-height grey tiles)
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const resize = () => {
      map.invalidateSize();
    };
    // Immediate check
    resize();

    // Delay for flex layout stabilization
    const timer = setTimeout(resize, 400);

    // Listen to window resize
    window.addEventListener('resize', resize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', resize);
    };
  }, [map]);
  return null;
};

// 1. Controller for View Updates (Pan/Zoom)
// Separated to prevent re-rendering the whole map when just flying to a point
const MapController = ({ selectedId, junctions }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;

    const target = junctions.find(j => j.id === selectedId);
    if (target && Number.isFinite(target.lat) && Number.isFinite(target.lng)) {
      // Use standard flyTo options for stability
      // Respect current user zoom level
      map.flyTo([target.lat, target.lng], map.getZoom(), {
        animate: true,
        duration: 1.2
      });
    }
  }, [selectedId, junctions, map]);

  return null;
};

// 2. Memoized Marker to prevent expensive re-renders logic
const JunctionMarker = memo(({ junction, isSelected, isCorridorJunction, isCurrentPriority, onSelect, circleStyle }) => {
  const { key, ...pathOptions } = circleStyle; // Extract key if present (though passed via props usually)

  // Style logic moved to parent or memoized helper
  return (
    <CircleMarker
      center={[junction.lat, junction.lng]}
      {...pathOptions}
      eventHandlers={{
        click: () => onSelect && onSelect(junction)
      }}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1} className="day-map-tooltip">
        <div className="tooltip-content-day">
          {isCurrentPriority && (
            <div className="priority-tooltip-header">PRIORITY TARGET</div>
          )}
          <div className="tooltip-header-day">
            <strong>{junction.name}</strong>
            {isSelected && <span className="selection-badge">VIEWING</span>}
          </div>

          <div className="tooltip-row-day">
            <span>ID:</span>
            <span>{junction.id}</span>
          </div>
          <div className="tooltip-row-day">
            <span>Status:</span>
            <span style={{ color: pathOptions.fillColor, fontWeight: 600, textTransform: 'uppercase', fontSize: '11px' }}>
              {junction.status || 'Active'}
            </span>
          </div>
          <div className="tooltip-education">Click to view camera</div>
        </div>
      </Tooltip>
    </CircleMarker>
  );
});

const CityMap = ({
  junctions = [],
  loading = false,
  onJunctionSelect,
  selectedId,
  activeGreenCorridorState = { active: false, corridorId: null, currentJunctionIndex: -1 },
  onGreenCorridorUpdate
}) => {
  const position = [22.3072, 73.1812]; // Vadodara Center

  // --- Green Corridor Logic ---
  const activeCorridor = useMemo(() =>
    activeGreenCorridorState.active
      ? GREEN_CORRIDORS.find(c => c.id === activeGreenCorridorState.corridorId)
      : null,
    [activeGreenCorridorState.active, activeGreenCorridorState.corridorId]
  );

  const corridorPath = useMemo(() =>
    activeCorridor
      ? activeCorridor.junctions
        .map(id => junctions.find(j => j.id === id))
        .filter(j => j && Number.isFinite(j.lat) && Number.isFinite(j.lng))
        .map(j => [j.lat, j.lng])
      : [],
    [activeCorridor, junctions]
  );

  // --- Style Helper ---
  const getMarkerStyle = (junction, isSelected, isCorridorJunction, isCurrentPriority) => {
    let color = '#16A34A'; // Default Green (Optimal)

    if (isCurrentPriority) color = '#10B981';
    else if (isCorridorJunction) color = '#34D399';
    else {
      switch (junction.status) {
        case 'critical': color = '#DC2626'; break;
        case 'warning': color = '#F59E0B'; break;
        case 'optimal': color = '#16A34A'; break;
        default: color = '#16A34A';
      }
    }

    const radius = isCurrentPriority ? 16 : (isSelected ? 14 : (isCorridorJunction ? 12 : 10));
    const strokeColor = isCurrentPriority ? '#064E3B' : (isSelected ? '#2563EB' : (junction.status === 'critical' ? '#DC2626' : '#fff'));
    const className = isCurrentPriority ? 'corridor-marker-priority' : (isCorridorJunction ? 'corridor-marker-path' : '');

    return {
      radius,
      fillColor: color,
      color: strokeColor,
      weight: isCurrentPriority || isSelected ? 4 : 2,
      fillOpacity: isCurrentPriority ? 1 : 0.8,
      className
    };
  };

  if (loading) {
    return (
      <div className="dashboard-card map-card-daylight" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader-spinner"></div>
        <span style={{ marginLeft: '10px', color: '#6B7280' }}>Loading Map Data...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-card map-card-daylight" style={{ position: 'relative', overflow: 'visible' }}>
      {/* Map Header */}
      <div className="map-card-header">
        <h3 className="map-title-day">Vadodara Pilot Zone Map</h3>
        <p className="map-subtitle-day">Interactive Control View</p>
      </div>

      {/* Corridor Overlay UI */}
      {activeCorridor && (
        <div className="green-corridor-overlay">
          <div className="green-corridor-title">
            <span className="pulse-dot"></span>
            ACTIVE: {activeCorridor.name}
          </div>
        </div>
      )}

      <div className="map-wrapper-day">
        {/* Overlay Panel Removed - Moved to Dashboard Sidebar */}

        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true} // Enabled for better UX
          zoomControl={false} // We will place it manually
          dragging={true}
          doubleClickZoom={true}
          attributionControl={false} // Cleaner look, usually we add custom or bottom-right
          style={{ width: '100%', height: '100%' }}
        >
          {/* Controls */}
          <ZoomControl position="bottomright" />

          {/* Tiles */}
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />

          {/* Logic Components */}
          <MapResizer />
          <MapController selectedId={selectedId} junctions={junctions} />

          {/* Paths */}
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

          {/* Markers */}
          {junctions.map(j => {
            if (!Number.isFinite(j.lat) || !Number.isFinite(j.lng)) return null;

            const isSelected = selectedId === j.id;
            const isCorridorJunction = activeCorridor?.junctions.includes(j.id);
            const isCurrentPriority = activeCorridor &&
              activeCorridor.junctions[activeGreenCorridorState.currentJunctionIndex] === j.id;

            const style = getMarkerStyle(j, isSelected, isCorridorJunction, isCurrentPriority);

            return (
              <JunctionMarker
                key={j.id}
                junction={j}
                isSelected={isSelected}
                isCorridorJunction={isCorridorJunction}
                isCurrentPriority={isCurrentPriority}
                onSelect={onJunctionSelect}
                circleStyle={style}
              />
            );
          })}

        </MapContainer>

        {junctions.length === 0 && (
          <div className="map-overlay-message">
            System Offline - No Junctions Connected
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CityMap);
