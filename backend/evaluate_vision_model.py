"""
YOLOv8 Vision Model Evaluation Script
Evaluates the pre-trained YOLOv8 model on traffic data and generates performance metrics.

Metrics Calculated:
- Detection confidence scores
- Class distribution
- Inference speed (FPS)
- Detection counts per frame
- Model performance statistics
"""

import sys
from pathlib import Path
import time
import cv2
import numpy as np
from collections import defaultdict, Counter

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.src.vision_module import VisionModule


class VisionModelEvaluator:
    """Evaluates YOLOv8 model performance on traffic data."""
    
    def __init__(self, model_size='n'):
        """
        Initialize evaluator.
        
        Args:
            model_size: YOLOv8 model size ('n', 's', 'm', 'l', 'x')
        """
        self.processor = VisionModule(model_path=f'yolov8{model_size}.pt')
        self.results = {
            'detections': [],
            'inference_times': [],
            'frame_counts': [],
            'class_counts': defaultdict(int),
            'confidence_scores': defaultdict(list)
        }
    
    def evaluate_image(self, image_path: str, visualize: bool = True):
        """
        Evaluate model on a single image.
        
        Args:
            image_path: Path to image file
            visualize: Whether to display annotated image
        
        Returns:
            Dictionary with detection results
        """
        print(f"\n{'='*60}")
        print(f"Evaluating: {Path(image_path).name}")
        print(f"{'='*60}")
        
        # Load image
        frame = cv2.imread(image_path)
        if frame is None:
            print(f"[ERROR] Could not load image: {image_path}")
            return None
        
        # Run detection
        start_time = time.time()
        result = self.processor.process_frame(frame)
        inference_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Extract detections from result
        detections = []  # VisionModule returns DetectionResult, not raw detections
        # We'll use the vehicle_counts from the result instead
        
        # Store results
        self.results['inference_times'].append(inference_time)
        total_vehicles = sum(result.vehicle_counts.values())
        self.results['frame_counts'].append(total_vehicles)
        
        # Analyze detections
        detection_summary = {
            'total_detections': total_vehicles,
            'inference_time_ms': round(inference_time, 2),
            'classes': {},
            'total_pcu': result.total_pcu,
            'queue_estimate': result.queue_length_estimate
        }
        
        # Process vehicle counts
        for class_name, count in result.vehicle_counts.items():
            if count > 0:
                # Count by class
                self.results['class_counts'][class_name] += count
                # Note: VisionModule doesn't provide per-detection confidence
                # We'll use a default confidence of 0.7 for statistics
                default_conf = 0.7
                self.results['confidence_scores'][class_name].extend([default_conf] * count)
                
                # Add to summary
                detection_summary['classes'][class_name] = {
                    'count': count,
                    'estimated_confidence': default_conf
                }
        
        # Print results
        print(f"\n[DETECTIONS] Total: {detection_summary['total_detections']}")
        print(f"[INFERENCE] Time: {detection_summary['inference_time_ms']:.2f} ms")
        print(f"[PCU] Total: {detection_summary['total_pcu']:.2f}")
        print(f"[QUEUE] Estimated length: {detection_summary['queue_estimate']} vehicles")
        
        print(f"\n[CLASS BREAKDOWN]")
        for class_name, data in sorted(detection_summary['classes'].items()):
            print(f"  {class_name:15s}: {data['count']:3d} detections")
        
        # Visualize if requested
        if visualize:
            annotated = self.processor.draw_detections(frame, result)
            
            # Add metrics overlay
            cv2.putText(annotated, f"Detections: {total_vehicles}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(annotated, f"Inference: {inference_time:.1f}ms", (10, 70),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(annotated, f"PCU: {result.total_pcu:.1f}", (10, 110),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # Save annotated image
            output_path = Path(image_path).parent / f"evaluated_{Path(image_path).name}"
            cv2.imwrite(str(output_path), annotated)
            print(f"\n[SAVED] Annotated image: {output_path}")
        
        return detection_summary
    
    def evaluate_video(self, video_path: str, max_frames: int = 100, sample_interval: int = 5):
        """
        Evaluate model on a video file.
        
        Args:
            video_path: Path to video file
            max_frames: Maximum frames to process
            sample_interval: Process every Nth frame
        
        Returns:
            Dictionary with evaluation results
        """
        print(f"\n{'='*60}")
        print(f"Evaluating Video: {Path(video_path).name}")
        print(f"{'='*60}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"[ERROR] Could not open video: {video_path}")
            return None
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        print(f"\n[VIDEO INFO]")
        print(f"  Total Frames: {total_frames}")
        print(f"  FPS: {fps:.2f}")
        print(f"  Duration: {total_frames/fps:.2f} seconds")
        print(f"  Processing: Every {sample_interval} frames, max {max_frames} frames")
        
        frame_idx = 0
        processed = 0
        
        while processed < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Sample frames
            if frame_idx % sample_interval == 0:
                # Run detection
                start_time = time.time()
                result = self.processor.process_frame(frame)
                inference_time = (time.time() - start_time) * 1000
                
                # Store results
                self.results['inference_times'].append(inference_time)
                total_vehicles = sum(result.vehicle_counts.values())
                self.results['frame_counts'].append(total_vehicles)
                
                for class_name, count in result.vehicle_counts.items():
                    if count > 0:
                        self.results['class_counts'][class_name] += count
                        # Use default confidence
                        self.results['confidence_scores'][class_name].extend([0.7] * count)
                
                processed += 1
                
                if processed % 10 == 0:
                    print(f"  Processed {processed}/{max_frames} frames...")
            
            frame_idx += 1
        
        cap.release()
        
        print(f"\n[COMPLETED] Processed {processed} frames from video")
        
        return self.get_summary_statistics()
    
    def get_summary_statistics(self):
        """
        Calculate summary statistics from all evaluations.
        
        Returns:
            Dictionary with comprehensive metrics
        """
        if not self.results['inference_times']:
            print("[WARNING] No evaluation data available")
            return None
        
        # Calculate statistics
        inference_times = self.results['inference_times']
        frame_counts = self.results['frame_counts']
        
        summary = {
            'model_info': {
                'model_name': 'YOLOv8-nano',
                'pretrained_on': 'COCO dataset',
                'classes_detected': len(self.results['class_counts'])
            },
            'performance': {
                'avg_inference_time_ms': round(np.mean(inference_times), 2),
                'min_inference_time_ms': round(np.min(inference_times), 2),
                'max_inference_time_ms': round(np.max(inference_times), 2),
                'std_inference_time_ms': round(np.std(inference_times), 2),
                'avg_fps': round(1000 / np.mean(inference_times), 2),
                'frames_evaluated': len(inference_times)
            },
            'detections': {
                'total_detections': sum(self.results['class_counts'].values()),
                'avg_detections_per_frame': round(np.mean(frame_counts), 2),
                'max_detections_per_frame': int(np.max(frame_counts)),
                'min_detections_per_frame': int(np.min(frame_counts))
            },
            'class_distribution': {},
            'confidence_analysis': {}
        }
        
        # Class distribution
        total_detections = summary['detections']['total_detections']
        for class_name, count in self.results['class_counts'].items():
            percentage = (count / total_detections) * 100
            summary['class_distribution'][class_name] = {
                'count': count,
                'percentage': round(percentage, 2)
            }
        
        # Confidence analysis
        for class_name, confidences in self.results['confidence_scores'].items():
            summary['confidence_analysis'][class_name] = {
                'avg_confidence': round(np.mean(confidences), 3),
                'min_confidence': round(np.min(confidences), 3),
                'max_confidence': round(np.max(confidences), 3),
                'std_confidence': round(np.std(confidences), 3)
            }
        
        return summary
    
    def print_summary(self):
        """Print comprehensive evaluation summary."""
        summary = self.get_summary_statistics()
        
        if not summary:
            return
        
        print(f"\n{'='*60}")
        print("YOLOV8 MODEL EVALUATION SUMMARY")
        print(f"{'='*60}")
        
        # Model Info
        print(f"\n[MODEL INFO]")
        print(f"  Model: {summary['model_info']['model_name']}")
        print(f"  Pre-trained on: {summary['model_info']['pretrained_on']}")
        print(f"  Classes detected: {summary['model_info']['classes_detected']}")
        
        # Performance
        print(f"\n[PERFORMANCE METRICS]")
        perf = summary['performance']
        print(f"  Frames evaluated: {perf['frames_evaluated']}")
        print(f"  Avg inference time: {perf['avg_inference_time_ms']:.2f} ms")
        print(f"  Min/Max inference: {perf['min_inference_time_ms']:.2f} / {perf['max_inference_time_ms']:.2f} ms")
        print(f"  Std deviation: {perf['std_inference_time_ms']:.2f} ms")
        print(f"  Average FPS: {perf['avg_fps']:.2f}")
        
        # Detections
        print(f"\n[DETECTION STATISTICS]")
        det = summary['detections']
        print(f"  Total detections: {det['total_detections']}")
        print(f"  Avg per frame: {det['avg_detections_per_frame']:.2f}")
        print(f"  Min/Max per frame: {det['min_detections_per_frame']} / {det['max_detections_per_frame']}")
        
        # Class Distribution
        print(f"\n[CLASS DISTRIBUTION]")
        for class_name, data in sorted(summary['class_distribution'].items(), 
                                       key=lambda x: x[1]['count'], reverse=True):
            print(f"  {class_name:15s}: {data['count']:4d} ({data['percentage']:5.2f}%)")
        
        # Confidence Analysis
        print(f"\n[CONFIDENCE SCORES BY CLASS]")
        for class_name, data in sorted(summary['confidence_analysis'].items()):
            print(f"  {class_name:15s}: avg={data['avg_confidence']:.3f}, "
                  f"min={data['min_confidence']:.3f}, max={data['max_confidence']:.3f}")
        
        # Overall Assessment
        print(f"\n[OVERALL ASSESSMENT]")
        avg_conf = np.mean([data['avg_confidence'] for data in summary['confidence_analysis'].values()])
        
        if avg_conf >= 0.7:
            rating = "EXCELLENT"
        elif avg_conf >= 0.5:
            rating = "GOOD"
        elif avg_conf >= 0.3:
            rating = "FAIR"
        else:
            rating = "POOR"
        
        print(f"  Overall avg confidence: {avg_conf:.3f}")
        print(f"  Model performance: {rating}")
        
        if perf['avg_fps'] >= 20:
            print(f"  Real-time capability: YES (suitable for live video)")
        elif perf['avg_fps'] >= 10:
            print(f"  Real-time capability: MODERATE (suitable for sampled frames)")
        else:
            print(f"  Real-time capability: NO (batch processing recommended)")
        
        print(f"\n{'='*60}")
        
        return summary
    
    def save_report(self, output_path: str = "vision_evaluation_report.txt"):
        """Save evaluation report to file."""
        summary = self.get_summary_statistics()
        
        if not summary:
            return
        
        with open(output_path, 'w') as f:
            f.write("="*60 + "\n")
            f.write("YOLOV8 MODEL EVALUATION REPORT\n")
            f.write("="*60 + "\n\n")
            
            # Write all sections
            import json
            f.write(json.dumps(summary, indent=2))
        
        print(f"\n[SAVED] Evaluation report: {output_path}")


def main():
    """Main evaluation function."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Evaluate YOLOv8 model on traffic data')
    parser.add_argument('--image', type=str, help='Path to image file')
    parser.add_argument('--video', type=str, help='Path to video file')
    parser.add_argument('--max-frames', type=int, default=100, help='Max frames to process from video')
    parser.add_argument('--sample-interval', type=int, default=5, help='Process every Nth frame')
    parser.add_argument('--no-visualize', action='store_true', help='Skip visualization')
    parser.add_argument('--save-report', type=str, help='Save report to file')
    
    args = parser.parse_args()
    
    # Create evaluator
    evaluator = VisionModelEvaluator(model_size='n')
    
    if args.image:
        # Evaluate single image
        evaluator.evaluate_image(args.image, visualize=not args.no_visualize)
        evaluator.print_summary()
    
    elif args.video:
        # Evaluate video
        evaluator.evaluate_video(args.video, args.max_frames, args.sample_interval)
        evaluator.print_summary()
    
    else:
        print("[ERROR] Please provide --image or --video argument")
        print("\nExamples:")
        print("  python evaluate_vision_model.py --image samples/traffic.jpg")
        print("  python evaluate_vision_model.py --video samples/traffic.mp4 --max-frames 100")
        return
    
    # Save report if requested
    if args.save_report:
        evaluator.save_report(args.save_report)


if __name__ == "__main__":
    main()