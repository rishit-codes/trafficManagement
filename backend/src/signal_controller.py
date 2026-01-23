"""
Signal Controller Interface Module
Manages communication with traffic signal controllers.

Supports multiple backends:
- Mock (for testing/simulation)
- ICCC API (for real deployment)
- SUMO TraCI (for validation)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum
import time
import json


class SignalPhase(Enum):
    """Traffic signal phases."""
    RED = "RED"
    YELLOW = "YELLOW"
    GREEN = "GREEN"
    FLASHING_YELLOW = "FLASHING_YELLOW"


@dataclass
class SignalCommand:
    """Command to send to signal controller."""
    junction_id: str
    phase_name: str
    phase_state: SignalPhase
    duration_s: int
    priority: str = "NORMAL"  # NORMAL, HIGH, EMERGENCY


@dataclass
class SignalState:
    """Current state of a signal."""
    junction_id: str
    active_phase: str
    phase_state: SignalPhase
    time_remaining_s: int
    cycle_position_s: int
    is_manual_override: bool


class SignalControllerBase(ABC):
    """Abstract base class for signal controller interfaces."""
    
    @abstractmethod
    def connect(self) -> bool:
        """Establish connection to controller."""
        pass
    
    @abstractmethod
    def disconnect(self) -> None:
        """Close connection."""
        pass
    
    @abstractmethod
    def get_state(self, junction_id: str) -> Optional[SignalState]:
        """Get current signal state."""
        pass
    
    @abstractmethod
    def set_timing(self, junction_id: str, timing: Dict) -> bool:
        """Set new timing plan."""
        pass
    
    @abstractmethod
    def emergency_preempt(self, junction_id: str, direction: str) -> bool:
        """Trigger emergency vehicle preemption."""
        pass


class MockSignalController(SignalControllerBase):
    """
    Mock signal controller for testing.
    Simulates signal behavior without real hardware.
    """
    
    def __init__(self):
        self.connected = False
        self.states: Dict[str, SignalState] = {}
        self.timings: Dict[str, Dict] = {}
        self.command_log: List[Dict] = []
    
    def connect(self) -> bool:
        self.connected = True
        print("MockSignalController: Connected")
        return True
    
    def disconnect(self) -> None:
        self.connected = False
        print("MockSignalController: Disconnected")
    
    def get_state(self, junction_id: str) -> Optional[SignalState]:
        if not self.connected:
            return None
        
        # Return mock state
        if junction_id not in self.states:
            self.states[junction_id] = SignalState(
                junction_id=junction_id,
                active_phase="NS",
                phase_state=SignalPhase.GREEN,
                time_remaining_s=30,
                cycle_position_s=15,
                is_manual_override=False
            )
        return self.states[junction_id]
    
    def set_timing(self, junction_id: str, timing: Dict) -> bool:
        if not self.connected:
            return False
        
        self.timings[junction_id] = timing
        self.command_log.append({
            "timestamp": time.time(),
            "junction_id": junction_id,
            "action": "SET_TIMING",
            "timing": timing
        })
        print(f"MockSignalController: Set timing for {junction_id}: cycle={timing.get('cycle_length_s')}s")
        return True
    
    def emergency_preempt(self, junction_id: str, direction: str) -> bool:
        if not self.connected:
            return False
        
        self.command_log.append({
            "timestamp": time.time(),
            "junction_id": junction_id,
            "action": "EMERGENCY_PREEMPT",
            "direction": direction
        })
        print(f"MockSignalController: EMERGENCY preemption for {junction_id} direction {direction}")
        
        # Update state to show green for emergency direction
        self.states[junction_id] = SignalState(
            junction_id=junction_id,
            active_phase=direction,
            phase_state=SignalPhase.GREEN,
            time_remaining_s=60,
            cycle_position_s=0,
            is_manual_override=True
        )
        return True
    
    def get_command_history(self) -> List[Dict]:
        """Get log of all commands sent."""
        return self.command_log


class SignalController:
    """
    High-level signal controller manager.
    Wraps backend-specific implementations.
    """
    
    def __init__(self, backend: str = "mock"):
        """
        Initialize controller with specified backend.
        
        Args:
            backend: "mock", "iccc", or "sumo"
        """
        self.backend_name = backend
        
        if backend == "mock":
            self.backend = MockSignalController()
        elif backend == "sumo":
            # TODO: Implement SUMO TraCI backend
            self.backend = MockSignalController()
            print("Warning: SUMO backend not implemented, using mock")
        elif backend == "iccc":
            # TODO: Implement ICCC API backend
            self.backend = MockSignalController()
            print("Warning: ICCC backend not implemented, using mock")
        else:
            raise ValueError(f"Unknown backend: {backend}")
    
    def connect(self) -> bool:
        """Connect to signal controller."""
        return self.backend.connect()
    
    def disconnect(self) -> None:
        """Disconnect from controller."""
        self.backend.disconnect()
    
    def apply_timing(self, junction_id: str, timing: Dict) -> bool:
        """
        Apply optimized timing to a junction.
        
        Args:
            junction_id: Junction to update
            timing: Timing dict from WebsterOptimizer
        
        Returns:
            True if successful
        """
        return self.backend.set_timing(junction_id, timing)
    
    def get_current_state(self, junction_id: str) -> Optional[Dict]:
        """Get current signal state as dict."""
        state = self.backend.get_state(junction_id)
        if not state:
            return None
        
        return {
            "junction_id": state.junction_id,
            "active_phase": state.active_phase,
            "phase_state": state.phase_state.value,
            "time_remaining_s": state.time_remaining_s,
            "cycle_position_s": state.cycle_position_s,
            "is_manual_override": state.is_manual_override
        }
    
    def trigger_emergency_preemption(self, junction_id: str, direction: str) -> bool:
        """
        Trigger emergency vehicle preemption.
        Creates green corridor for emergency vehicle.
        """
        return self.backend.emergency_preempt(junction_id, direction)
    
    def batch_update(self, timings: Dict[str, Dict]) -> Dict[str, bool]:
        """
        Apply timing updates to multiple junctions.
        
        Args:
            timings: {junction_id: timing_dict}
        
        Returns:
            {junction_id: success}
        """
        results = {}
        for jid, timing in timings.items():
            results[jid] = self.apply_timing(jid, timing)
        return results


if __name__ == "__main__":
    # Test the controller
    controller = SignalController(backend="mock")
    controller.connect()
    
    # Get state
    state = controller.get_current_state("J001")
    print(f"Current state: {state}")
    
    # Apply timing
    sample_timing = {
        "cycle_length_s": 90,
        "phases": [
            {"name": "NS", "green_s": 40, "yellow_s": 3, "red_s": 47},
            {"name": "EW", "green_s": 35, "yellow_s": 3, "red_s": 52}
        ]
    }
    success = controller.apply_timing("J001", sample_timing)
    print(f"Timing applied: {success}")
    
    # Emergency preemption
    controller.trigger_emergency_preemption("J001", "north")
    
    # Check state after preemption
    state = controller.get_current_state("J001")
    print(f"State after preemption: {state}")
    
    controller.disconnect()
