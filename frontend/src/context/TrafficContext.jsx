import React, { createContext, useState, useContext } from 'react';

const TrafficContext = createContext();

export const useTraffic = () => useContext(TrafficContext);

export const TrafficProvider = ({ children }) => {
    // Map of junctionId -> { active: boolean, type: 'manual'|'emergency', action: string, label: string }
    const [overrides, setOverrides] = useState({});

    // Clean Emergency Mode State
    const [emergencyMode, setEmergencyMode] = useState({
        active: false,
        type: null,
        route: []
    });

    const applyManualOverride = (junctionId, action, label) => {
        setOverrides(prev => ({
            ...prev,
            [junctionId]: {
                active: true,
                type: 'manual',
                action,
                label,
                timestamp: Date.now()
            }
        }));

        // Auto-clear after 30s for demo purposes (optional, or manual clear)
        // For now we keep it active until cleared or replaced
    };

    const clearOverride = (junctionId) => {
        setOverrides(prev => {
            const copy = { ...prev };
            delete copy[junctionId];
            return copy;
        });
    };

    const activateEmergency = (type, routeJunctionIds) => {
        setEmergencyMode({
            active: true,
            type,
            route: routeJunctionIds
        });

        // Also apply overrides to all junctions in route
        const newOverrides = {};
        routeJunctionIds.forEach(id => {
            newOverrides[id] = {
                active: true,
                type: 'emergency',
                action: 'ALL_RED', // Default safe state or Green Wave
                label: `EMERGENCY: ${type.toUpperCase()} WAVE`
            };
        });

        setOverrides(prev => ({ ...prev, ...newOverrides }));
    };

    const deactivateEmergency = () => {
        setEmergencyMode({ active: false, type: null, route: [] });
        // Clear all emergency overrides
        setOverrides(prev => {
            const copy = {};
            Object.keys(prev).forEach(key => {
                if (prev[key].type !== 'emergency') {
                    copy[key] = prev[key];
                }
            });
            return copy;
        });
    };

    return (
        <TrafficContext.Provider value={{
            overrides,
            emergencyMode,
            applyManualOverride,
            clearOverride,
            activateEmergency,
            deactivateEmergency
        }}>
            {children}
        </TrafficContext.Provider>
    );
};
