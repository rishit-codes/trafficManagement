"""
Traffic Forecasting Module
Predicts future traffic flows based on historical patterns.

Features:
- Simple moving average (fast, good for short-term)
- Exponential smoothing (adapts to trends)
- Pattern-based prediction (uses historical time-of-day patterns)
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import statistics

from backend.src.database import traffic_store
from backend.src.traffic_analytics import analytics


class TrafficForecaster:
    """
    Forecasts traffic flows using historical data and simple time-series methods.
    """
    
    def __init__(self):
        self.store = traffic_store
        self.analytics = analytics
    
    def predict_next_30min(
        self,
        junction_id: str,
        direction: Optional[str] = None,
        method: str = 'pattern'
    ) -> Dict:
        """
        Predict traffic for the next 30 minutes.
        
        Args:
            junction_id: Junction to predict for
            direction: Traffic direction (None for all)
            method: Prediction method ('pattern', 'moving_avg', 'exponential')
        
        Returns:
            Dictionary with predicted traffic and confidence
        """
        if method == 'pattern':
            return self._predict_pattern_based(junction_id, direction, minutes_ahead=30)
        elif method == 'moving_avg':
            return self._predict_moving_average(junction_id, direction, minutes_ahead=30)
        elif method == 'exponential':
            return self._predict_exponential_smoothing(junction_id, direction, minutes_ahead=30)
        else:
            raise ValueError(f"Unknown prediction method: {method}")
    
    def predict_next_hour(
        self,
        junction_id: str,
        direction: Optional[str] = None,
        method: str = 'pattern'
    ) -> Dict:
        """
        Predict traffic for the next hour.
        
        Args:
            junction_id: Junction to predict for
            direction: Traffic direction (None for all)
            method: Prediction method
        
        Returns:
            Dictionary with predicted traffic and confidence
        """
        if method == 'pattern':
            return self._predict_pattern_based(junction_id, direction, minutes_ahead=60)
        elif method == 'moving_avg':
            return self._predict_moving_average(junction_id, direction, minutes_ahead=60)
        elif method == 'exponential':
            return self._predict_exponential_smoothing(junction_id, direction, minutes_ahead=60)
        else:
            raise ValueError(f"Unknown prediction method: {method}")
    
    def _predict_pattern_based(
        self,
        junction_id: str,
        direction: Optional[str],
        minutes_ahead: int
    ) -> Dict:
        """
        Predict based on historical time-of-day patterns.
        Most accurate for regular traffic patterns.
        """
        # Calculate target time
        target_time = datetime.now() + timedelta(minutes=minutes_ahead)
        target_day = target_time.weekday()
        target_hour = target_time.hour
        
        # Get historical average for target time
        historical = self.analytics.get_historical_average(
            junction_id=junction_id,
            day_of_week=target_day,
            hour=target_hour,
            direction=direction,
            days_back=30
        )
        
        if not historical or historical['sample_count'] < 3:
            return {
                'method': 'pattern',
                'predicted_pcu': None,
                'confidence': 'low',
                'reason': 'insufficient_historical_data',
                'target_time': target_time.isoformat(),
                'minutes_ahead': minutes_ahead
            }
        
        # Get recent trend (last 2 hours)
        recent_data = self.store.get_history(
            junction_id=junction_id,
            start_time=datetime.now() - timedelta(hours=2),
            end_time=datetime.now(),
            direction=direction,
            limit=100
        )
        
        # Calculate trend adjustment
        trend_factor = 1.0
        if len(recent_data) >= 10:
            recent_pcu = [r['total_pcu'] for r in recent_data[-10:]]
            older_pcu = [r['total_pcu'] for r in recent_data[:10]]
            
            if older_pcu and recent_pcu:
                recent_avg = statistics.mean(recent_pcu)
                older_avg = statistics.mean(older_pcu)
                
                if older_avg > 0:
                    trend_factor = recent_avg / older_avg
                    # Limit trend adjustment to ±30%
                    trend_factor = max(0.7, min(1.3, trend_factor))
        
        # Apply trend to historical average
        predicted_pcu = historical['avg_pcu'] * trend_factor
        
        # Determine confidence based on sample count and variance
        confidence = 'high' if historical['sample_count'] >= 10 else 'medium'
        
        return {
            'method': 'pattern',
            'predicted_pcu': round(predicted_pcu, 2),
            'historical_avg': round(historical['avg_pcu'], 2),
            'trend_factor': round(trend_factor, 2),
            'confidence': confidence,
            'sample_count': historical['sample_count'],
            'target_time': target_time.isoformat(),
            'minutes_ahead': minutes_ahead
        }
    
    def _predict_moving_average(
        self,
        junction_id: str,
        direction: Optional[str],
        minutes_ahead: int,
        window_hours: int = 2
    ) -> Dict:
        """
        Predict using simple moving average of recent data.
        Good for short-term predictions when traffic is stable.
        """
        # Get recent data
        recent_data = self.store.get_history(
            junction_id=junction_id,
            start_time=datetime.now() - timedelta(hours=window_hours),
            end_time=datetime.now(),
            direction=direction,
            limit=100
        )
        
        if len(recent_data) < 5:
            return {
                'method': 'moving_average',
                'predicted_pcu': None,
                'confidence': 'low',
                'reason': 'insufficient_recent_data',
                'minutes_ahead': minutes_ahead
            }
        
        # Calculate moving average
        pcu_values = [r['total_pcu'] for r in recent_data]
        predicted_pcu = statistics.mean(pcu_values)
        
        # Calculate confidence based on variance
        std_dev = statistics.stdev(pcu_values) if len(pcu_values) > 1 else 0
        coefficient_of_variation = (std_dev / predicted_pcu) if predicted_pcu > 0 else 1
        
        if coefficient_of_variation < 0.2:
            confidence = 'high'
        elif coefficient_of_variation < 0.4:
            confidence = 'medium'
        else:
            confidence = 'low'
        
        return {
            'method': 'moving_average',
            'predicted_pcu': round(predicted_pcu, 2),
            'std_deviation': round(std_dev, 2),
            'confidence': confidence,
            'sample_count': len(pcu_values),
            'window_hours': window_hours,
            'minutes_ahead': minutes_ahead
        }
    
    def _predict_exponential_smoothing(
        self,
        junction_id: str,
        direction: Optional[str],
        minutes_ahead: int,
        alpha: float = 0.3
    ) -> Dict:
        """
        Predict using exponential smoothing.
        Gives more weight to recent observations.
        """
        # Get recent data (last 3 hours)
        recent_data = self.store.get_history(
            junction_id=junction_id,
            start_time=datetime.now() - timedelta(hours=3),
            end_time=datetime.now(),
            direction=direction,
            limit=100
        )
        
        if len(recent_data) < 5:
            return {
                'method': 'exponential_smoothing',
                'predicted_pcu': None,
                'confidence': 'low',
                'reason': 'insufficient_recent_data',
                'minutes_ahead': minutes_ahead
            }
        
        # Sort by timestamp (oldest first)
        recent_data.sort(key=lambda x: x['timestamp'])
        pcu_values = [r['total_pcu'] for r in recent_data]
        
        # Apply exponential smoothing
        smoothed = pcu_values[0]
        for pcu in pcu_values[1:]:
            smoothed = alpha * pcu + (1 - alpha) * smoothed
        
        predicted_pcu = smoothed
        
        # Confidence based on recent stability
        recent_5 = pcu_values[-5:]
        std_dev = statistics.stdev(recent_5) if len(recent_5) > 1 else 0
        coefficient_of_variation = (std_dev / predicted_pcu) if predicted_pcu > 0 else 1
        
        if coefficient_of_variation < 0.2:
            confidence = 'high'
        elif coefficient_of_variation < 0.4:
            confidence = 'medium'
        else:
            confidence = 'low'
        
        return {
            'method': 'exponential_smoothing',
            'predicted_pcu': round(predicted_pcu, 2),
            'alpha': alpha,
            'confidence': confidence,
            'sample_count': len(pcu_values),
            'minutes_ahead': minutes_ahead
        }
    
    def predict_by_direction(
        self,
        junction_id: str,
        minutes_ahead: int = 30,
        method: str = 'pattern'
    ) -> Dict[str, Dict]:
        """
        Predict traffic for all directions at a junction.
        
        Args:
            junction_id: Junction to predict for
            minutes_ahead: Minutes into the future
            method: Prediction method
        
        Returns:
            Dictionary with predictions for each direction
        """
        directions = ['north', 'south', 'east', 'west']
        predictions = {}
        
        for direction in directions:
            if minutes_ahead <= 30:
                pred = self.predict_next_30min(junction_id, direction, method)
            else:
                pred = self.predict_next_hour(junction_id, direction, method)
            
            predictions[direction] = pred
        
        return predictions
    
    def get_forecast_confidence(
        self,
        junction_id: str,
        days_back: int = 30
    ) -> Dict:
        """
        Assess how confident we can be in forecasts for this junction.
        
        Args:
            junction_id: Junction to assess
            days_back: Days of history to analyze
        
        Returns:
            Dictionary with confidence assessment
        """
        # Check data availability
        record_count = self.store.get_record_count(junction_id)
        
        if record_count < 100:
            return {
                'overall_confidence': 'low',
                'reason': 'insufficient_data',
                'record_count': record_count,
                'recommendation': 'Collect more data before relying on forecasts'
            }
        
        # Check data consistency (time-of-day patterns)
        patterns = self.analytics.get_time_of_day_patterns(junction_id, days_back)
        
        # Count hours with sufficient data
        hours_with_data = sum(1 for p in patterns if p['sample_days'] >= 3)
        
        if hours_with_data < 12:
            confidence = 'low'
        elif hours_with_data < 20:
            confidence = 'medium'
        else:
            confidence = 'high'
        
        return {
            'overall_confidence': confidence,
            'record_count': record_count,
            'hours_with_data': hours_with_data,
            'total_hours': 24,
            'data_coverage_pct': round((hours_with_data / 24) * 100, 1),
            'recommendation': self._get_recommendation(confidence)
        }
    
    def _get_recommendation(self, confidence: str) -> str:
        """Get recommendation based on confidence level."""
        if confidence == 'high':
            return 'Forecasts are reliable. Use for proactive optimization.'
        elif confidence == 'medium':
            return 'Forecasts are moderately reliable. Use with caution.'
        else:
            return 'Forecasts may be unreliable. Collect more data or use current-only optimization.'


# Global instance
forecaster = TrafficForecaster()
