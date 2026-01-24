"""
Vision Module
YOLOv8 integration for vehicle detection, classification, and queue estimation.

Uses pre-trained COCO weights (zero training required).
Optimized for CPU inference with acceptable latency (<200ms).
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import time

# Try importing ultralytics, provide helpful error if missing
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("Warning: ultralytics not installed. Run: pip install ultralytics")

# Import PCU converter
try:
    from .pcu_converter import PCUConverter
except ImportError:
    from pcu_converter import PCUConverter


# COCO classes relevant to traffic
TRAFFIC_CLASSES = {
    2: "car",
    3: "motorcycle", 
    5: "bus",
    7: "truck",
    1: "bicycle",
    0: "person"
}

# Reverse mapping for quick lookup
CLASS_NAMES_TO_ID = {v: k for k, v in TRAFFIC_CLASSES.items()}


@dataclass
class DetectionResult:
    """Result from a single frame detection."""
    vehicle_counts: Dict[str, int]
    total_pcu: float
    queue_length_estimate: int  # Estimated vehicles in queue
    inference_time_ms: float
    frame_timestamp: float
    
    def to_dict(self) -> Dict:
        return {
            "vehicle_counts": self.vehicle_counts,
            "total_pcu": self.total_pcu,
            "queue_length_estimate": self.queue_length_estimate,
            "inference_time_ms": round(self.inference_time_ms, 1),
            "timestamp": self.frame_timestamp
        }


class VisionModule:
    """
    YOLOv8-based vehicle detection and traffic analysis.
    Designed for low-latency CPU inference.
    """
    
    def __init__(
        self,
        model_path: str = "yolov8n.pt",  # Nano model for speed
        confidence_threshold: float = 0.6,
        device: str = "cpu"
    ):
        """
        Initialize vision module.
        
        Args:
            model_path: Path to YOLO weights (or model name to auto-download)
            confidence_threshold: Min confidence for detections
            device: 'cpu' or 'cuda' (GPU)
        """
        self.confidence_threshold = confidence_threshold
        self.device = device
        self.pcu_converter = PCUConverter()
        
        if not YOLO_AVAILABLE:
            raise RuntimeError("ultralytics package not installed. Run: pip install ultralytics")
        
        # Load YOLO model
        print(f"Loading YOLO model: {model_path} on {device}...")
        self.model = YOLO(model_path)
        print("Model loaded successfully!")
    
    def process_frame(
        self,
        frame: np.ndarray,
        roi: Optional[Tuple[int, int, int, int]] = None  # (x1, y1, x2, y2)
    ) -> DetectionResult:
        """
        Process a single frame and return detection results.
        
        Args:
            frame: BGR image from OpenCV
            roi: Optional region of interest to crop
        
        Returns:
            DetectionResult with counts, PCU, queue estimate
        """
        start_time = time.time()
        
        # Crop to ROI if specified
        if roi:
            x1, y1, x2, y2 = roi
            frame = frame[y1:y2, x1:x2]
        
        # Run inference with optimizations
        # - classes: Only detect traffic objects (filters internal NMS)
        # - imgsz: Fixed size for consistent speed (640 is standard)
        results = self.model(
            frame,
            conf=self.confidence_threshold,
            device=self.device,
            classes=list(TRAFFIC_CLASSES.keys()),
            imgsz=640,
            agnostic_nms=True,  # Critical: Prevent Car+Truck double detection on same object
            iou=0.5,            # Stricter overlap cleaning for exact counts
            verbose=False
        )[0]
        
        # Count vehicles by type
        vehicle_counts = {name: 0 for name in TRAFFIC_CLASSES.values()}
        boxes = []
        
        for box in results.boxes:
            cls_id = int(box.cls[0])
            if cls_id in TRAFFIC_CLASSES:
                vehicle_type = TRAFFIC_CLASSES[cls_id]
                vehicle_counts[vehicle_type] += 1
                boxes.append({
                    "type": vehicle_type,
                    "bbox": box.xyxy[0].tolist(),
                    "confidence": float(box.conf[0])
                })
        
        # Remove zero counts for cleaner output
        vehicle_counts = {k: v for k, v in vehicle_counts.items() if v > 0}
        
        # Calculate PCU
        total_pcu = self.pcu_converter.convert(vehicle_counts)
        
        # Estimate queue length (simplified: count of stopped/slow vehicles)
        queue_estimate = self._estimate_queue_length(boxes, frame.shape)
        
        inference_time = (time.time() - start_time) * 1000  # ms
        
        return DetectionResult(
            vehicle_counts=vehicle_counts,
            total_pcu=total_pcu,
            queue_length_estimate=queue_estimate,
            inference_time_ms=inference_time,
            frame_timestamp=time.time()
        )
    
    def _estimate_queue_length(
        self,
        boxes: List[Dict],
        frame_shape: Tuple[int, int, int]
    ) -> int:
        """
        Estimate queue length from detected vehicles.
        Simple heuristic: vehicles in bottom half of frame are likely queued.
        """
        if not boxes or frame_shape[0] == 0 or frame_shape[1] == 0:
            return 0
        
        height = frame_shape[0]
        queue_zone_y = height * 0.4  # Bottom 60% is queue zone
        
        queue_count = 0
        for box in boxes:
            y_center = (box["bbox"][1] + box["bbox"][3]) / 2
            if y_center > queue_zone_y and box["type"] in ["car", "bus", "truck", "motorcycle"]:
                queue_count += 1
        
        return queue_count
    
    def process_video(
        self,
        video_path: str,
        sample_interval_s: float = 5.0,
        max_frames: int = 100
    ) -> List[DetectionResult]:
        """
        Process video file and return detections at intervals.
        
        Args:
            video_path: Path to video file
            sample_interval_s: Seconds between frame samples
            max_frames: Maximum frames to process
        
        Returns:
            List of DetectionResult for sampled frames
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = int(fps * sample_interval_s)
        
        results = []
        frame_count = 0
        processed = 0
        
        print(f"Processing video: {video_path} (FPS: {fps}, sampling every {sample_interval_s}s)")
        
        while processed < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_interval == 0:
                result = self.process_frame(frame)
                results.append(result)
                processed += 1
                print(f"  Frame {frame_count}: {result.vehicle_counts}, PCU={result.total_pcu:.1f}, time={result.inference_time_ms:.1f}ms")
            
            frame_count += 1
        
        cap.release()
        print(f"Processed {processed} frames from video")
        return results
    
    def process_rtsp_stream(
        self,
        rtsp_url: str,
        callback: callable,
        sample_interval_s: float = 5.0,
        duration_s: float = 60.0
    ) -> None:
        """
        Process RTSP camera stream with callback.
        
        Args:
            rtsp_url: RTSP stream URL
            callback: Function to call with each DetectionResult
            sample_interval_s: Seconds between samples
            duration_s: Total duration to process
        """
        cap = cv2.VideoCapture(rtsp_url)
        if not cap.isOpened():
            raise ValueError(f"Could not connect to stream: {rtsp_url}")
        
        start_time = time.time()
        last_sample = 0
        
        print(f"Connected to stream: {rtsp_url}")
        
        while (time.time() - start_time) < duration_s:
            ret, frame = cap.read()
            if not ret:
                print("Stream read failed, reconnecting...")
                time.sleep(1)
                continue
            
            current_time = time.time()
            if (current_time - last_sample) >= sample_interval_s:
                result = self.process_frame(frame)
                callback(result)
                last_sample = current_time
        
        cap.release()
        print("Stream processing complete")
    
    def draw_detections(
        self,
        frame: np.ndarray,
        result: DetectionResult
    ) -> np.ndarray:
        """Draw bounding boxes on frame (for visualization/demo)."""
        # This is a simplified visualization
        # Full implementation would overlay boxes from YOLO results
        annotated = frame.copy()
        
        # Add text overlay
        y_pos = 30
        cv2.putText(annotated, f"PCU: {result.total_pcu:.1f}", (10, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        y_pos += 30
        cv2.putText(annotated, f"Queue: ~{result.queue_length_estimate} vehicles", (10, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        y_pos += 30
        cv2.putText(annotated, f"Inference: {result.inference_time_ms:.0f}ms", (10, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 200, 0), 1)
        
        return annotated


def test_with_image(image_path: str):
    """Quick test with a single image."""
    vision = VisionModule()
    frame = cv2.imread(image_path)
    if frame is None:
        print(f"Could not load image: {image_path}")
        return
    
    result = vision.process_frame(frame)
    print(f"\nResults for {image_path}:")
    print(f"  Vehicles: {result.vehicle_counts}")
    print(f"  Total PCU: {result.total_pcu}")
    print(f"  Queue estimate: {result.queue_length_estimate}")
    print(f"  Inference time: {result.inference_time_ms:.1f}ms")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Traffic Vision Module")
    parser.add_argument("--video", type=str, help="Path to video file")
    parser.add_argument("--image", type=str, help="Path to image file")
    parser.add_argument("--interval", type=float, default=5.0, help="Sample interval in seconds")
    
    args = parser.parse_args()
    
    if args.image:
        test_with_image(args.image)
    elif args.video:
        vision = VisionModule()
        results = vision.process_video(args.video, sample_interval_s=args.interval)
        
        # Summary statistics
        if results:
            avg_pcu = sum(r.total_pcu for r in results) / len(results)
            avg_time = sum(r.inference_time_ms for r in results) / len(results)
            print(f"\n=== Summary ===")
            print(f"Frames processed: {len(results)}")
            print(f"Average PCU: {avg_pcu:.1f}")
            print(f"Average inference time: {avg_time:.1f}ms")
    else:
        print("Testing module initialization...")
        if YOLO_AVAILABLE:
            vision = VisionModule()
            print("VisionModule initialized successfully!")
            print("Usage: python vision_module.py --video <path> or --image <path>")
        else:
            print("Install ultralytics first: pip install ultralytics")
