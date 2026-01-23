"""
Data Collection Pipeline
Automatically collects and stores traffic data for historical analysis.

Features:
- Automatic data collection from optimization calls
- Background data collection from vision module
- Batch insertion for efficiency
- Error handling and retry logic
"""

import asyncio
from datetime import datetime
from typing import Dict, Optional
from collections import deque
import threading
import time

from backend.src.database import traffic_store


class DataCollector:
    """
    Collects traffic data and stores it in the database.
    Supports both immediate and batched storage.
    """
    
    def __init__(self, batch_size: int = 10, batch_interval: int = 60):
        """
        Initialize data collector.
        
        Args:
            batch_size: Number of records to accumulate before batch insert
            batch_interval: Seconds to wait before forcing batch insert
        """
        self.batch_size = batch_size
        self.batch_interval = batch_interval
        self.batch_queue = deque()
        self.last_batch_time = time.time()
        self.lock = threading.Lock()
        self._running = False
        self._thread = None
    
    def collect_optimization_data(
        self,
        junction_id: str,
        flows: Dict[str, float],
        optimization_result: Dict,
        weather: str = 'unknown'
    ):
        """
        Collect data from an optimization call.
        
        Args:
            junction_id: Junction being optimized
            flows: Traffic flows by direction
            optimization_result: Result from optimizer
            weather: Current weather condition
        """
        timestamp = datetime.now()
        
        # Store data for each direction
        for direction, pcu_value in flows.items():
            try:
                # Extract signal timing if available
                signal_timing = None
                if 'cycle_length_s' in optimization_result:
                    signal_timing = {
                        'cycle_length': optimization_result['cycle_length_s'],
                        'phases': optimization_result.get('phases', [])
                    }
                
                # Store immediately (not batched for optimization calls)
                traffic_store.store_traffic_data(
                    junction_id=junction_id,
                    direction=direction,
                    vehicle_counts={},  # Not available from optimization call
                    total_pcu=pcu_value,
                    queue_length=0,  # Not available
                    waiting_time_avg=0.0,  # Not available
                    signal_timing=signal_timing,
                    weather=weather,
                    timestamp=timestamp
                )
            except Exception as e:
                print(f"⚠️ Error storing optimization data: {e}")
    
    def collect_vision_data(
        self,
        junction_id: str,
        direction: str,
        vehicle_counts: Dict[str, int],
        total_pcu: float,
        queue_length: int = 0,
        weather: str = 'unknown',
        batch: bool = True
    ):
        """
        Collect data from vision module.
        
        Args:
            junction_id: Junction being monitored
            direction: Traffic direction
            vehicle_counts: Vehicle counts by type
            total_pcu: Total PCU value
            queue_length: Queue length in vehicles
            weather: Current weather condition
            batch: If True, add to batch queue; if False, store immediately
        """
        data = {
            'junction_id': junction_id,
            'direction': direction,
            'vehicle_counts': vehicle_counts,
            'total_pcu': total_pcu,
            'queue_length': queue_length,
            'waiting_time_avg': 0.0,  # Can be calculated later
            'signal_timing': None,
            'weather': weather,
            'timestamp': datetime.now()
        }
        
        if batch:
            self._add_to_batch(data)
        else:
            try:
                traffic_store.store_traffic_data(**data)
            except Exception as e:
                print(f"⚠️ Error storing vision data: {e}")
    
    def _add_to_batch(self, data: Dict):
        """Add data to batch queue and flush if needed."""
        with self.lock:
            self.batch_queue.append(data)
            
            # Check if we should flush
            should_flush = (
                len(self.batch_queue) >= self.batch_size or
                (time.time() - self.last_batch_time) >= self.batch_interval
            )
            
            if should_flush:
                self._flush_batch()
    
    def _flush_batch(self):
        """Flush batch queue to database."""
        if not self.batch_queue:
            return
        
        try:
            # Convert deque to list
            records = list(self.batch_queue)
            
            # Store batch
            count = traffic_store.store_batch(records)
            
            # Clear queue
            self.batch_queue.clear()
            self.last_batch_time = time.time()
            
            print(f"[OK] Stored {count} traffic records in batch")
        except Exception as e:
            print(f"⚠️ Error flushing batch: {e}")
            # Don't clear queue on error - will retry next time
    
    def start_background_collection(self):
        """Start background thread for periodic batch flushing."""
        if self._running:
            return
        
        self._running = True
        self._thread = threading.Thread(target=self._background_worker, daemon=True)
        self._thread.start()
        print("[OK] Background data collection started")
    
    def stop_background_collection(self):
        """Stop background thread and flush remaining data."""
        if not self._running:
            return
        
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
        
        # Flush any remaining data
        with self.lock:
            self._flush_batch()
        
        print("[OK] Background data collection stopped")
    
    def _background_worker(self):
        """Background worker that periodically flushes batch queue."""
        while self._running:
            time.sleep(self.batch_interval)
            
            with self.lock:
                if self.batch_queue:
                    self._flush_batch()
    
    def force_flush(self):
        """Manually force flush of batch queue."""
        with self.lock:
            self._flush_batch()


