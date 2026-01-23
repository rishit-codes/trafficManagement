"""
Traffic Analytics Engine
Analyzes historical traffic data to identify patterns, detect anomalies, and calculate performance metrics.

Features:
- Historical pattern recognition
- Anomaly detection
- Time-of-day analysis
- Performance metrics calculation
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import statistics

from backend.src.database import traffic_store


class TrafficAnalytics:
    """
    Provides analytics capabilities for historical traffic data.
    """
    
    def __init__(self):
        self.store = traffic_store
    
    def get_historical_average(
        self,
        junction_id: str,
        day_of_week: Optional[int] = None,
        hour: Optional[int] = None,
        direction: Optional[str] = None,
        days_back: int = 30
    ) -> Optional[Dict]:
        """
        Get historical average traffic for a specific time pattern.
        
        Args:
            junction_id: Junction to analyze
            day_of_week: Day of week (0=Monday, 6=Sunday), None for all days
            hour: Hour of day (0-23), None for all hours
            direction: Traffic direction, None for all directions
            days_back: Number of days of history to include
        
        Returns:
            Dictionary with average metrics or None if no data
        """
        # Use current time if not specified
        if day_of_week is None:
            day_of_week = datetime.now().weekday()
        if hour is None:
            hour = datetime.now().hour
        
        return self.store.get_average_by_time(
            junction_id=junction_id,
            day_of_week=day_of_week,
            hour=hour,
            direction=direction,
            days_back=days_back
        )
    
    def detect_anomaly(
        self,
        junction_id: str,
        current_pcu: float,
        direction: Optional[str] = None,
        threshold_std: float = 2.0
    ) -> Dict:
        """
        Detect if current traffic is anomalous compared to historical patterns.
        
        Args:
            junction_id: Junction to analyze
            current_pcu: Current PCU value
            direction: Traffic direction
            threshold_std: Number of standard deviations for anomaly threshold
        
        Returns:
            Dictionary with anomaly status and details
        """
        now = datetime.now()
        historical = self.get_historical_average(
            junction_id=junction_id,
            day_of_week=now.weekday(),
            hour=now.hour,
            direction=direction,
            days_back=30
        )
        
        if not historical or historical['sample_count'] < 5:
            return {
                'is_anomaly': False,
                'reason': 'insufficient_historical_data',
                'current_pcu': current_pcu,
                'historical_avg': None,
                'deviation': None
            }
        
        avg_pcu = historical['avg_pcu']
        
        # Calculate standard deviation from recent data
        recent_data = self.store.get_history(
            junction_id=junction_id,
            start_time=now - timedelta(days=30),
            end_time=now,
            direction=direction,
            limit=1000
        )
        
        if len(recent_data) < 10:
            return {
                'is_anomaly': False,
                'reason': 'insufficient_data_for_std',
                'current_pcu': current_pcu,
                'historical_avg': avg_pcu,
                'deviation': None
            }
        
        pcu_values = [record['total_pcu'] for record in recent_data]
        std_dev = statistics.stdev(pcu_values)
        
        # Calculate deviation
        deviation = abs(current_pcu - avg_pcu) / std_dev if std_dev > 0 else 0
        is_anomaly = deviation > threshold_std
        
        # Determine anomaly type
        anomaly_type = None
        severity = 'normal'
        
        if is_anomaly:
            if current_pcu < avg_pcu:
                anomaly_type = 'unusually_low'
                severity = 'warning' if deviation > 3.0 else 'minor'
            else:
                anomaly_type = 'unusually_high'
                severity = 'critical' if deviation > 3.0 else 'warning'
        
        return {
            'is_anomaly': is_anomaly,
            'anomaly_type': anomaly_type,
            'severity': severity,
            'current_pcu': current_pcu,
            'historical_avg': avg_pcu,
            'std_deviation': std_dev,
            'deviation_factor': round(deviation, 2),
            'threshold': threshold_std,
            'sample_count': len(recent_data)
        }
    
    def get_time_of_day_patterns(
        self,
        junction_id: str,
        days_back: int = 30,
        direction: Optional[str] = None
    ) -> List[Dict]:
        """
        Get average traffic patterns by hour of day.
        
        Args:
            junction_id: Junction to analyze
            days_back: Number of days of history to include
            direction: Traffic direction
        
        Returns:
            List of hourly averages (24 entries)
        """
        patterns = []
        
        for hour in range(24):
            # Get average for each hour across all days of week
            hour_data = []
            
            for day in range(7):
                avg = self.store.get_average_by_time(
                    junction_id=junction_id,
                    day_of_week=day,
                    hour=hour,
                    direction=direction,
                    days_back=days_back
                )
                if avg and avg['sample_count'] > 0:
                    hour_data.append(avg['avg_pcu'])
            
            if hour_data:
                patterns.append({
                    'hour': hour,
                    'avg_pcu': statistics.mean(hour_data),
                    'min_pcu': min(hour_data),
                    'max_pcu': max(hour_data),
                    'sample_days': len(hour_data)
                })
            else:
                patterns.append({
                    'hour': hour,
                    'avg_pcu': 0,
                    'min_pcu': 0,
                    'max_pcu': 0,
                    'sample_days': 0
                })
        
        return patterns
    
    def get_day_of_week_patterns(
        self,
        junction_id: str,
        days_back: int = 30,
        direction: Optional[str] = None
    ) -> List[Dict]:
        """
        Get average traffic patterns by day of week.
        
        Args:
            junction_id: Junction to analyze
            days_back: Number of days of history to include
            direction: Traffic direction
        
        Returns:
            List of daily averages (7 entries)
        """
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        patterns = []
        
        for day in range(7):
            # Get average for each day across all hours
            day_data = []
            
            for hour in range(24):
                avg = self.store.get_average_by_time(
                    junction_id=junction_id,
                    day_of_week=day,
                    hour=hour,
                    direction=direction,
                    days_back=days_back
                )
                if avg and avg['sample_count'] > 0:
                    day_data.append(avg['avg_pcu'])
            
            if day_data:
                patterns.append({
                    'day_of_week': day,
                    'day_name': day_names[day],
                    'avg_pcu': statistics.mean(day_data),
                    'min_pcu': min(day_data),
                    'max_pcu': max(day_data),
                    'sample_hours': len(day_data)
                })
            else:
                patterns.append({
                    'day_of_week': day,
                    'day_name': day_names[day],
                    'avg_pcu': 0,
                    'min_pcu': 0,
                    'max_pcu': 0,
                    'sample_hours': 0
                })
        
        return patterns
    
    def calculate_performance_metrics(
        self,
        junction_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict:
        """
        Calculate performance metrics for a time period.
        
        Args:
            junction_id: Junction to analyze
            start_date: Start of period (defaults to 7 days ago)
            end_date: End of period (defaults to now)
        
        Returns:
            Dictionary with performance metrics
        """
        if end_date is None:
            end_date = datetime.now()
        if start_date is None:
            start_date = end_date - timedelta(days=7)
        
        # Get all data for the period
        data = self.store.get_history(
            junction_id=junction_id,
            start_time=start_date,
            end_time=end_date,
            limit=10000
        )
        
        if not data:
            return {
                'junction_id': junction_id,
                'period_start': start_date.isoformat(),
                'period_end': end_date.isoformat(),
                'error': 'no_data_available'
            }
        
        # Calculate metrics
        pcu_values = [record['total_pcu'] for record in data]
        queue_values = [record['queue_length'] for record in data]
        wait_values = [record['waiting_time_avg'] for record in data if record['waiting_time_avg'] > 0]
        
        metrics = {
            'junction_id': junction_id,
            'period_start': start_date.isoformat(),
            'period_end': end_date.isoformat(),
            'total_records': len(data),
            
            # Traffic volume metrics
            'avg_pcu': statistics.mean(pcu_values) if pcu_values else 0,
            'max_pcu': max(pcu_values) if pcu_values else 0,
            'min_pcu': min(pcu_values) if pcu_values else 0,
            'std_pcu': statistics.stdev(pcu_values) if len(pcu_values) > 1 else 0,
            
            # Queue metrics
            'avg_queue_length': statistics.mean(queue_values) if queue_values else 0,
            'max_queue_length': max(queue_values) if queue_values else 0,
            
            # Waiting time metrics
            'avg_waiting_time': statistics.mean(wait_values) if wait_values else 0,
            'max_waiting_time': max(wait_values) if wait_values else 0,
            
            # Data quality
            'data_completeness': len([r for r in data if r['vehicle_counts']]) / len(data) if data else 0
        }
        
        return metrics
    
    def compare_periods(
        self,
        junction_id: str,
        period1_start: datetime,
        period1_end: datetime,
        period2_start: datetime,
        period2_end: datetime
    ) -> Dict:
        """
        Compare performance metrics between two time periods.
        
        Args:
            junction_id: Junction to analyze
            period1_start: Start of first period
            period1_end: End of first period
            period2_start: Start of second period
            period2_end: End of second period
        
        Returns:
            Dictionary with comparison results
        """
        metrics1 = self.calculate_performance_metrics(junction_id, period1_start, period1_end)
        metrics2 = self.calculate_performance_metrics(junction_id, period2_start, period2_end)
        
        if 'error' in metrics1 or 'error' in metrics2:
            return {
                'error': 'insufficient_data_for_comparison',
                'period1': metrics1,
                'period2': metrics2
            }
        
        # Calculate improvements
        def calc_improvement(old, new):
            if old == 0:
                return 0
            return ((old - new) / old) * 100
        
        return {
            'junction_id': junction_id,
            'period1': {
                'start': period1_start.isoformat(),
                'end': period1_end.isoformat(),
                'metrics': metrics1
            },
            'period2': {
                'start': period2_start.isoformat(),
                'end': period2_end.isoformat(),
                'metrics': metrics2
            },
            'improvements': {
                'avg_pcu_change_pct': calc_improvement(metrics1['avg_pcu'], metrics2['avg_pcu']),
                'avg_queue_change_pct': calc_improvement(metrics1['avg_queue_length'], metrics2['avg_queue_length']),
                'avg_wait_change_pct': calc_improvement(metrics1['avg_waiting_time'], metrics2['avg_waiting_time'])
            }
        }
    
    def get_peak_hours(
        self,
        junction_id: str,
        days_back: int = 30,
        top_n: int = 3
    ) -> List[Dict]:
        """
        Identify peak traffic hours.
        
        Args:
            junction_id: Junction to analyze
            days_back: Number of days of history to include
            top_n: Number of peak hours to return
        
        Returns:
            List of peak hours with traffic levels
        """
        patterns = self.get_time_of_day_patterns(junction_id, days_back)
        
        # Sort by average PCU
        sorted_patterns = sorted(patterns, key=lambda x: x['avg_pcu'], reverse=True)
        
        return sorted_patterns[:top_n]


# Global instance
analytics = TrafficAnalytics()
