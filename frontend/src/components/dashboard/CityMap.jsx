import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';

const CityMap = () => {
  const position = [22.3072, 73.1812]; // Vadodara Center

  const junctions = [
    { id: 1, name: 'Market Rd / 4th Ave', pos: [22.3072, 73.1812], status: 'critical', flow: 1.2 },
    { id: 2, name: 'Main St / Central', pos: [22.3100, 73.1850], status: 'warning', flow: 0.85 },
    { id: 3, name: 'Tech Park East', pos: [22.3050, 73.1780], status: 'warning', flow: 0.9 },
    { id: 4, name: 'North Ring Road', pos: [22.3150, 73.1800], status: 'optimal', flow: 0.4 },
    { id: 5, name: 'South Gate', pos: [22.2980, 73.1820], status: 'optimal', flow: 0.3 },
  ];

  const getColor = (status) => {
    switch (status) {
      case 'critical': return '#DC2626';
      case 'warning': return '#D97706';
      case 'optimal': return '#059669';
      default: return '#9CA3AF';
    }
  };

  return (
    <div className="dashboard-card map-container-card">
      <div className="map-wrapper">
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          
          {junctions.map(j => (
            <CircleMarker 
              key={j.id} 
              center={j.pos}
              radius={8}
              pathOptions={{ 
                color: '#fff', 
                fillColor: getColor(j.status), 
                fillOpacity: 1, 
                weight: 2 
              }}
              eventHandlers={{
                click: () => console.log(`Junction clicked: ${j.id}`)
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className="map-tooltip">
                  <strong>{j.name}</strong>
                  <div style={{ color: getColor(j.status), textTransform: 'capitalize' }}>
                    ● {j.status}
                  </div>
                  <div>Flow: {j.flow}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="map-legend">
        <div className="legend-item"><span className="dot dot-green"></span> Optimal</div>
        <div className="legend-item"><span className="dot dot-amber"></span> Warning</div>
        <div className="legend-item"><span className="dot dot-red"></span> Critical</div>
      </div>
    </div>
  );
};

export default CityMap;