class SyntheticDataGenerator:
    """
    Generates synthetic historical data for demo purposes.
    Useful when you need to demonstrate historical features without waiting for real data.
    """
    
    @staticmethod
    def generate_daily_pattern(
        junction_id: str,
        days: int = 7,
        base_pcu: float = 600
    ) -> int:
        """
        Generate synthetic traffic data with realistic daily patterns.
        
        Args:
            junction_id: Junction to generate data for
            days: Number of days of history to generate
            base_pcu: Base PCU value (will vary by time of day)
        
        Returns:
            Number of records generated
        """
        import random
        from datetime import timedelta
        
        records = []
        end_time = datetime.now()
        start_time = end_time - timedelta(days=days)
        
        # Time-of-day multipliers (realistic traffic patterns)
        hour_multipliers = {
            0: 0.2, 1: 0.15, 2: 0.1, 3: 0.1, 4: 0.15, 5: 0.3,
            6: 0.6, 7: 0.9, 8: 1.3, 9: 1.1, 10: 0.9, 11: 0.95,
            12: 1.0, 13: 0.95, 14: 0.9, 15: 0.95, 16: 1.1,
            17: 1.4, 18: 1.5, 19: 1.2, 20: 0.8, 21: 0.6,
            22: 0.4, 23: 0.3
        }
        
        # Generate data points every 5 minutes
        current_time = start_time
        while current_time <= end_time:
            hour = current_time.hour
            multiplier = hour_multipliers.get(hour, 1.0)
            
            # Add some randomness
            variation = random.uniform(0.8, 1.2)
            pcu = base_pcu * multiplier * variation
            
            # Weekend reduction
            if current_time.weekday() >= 5:  # Saturday or Sunday
                pcu *= 0.7
            
            # Generate for each direction
            for direction in ['north', 'south', 'east', 'west']:
                dir_variation = random.uniform(0.8, 1.2)
                dir_pcu = pcu * dir_variation
                
                # Generate vehicle counts that sum to PCU
                car_count = int(dir_pcu * random.uniform(0.5, 0.7))
                motorcycle_count = int(dir_pcu * random.uniform(0.2, 0.3) / 0.2)
                bus_count = int(dir_pcu * random.uniform(0.05, 0.1) / 2.5)
                truck_count = int(dir_pcu * random.uniform(0.05, 0.1) / 3.0)
                
                records.append({
                    'junction_id': junction_id,
                    'direction': direction,
                    'vehicle_counts': {
                        'car': car_count,
                        'motorcycle': motorcycle_count,
                        'bus': bus_count,
                        'truck': truck_count
                    },
                    'total_pcu': dir_pcu,
                    'queue_length': int(dir_pcu / 50),  # Rough estimate
                    'waiting_time_avg': 20 + random.uniform(-10, 20),
                    'signal_timing': None,
                    'weather': random.choice(['clear', 'clear', 'clear', 'cloudy', 'rainy']),
                    'timestamp': current_time
                })
            
            # Move to next time point (5 minutes)
            current_time += timedelta(minutes=5)
        
        # Store in database
        count = traffic_store.store_batch(records)
        print(f"[OK] Generated {count} synthetic traffic records for {junction_id}")
        return count


# Global instance
data_collector = DataCollector()
