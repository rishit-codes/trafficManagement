import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import { Badge, Card } from '../common';
import './dashboard.css';

const junctions = [
  { id: 'J001', name: 'Alkapuri Circle', coords: [22.3103, 73.1723], status: 'optimal', flowRatio: 0.65, pcu: 1240 },
  { id: 'J002', name: 'Fatehgunj', coords: [22.3219, 73.1851], status: 'optimal', flowRatio: 0.58, pcu: 980 },
  { id: 'J003', name: 'Sayajigunj', coords: [22.3149, 73.1927], status: 'warning', flowRatio: 0.78, pcu: 1560 },
  { id: 'J004', name: 'Manjalpur', coords: [22.2711, 73.1892], status: 'critical', flowRatio: 0.92, pcu: 1840 },
  { id: 'J005', name: 'Gotri', coords: [22.3301, 73.1456], status: 'optimal', flowRatio: 0.45, pcu: 720 },
  { id: 'J006', name: 'Karelibaug', coords: [22.3089, 73.2012], status: 'warning', flowRatio: 0.82, pcu: 1680 },
  { id: 'J007', name: 'Old City', coords: [22.2989, 73.2090], status: 'offline', flowRatio: 0, pcu: 0 },
];

const statusColors = {
  optimal: '#16A34A', // Green
  warning: '#F59E0B', // Amber
  critical: '#DC2626', // Red
  offline: '#94A3B8', // Gray
};

const statusVariants = {
  optimal: 'success',
  warning: 'warning',
  critical: 'danger',
  offline: 'default',
};

const filters = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical' },
    { id: 'warning', label: 'Warning' },
    { id: 'optimal', label: 'Optimal' },
    { id: 'offline', label: 'Offline' },
];

function CityMap() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredJunctions = junctions.filter(j => 
    activeFilter === 'all' || j.status === activeFilter
  );

  return (
    <Card className="city-map-card">
      <div className="map-header-row">
        <div>
            <h3 className="section-title">Junction Status Map</h3>
            <p className="section-subtitle">Live status across Vadodara</p>
        </div>
        <div className="map-filters">
            {filters.map(filter => (
                <button 
                    key={filter.id}
                    className={`filter-tab ${activeFilter === filter.id ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter.id)}
                >
                    {filter.label}
                </button>
            ))}
        </div>
      </div>
      
      <div className="map-wrapper-govt">
        <MapContainer
          center={[22.3072, 73.1812]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', borderRadius: '8px', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredJunctions.map((junction) => (
            <CircleMarker
              key={junction.id}
              center={junction.coords}
              radius={8}
              pathOptions={{
                fillColor: statusColors[junction.status],
                fillOpacity: 1,
                color: '#FFFFFF',
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} className="govt-tooltip">
                <div className="map-tooltip-content">
                  <div className="tooltip-header">
                    <strong>{junction.name}</strong>
                    <Badge variant={statusVariants[junction.status]}>
                      {junction.status}
                    </Badge>
                  </div>
                  <div className="tooltip-row">
                    <span>Flow Ratio:</span>
                    <span>Y = {junction.flowRatio.toFixed(2)}</span>
                  </div>
                  <div className="tooltip-row">
                    <span>Throughput:</span>
                    <span>{junction.pcu} PCU/hr</span>
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
}

export default CityMap;
