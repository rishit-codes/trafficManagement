"""
4-Way Signal State Engine
Maintains and updates traffic signal state per junction.

This is a PILOT-SAFE implementation that provides deterministic 4-way
signal phasing based on server time. No external sensors required.

Phase Sequence:
1. NS_GREEN   (North + South) - 30s
2. NS_YELLOW  (North + South) - 5s
3. ALL_RED    (Clearance)     - 5s
4. EW_GREEN   (East + West)   - 30s
5. EW_YELLOW  (East + West)   - 5s
6. ALL_RED    (Clearance)     - 5s

Total Cycle: 80 seconds
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum


class SignalPhase(Enum):
    """4-way traffic signal phases."""
    NS_GREEN = "NS_GREEN"
    NS_YELLOW = "NS_YELLOW"
    ALL_RED_1 = "ALL_RED"  # After NS
    EW_GREEN = "EW_GREEN"
    EW_YELLOW = "EW_YELLOW"
    ALL_RED_2 = "ALL_RED"  # After EW (same display name)


@dataclass
class PhaseConfig:
    """Configuration for a signal phase."""
    phase: SignalPhase
    duration: int
    active_directions: List[str]
    display_name: str


# Phase sequence with durations and active directions
PHASE_SEQUENCE = [
    PhaseConfig(SignalPhase.NS_GREEN, 30, ["N", "S"], "North–South Green"),
    PhaseConfig(SignalPhase.NS_YELLOW, 5, ["N", "S"], "North–South Yellow"),
    PhaseConfig(SignalPhase.ALL_RED_1, 5, [], "All Red (Clearance)"),
    PhaseConfig(SignalPhase.EW_GREEN, 30, ["E", "W"], "East–West Green"),
    PhaseConfig(SignalPhase.EW_YELLOW, 5, ["E", "W"], "East–West Yellow"),
    PhaseConfig(SignalPhase.ALL_RED_2, 5, [], "All Red (Clearance)"),
]

# Total cycle length
TOTAL_CYCLE = sum(p.duration for p in PHASE_SEQUENCE)  # 80 seconds

# Known pilot junction IDs
PILOT_JUNCTION_IDS = ["J001", "J002", "J003", "J004", "J005"]


@dataclass
class SignalStateData:
    """Current state of a 4-way traffic signal."""
    junction_id: str
    current_phase: str
    time_remaining: int
    active_directions: List[str]
    cycle_length: int
    display_name: str
    updated_at: datetime


def get_signal_state(junction_id: str) -> Optional[SignalStateData]:
    """
    Get the current 4-way signal state for a junction.
    
    Signal phase is determined purely by server time, making it
    deterministic and consistent across all clients.
    
    Args:
        junction_id: The junction identifier
        
    Returns:
        SignalStateData if junction exists, None otherwise
    """
    # Only serve known pilot junctions
    if junction_id not in PILOT_JUNCTION_IDS:
        return None
    
    now = datetime.now(timezone.utc)
    
    # Use epoch seconds for deterministic cycling
    epoch_seconds = int(now.timestamp())
    
    # Calculate position within the current cycle
    cycle_position = epoch_seconds % TOTAL_CYCLE
    
    # Determine current phase
    elapsed = 0
    current_config = PHASE_SEQUENCE[0]  # Default
    time_remaining = 0
    
    for config in PHASE_SEQUENCE:
        if cycle_position < elapsed + config.duration:
            current_config = config
            time_remaining = (elapsed + config.duration) - cycle_position
            break
        elapsed += config.duration
    
    return SignalStateData(
        junction_id=junction_id,
        current_phase=current_config.phase.value,
        time_remaining=time_remaining,
        active_directions=current_config.active_directions,
        cycle_length=TOTAL_CYCLE,
        display_name=current_config.display_name,
        updated_at=now
    )


def signal_state_to_dict(state: SignalStateData) -> Dict:
    """Convert SignalStateData to API response format."""
    return {
        "junction_id": state.junction_id,
        "current_phase": state.current_phase,
        "time_remaining": state.time_remaining,
        "active_directions": state.active_directions,
        "cycle_length": state.cycle_length,
        "display_name": state.display_name,
        "updated_at": state.updated_at.isoformat()
    }


# Test the engine
if __name__ == "__main__":
    import time as t
    
    print("4-Way Signal State Engine Test")
    print("=" * 50)
    print(f"Total Cycle: {TOTAL_CYCLE}s")
    print()
    
    for _ in range(10):
        state = get_signal_state("J001")
        if state:
            dirs = ", ".join(state.active_directions) if state.active_directions else "None"
            print(f"Phase: {state.display_name:25} | "
                  f"Active: [{dirs:5}] | "
                  f"Remaining: {state.time_remaining:2}s")
        t.sleep(2)
