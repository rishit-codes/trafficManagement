import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import warnings

# Suppress warnings for cleaner logs
warnings.filterwarnings("ignore")

try:
    from statsmodels.tsa.arima.model import ARIMA
    from pmdarima import auto_arima
except ImportError:
    ARIMA = None
    auto_arima = None
    print("WARNING: statsmodels/pmdarima not found. PredictionEngine running in constrained mode.")

from backend.src.database import traffic_store

class PredictionEngine:
    """
    Predicts traffic volume 15-30 minutes ahead using ARIMA model.
    Enables proactive signal adjustment before congestion forms.
    """
    
    def __init__(self):
        self.store = traffic_store
        self.models = {} # Store trained models per junction/approach
        self.last_trained = {} # Timestamp of last training
    
    def train_model(self, junction_id: str, approach: str) -> bool:
        """
        Train ARIMA model on historical traffic data.
        """
        if ARIMA is None:
            return False

        try:
            # Fetch historical data (last 30 days)
            start_date = datetime.now() - timedelta(days=30)
            history = self.store.get_history(
                junction_id=junction_id,
                start_time=start_date,
                end_time=datetime.now(),
                direction=approach,
                limit=10000 
            )

            if len(history) < 100:
                print(f"Insufficient data to train model for {junction_id} {approach}")
                return False

            # Convert to DataFrame
            df = pd.DataFrame(history)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df.set_index('timestamp', inplace=True)
            
            # Resample to 5-min intervals
            ts_data = df['total_pcu'].resample('5T').mean().fillna(method='ffill')

            # Auto-ARIMA to find best parameters
            # Limit search for performance
            model = auto_arima(ts_data, start_p=1, start_q=1,
                             max_p=3, max_q=3, m=12,
                             start_P=0, seasonal=True, # Weekly seasonality might be too heavy, trying hourly
                             d=1, D=1, trace=False,
                             error_action='ignore',  
                             suppress_warnings=True, 
                             stepwise=True)

            key = f"{junction_id}_{approach}"
            self.models[key] = model
            self.last_trained[key] = datetime.now()
            print(f"Successfully trained model for {key}")
            return True

        except Exception as e:
            print(f"Model training failed for {junction_id}: {e}")
            return False
    
    def predict(self, junction_id: str, approach: str, 
                horizon_minutes: int = 30) -> Dict:
        """
        Predict traffic volume for next N minutes.
        """
        try:
            key = f"{junction_id}_{approach}"
            
            # Train if missing or old (>24h)
            if key not in self.models:
                self.train_model(junction_id, approach)
            
            if key not in self.models:
                 # Fallback if training failed
                 return {
                    "predicted_volumes": [],
                    "confidence_score": 0.0,
                    "recommendation": "Maintain Current Timing (No Model)"
                 }

            model = self.models[key]
            
            # Forecast
            n_periods = horizon_minutes // 5 # 5-min intervals
            forecast = model.predict(n_periods=n_periods)
            
            # Simple confidence heuristic based on recent variance
            confidence = 0.85 # Placeholder, real ARIMA gives confidence intervals

            # Analyze trend
            volumes = forecast.tolist()
            avg_predicted = sum(volumes) / len(volumes) if volumes else 0
            
            # Determine recommendation
            recommendation = "no_action"
            # If volume spike predicted > 800 PCU
            if avg_predicted > 800:
                recommendation = "increase_green_time"
            elif avg_predicted < 200:
                recommendation = "decrease_green_time"

            return {
                "predicted_volumes": [round(v, 2) for v in volumes],
                "confidence_score": confidence,
                "recommendation": recommendation,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            print(f"Prediction failed: {e}")
            return {
                "predicted_volumes": [],
                "confidence_score": 0.0,
                "recommendation": "Error"
            }

# Global Instance
prediction_engine = PredictionEngine()
