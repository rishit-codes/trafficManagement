
import React from 'react';
import './MultiCameraGrid.css';

const MultiCameraGrid = ({ junction, signalState }) => {
    // Map direction keys to the standard N/S/E/W used in signal state
    const feeds = [
        { dir: 'NORTH', code: 'N', label: 'Main Approach', video: junction?.video },
        { dir: 'SOUTH', code: 'S', label: 'South Exit', video: junction?.video },
        { dir: 'EAST', code: 'E', label: 'Market Road', video: junction?.video },
        { dir: 'WEST', code: 'W', label: 'University Rd', video: junction?.video }
    ];

    // Effect to handle Play/Pause based on signal state
    // signalState.active_directions is e.g. ["N", "S"]
    React.useEffect(() => {
        feeds.forEach(feed => {
            const videoEl = document.getElementById(`video-${feed.dir}`);
            if (videoEl) {
                const isActive = signalState?.active_directions?.includes(feed.code);

                // Logic: 
                // GREEN (Active) -> Play
                // RED (Inactive) -> Pause (Frozen)
                if (isActive) {
                    videoEl.play().catch(e => console.log('Autoplay prevent', e));
                } else {
                    videoEl.pause();
                }
            }
        });
    }, [signalState]);

    return (
        <div className="camera-grid-container">
            <div className="camera-header-row">
                <h4 className="panel-title">Live Vision Feed (4-Way)</h4>
                <span className="live-badge">● LIVE NET</span>
            </div>

            <div className="four-way-grid">
                {feeds.map((feed, idx) => {
                    const isActive = signalState?.active_directions?.includes(feed.code);
                    return (
                        <div key={feed.dir} className={`camera-quadrant ${isActive ? 'cam-active' : 'cam-frozen'}`}>
                            <div className="camera-overlay">
                                <span className={`cam-dir ${isActive ? 'dir-green' : 'dir-red'}`}>{feed.dir}</span>
                                <span className="cam-label">{feed.label}</span>
                            </div>

                            {/* Status Indicator Overlay */}
                            <div className={`status-dot ${isActive ? 'dot-green' : 'dot-red'}`} />

                            {feed.video ? (
                                <video
                                    id={`video-${feed.dir}`}
                                    className="quad-video"
                                    src={feed.video}
                                    muted
                                    playsInline
                                    loop // Keep looping so when we resume it continues
                                // Start paused effectively, effect will trigger play
                                />
                            ) : (
                                <div className="no-feed">Signal Lost</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MultiCameraGrid;
