import { MapPin, Navigation } from 'lucide-react';
import './JunctionSelector.css';

function JunctionSelector({ junctions, selectedJunction, onJunctionChange }) {
    return (
        <div className="junction-selector">
            <div className="selector-header">
                <Navigation size={20} />
                <h2>Select Junction</h2>
            </div>

            <div className="junction-cards">
                {junctions.map((junction) => (
                    <button
                        key={junction.id}
                        className={`junction-card ${selectedJunction?.id === junction.id ? 'active' : ''}`}
                        onClick={() => onJunctionChange(junction)}
                    >
                        <MapPin size={24} className="junction-icon" />
                        <div className="junction-info">
                            <h3>{junction.name}</h3>
                            <p className="junction-id">{junction.id}</p>
                            {junction.coordinates && (
                                <p className="junction-coords">
                                    {junction.coordinates.lat.toFixed(4)}, {junction.coordinates.lon.toFixed(4)}
                                </p>
                            )}
                            <div className="junction-stats">
                                <span>{Object.keys(junction.approaches || {}).length} approaches</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default JunctionSelector;
