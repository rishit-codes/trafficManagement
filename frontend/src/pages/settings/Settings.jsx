import React, { useState } from 'react';
import { Save } from 'lucide-react';

const Settings = () => {
  const [useAI, setUseAI] = useState(true);
  const [minGreen, setMinGreen] = useState(15);
  const [maxCycle, setMaxCycle] = useState(120);

  return (
    <div className="settings-container">
      <div className="settings-section">
        <div className="section-header">
          <h2 className="settings-title">Optimization Parameters</h2>
          <p className="settings-desc">Configure the constraints for the Webster's optimization algorithm.</p>
        </div>

        <div className="form-group">
          <div className="toggle-row">
            <div>
              <label style={{marginBottom: 0}}>AI Vision Integration</label>
              <p className="settings-desc">Use YOLOv8 real-time detection for queue estimation</p>
            </div>
            <div className={`toggle-switch ${useAI ? 'active' : ''}`} onClick={() => setUseAI(!useAI)}>
              <div className="toggle-knob"></div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Minimum Green Time (s): {minGreen}</label>
          <input 
            type="range" 
            min="5" 
            max="30" 
            value={minGreen} 
            onChange={(e) => setMinGreen(e.target.value)} 
            className="range-slider"
          />
        </div>

        <div className="form-group">
          <label>Max Cycle Length (s): {maxCycle}</label>
           <input 
            type="range" 
            min="60" 
            max="180" 
            value={maxCycle} 
            onChange={(e) => setMaxCycle(e.target.value)} 
            className="range-slider"
          />
        </div>
      </div>

      <div className="settings-section">
        <div className="section-header">
           <h2 className="settings-title">Junction Configuration</h2>
           <p className="settings-desc">Raw JSON configuration for J001-J005.</p>
        </div>
        
        <textarea 
          className="form-control" 
          rows="10" 
          defaultValue={`{
  "junctions": {
    "J001": {
      "id": "J001",
      "name": "Productivity Circle",
      "approaches": {
        "north": { "lanes": 3, "width_m": 3.5 },
        "south": { "lanes": 3, "width_m": 3.5 },
        "east": { "lanes": 4, "width_m": 3.2 },
        "west": { "lanes": 4, "width_m": 3.2 }
      }
    }
  }
}`}
        ></textarea>

         <div style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end'}}>
           <button className="control-btn" style={{flexDirection: 'row', padding: '10px 20px', width: 'auto'}}>
             <Save size={18} /> Save Config
           </button>
         </div>
      </div>
    </div>
  );
};

export default Settings;
