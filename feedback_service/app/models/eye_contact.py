import cv2
import numpy as np
import mediapipe as mp
from concurrent.futures import ProcessPoolExecutor
import logging

logger = logging.getLogger(__name__)

class EyeContactAnalyzer:
    def __init__(self, resize_factor: float = 0.5):
        self.resize_factor = resize_factor
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False, max_num_faces=1, refine_landmarks=True
        )
        self.attention_zones = {
            'center': {'weight': 1.0},
            'left': {'weight': 0.7},
            'right': {'weight': 0.7},
            'up': {'weight': 0.4},
            'down': {'weight': 0.2},
            'unknown': {'weight': 0.5}
        }

    def analyze_eye_contact(self, video_path: str, sample_rate: float = 1.0):
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return {"error": f"Could not open video: {video_path}"}

            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frame_interval = max(1, int(fps / sample_rate))
            results = []

            frame_number = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_number % frame_interval == 0:
                    if self.resize_factor < 1.0:
                        frame = cv2.resize(
                            frame,
                            (int(frame.shape[1] * self.resize_factor), int(frame.shape[0] * self.resize_factor))
                        )
                    timestamp = frame_number / fps
                    analysis = self._analyze_frame(frame, timestamp)
                    if analysis:
                        results.append(analysis)
                frame_number += 1

            cap.release()
            return self._process_eye_contact_results(results, fps, total_frames)
        except Exception as e:
            logger.error(f"Error in eye contact analysis: {e}")
            return {
                "error": str(e),
                "attention_score": 0.0,
                "confidence_metrics": {"average_confidence": 0.0},
                "presentation_patterns": {"pattern_quality_score": 0.0}
            }

    def _analyze_frame(self, frame: np.ndarray, timestamp: float):
        try:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = self.face_mesh.process(rgb)

            if not result.multi_face_landmarks:
                return {
                    "timestamp": timestamp,
                    "pupils_detected": False,
                    "attention_zone": "no_face",
                    "engagement_score": 0.0
                }

            face = result.multi_face_landmarks[0]
            left_eye_indices = [33, 133]
            right_eye_indices = [362, 263]
            ih, iw = frame.shape[:2]
            left_eye = [(int(face.landmark[i].x * iw), int(face.landmark[i].y * ih)) for i in left_eye_indices]
            right_eye = [(int(face.landmark[i].x * iw), int(face.landmark[i].y * ih)) for i in right_eye_indices]
            left_center_x = (left_eye[0][0] + left_eye[1][0]) // 2
            right_center_x = (right_eye[0][0] + right_eye[1][0]) // 2
            face_center_x = (left_center_x + right_center_x) // 2
            frame_center_x = iw // 2
            deviation = face_center_x - frame_center_x
            threshold = iw * 0.12

            if abs(deviation) < threshold:
                zone = "center"
            elif deviation > 0:
                zone = "left"
            else:
                zone = "right"

            weight = self.attention_zones.get(zone, {'weight': 0.5})['weight']
            score = round(min(weight * 10, 10.0), 2)

            return {
                "timestamp": timestamp,
                "pupils_detected": True,
                "attention_zone": zone,
                "engagement_score": score,
                "eye_centers": {
                    "left": left_eye,
                    "right": right_eye
                }
            }
        except Exception as e:
            logger.error(f"MediaPipe frame analysis error at {timestamp:.2f}s: {e}")
            return None

    def _process_eye_contact_results(self, results, fps, total_frames):
        if not results:
            return {
                "error": "No eye contact data could be analyzed",
                "attention_score": 0.0,
                "confidence_metrics": {"average_confidence": 0.0},
                "presentation_patterns": {"pattern_quality_score": 0.0}
            }
        valid_scores = [r["engagement_score"] for r in results if r.get("pupils_detected", False)]
        attention_score = np.mean(valid_scores) if valid_scores else 0.0
        center_attention = [r for r in results if r.get("attention_zone") == "center"]
        center_ratio = len(center_attention) / len(results) if results else 0.0
        average_confidence = center_ratio * 10.0
        zones = [r.get("attention_zone", "unknown") for r in results]
        zone_counts = {}
        for zone in zones:
            zone_counts[zone] = zone_counts.get(zone, 0) + 1
        pattern_quality_score = (zone_counts.get("center", 0) / len(results)) * 10.0 if results else 0.0
        engagement_metrics = {
            "total_frames_analyzed": len(results),
            "frames_with_face": len([r for r in results if r.get("pupils_detected", False)]),
            "face_detection_rate": len([r for r in results if r.get("pupils_detected", False)]) / len(results) if results else 0.0,
            "average_engagement_score": attention_score,
            "zone_distribution": zone_counts
        }
        return {
            "attention_score": float(attention_score),
            "confidence_metrics": {
                "average_confidence": float(average_confidence),
                "center_attention_ratio": float(center_ratio)
            },
            "presentation_patterns": {
                "pattern_quality_score": float(pattern_quality_score),
                "zone_distribution": zone_counts
            },
            "engagement_metrics": engagement_metrics,
            "raw_data": results[:10]
        }
