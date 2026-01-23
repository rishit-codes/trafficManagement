import time
from typing import List, Dict, Optional
from datetime import datetime

class VisionMetricsCollector:
    """
    Collects runtime performance metrics for the vision system.
    Designed for production use: NO fake accuracy, NO random generation.
    """
    _instance = None

    def __init__(self):
        self.reset()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = VisionMetricsCollector()
        return cls._instance

    def reset(self):
        """Reset all metrics to initial state."""
        self.model_name = "YOLOv8n"
        self.total_frames = 0
        self.total_inference_time_ms = 0.0
        self.start_time = time.time()
        self.last_updated = datetime.now()
        self.classes_detected: Dict[str, int] = {}
        self.is_real_time = True  # Default assumption until proven otherwise

    def update(self, inference_time_ms: float, detections: List[str]):
        """
        Update metrics with a new frame's data.
        
        Args:
            inference_time_ms: Time taken for inference in milliseconds.
            detections: List of class names detected in the frame.
        """
        self.total_frames += 1
        self.total_inference_time_ms += inference_time_ms
        self.last_updated = datetime.now()
        
        # Update class distribution
        for cls_name in detections:
            self.classes_detected[cls_name] = self.classes_detected.get(cls_name, 0) + 1
            
        # Update real-time status (simple heuristic: < 100ms per frame implies > 10 FPS)
        self.is_real_time = inference_time_ms < 100.0

    def get_metrics(self) -> Dict:
        """Return a snapshot of current metrics."""
        avg_inference = 0.0
        avg_fps = 0.0
        
        if self.total_frames > 0:
            avg_inference = self.total_inference_time_ms / self.total_frames
            
            # FPS based on total runtime
            elapsed = time.time() - self.start_time
            if elapsed > 0:
                avg_fps = self.total_frames / elapsed

        return {
            "model": self.model_name,
            "avg_fps": round(avg_fps, 1),
            "avg_inference_time_ms": round(avg_inference, 1),
            "frames_processed": self.total_frames,
            "vehicle_classes": list(self.classes_detected.keys()),
            "real_time_capable": self.is_real_time,
            "last_updated": self.last_updated.isoformat()
        }

# Global instance
vision_collector = VisionMetricsCollector.get_instance()
