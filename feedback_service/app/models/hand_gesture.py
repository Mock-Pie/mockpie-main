import cv2
import numpy as np
import mediapipe as mp
import logging
import math
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class HandGestureDetector:
    """
    Enhanced Hand Gesture Detection for Presentation Analysis.
    Uses MediaPipe Hands with gesture classification and engagement metrics.
    """

    def __init__(self, frame_sample_rate: int = 10):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.frame_sample_rate = frame_sample_rate

        # Gesture definitions
        self.presentation_gestures = {
            'open_palm': {'effectiveness': 8, 'description': 'Open, welcoming gesture'},
            'pointing': {'effectiveness': 6, 'description': 'Directional emphasis'},
            'counting': {'effectiveness': 9, 'description': 'Enumeration gesture'},
            'descriptive': {'effectiveness': 9, 'description': 'Size/shape illustration'},
            'emphasis': {'effectiveness': 8, 'description': 'Rhythmic emphasis'},
            'peace_or_two': {'effectiveness': 5, 'description': 'Basic counting gesture'},
            'fist': {'effectiveness': 4, 'description': 'Closed, possibly tense'},
            'thumbs_up': {'effectiveness': 7, 'description': 'Positive reinforcement'},
            'unknown': {'effectiveness': 3, 'description': 'Unclear gesture'}
        }

    def analyze(self, video_path: str) -> Dict[str, Any]:
        try:
            gesture_data = []
            cap = cv2.VideoCapture(video_path)
            frame_count = 0
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_count % self.frame_sample_rate == 0:
                    timestamp = frame_count / fps if fps > 0 else frame_count
                    result = self._analyze_frame(frame, timestamp)
                    if result:
                        gesture_data.append(result)
                frame_count += 1
            cap.release()

            if not gesture_data:
                return {
                    "error": "No hands detected",
                    "gesture_statistics": {},
                    "engagement_metrics": {"gesture_usage": "none"},
                    "overall_score": 3.0,
                    "recommendations": ["Practice using hand gestures to enhance your presentation"]
                }

            gesture_stats = self._calculate_statistics(gesture_data)
            engagement_metrics = self._calculate_engagement(gesture_stats, duration)
            effectiveness_analysis = self._analyze_effectiveness(gesture_data)
            temporal_patterns = self._analyze_temporal_patterns(gesture_data)
            overall_score = self._calculate_overall_score(
                engagement_metrics, effectiveness_analysis, temporal_patterns
            )
            recommendations = self._generate_recommendations(
                gesture_stats, engagement_metrics, effectiveness_analysis, temporal_patterns
            )
            return {
                "gesture_statistics": gesture_stats,
                "engagement_metrics": engagement_metrics,
                "effectiveness_analysis": effectiveness_analysis,
                "temporal_patterns": temporal_patterns,
                "overall_score": float(overall_score),
                "gesture_effectiveness": effectiveness_analysis.get("average_effectiveness", 5.0),
                "total_analyzed_frames": len(gesture_data),
                "analysis_duration": duration,
                "recommendations": recommendations,
            }
        except Exception as e:
            logger.error(f"Error in hand gesture analysis: {e}")
            return {
                "error": str(e),
                "gesture_statistics": {},
                "overall_score": 5.0,
                "recommendations": ["Unable to analyze gestures due to technical error"]
            }

    def _analyze_frame(self, frame: np.ndarray, timestamp: float) -> Dict[str, Any]:
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.hands.process(rgb_frame)
            if not results.multi_hand_landmarks:
                return None
            frame_height, frame_width = frame.shape[:2]
            hands_data = []
            for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                hand_info = {
                    "handedness": handedness.classification[0].label,
                    "confidence": handedness.classification[0].score,
                    "landmarks": [[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark]
                }
                gesture_analysis = self._classify_gesture(hand_landmarks, frame_width, frame_height)
                hand_info.update(gesture_analysis)
                gesture_zone = self._gesture_zone(hand_landmarks)
                hand_info["gesture_zone"] = gesture_zone
                hands_data.append(hand_info)
            return {
                "timestamp": timestamp,
                "hands_detected": len(hands_data),
                "hands_data": hands_data,
                "frame_effectiveness": np.mean([h.get("effectiveness_score", 5) for h in hands_data])
            }
        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            return None

    def _classify_gesture(self, hand_landmarks, frame_width: int, frame_height: int) -> Dict[str, Any]:
        try:
            landmarks = hand_landmarks.landmark
            fingertips = [4, 8, 12, 16, 20]
            pips = [3, 6, 10, 14, 18]
            mcp = [2, 5, 9, 13, 17]
            extended_fingers = []
            finger_angles = []
            # Thumb logic (x-axis)
            thumb_extended = abs(landmarks[4].x - landmarks[3].x) > abs(landmarks[3].x - landmarks[2].x)
            if thumb_extended:
                extended_fingers.append(0)
            # Other fingers (y-axis)
            for i, (tip, pip, mcp_joint) in enumerate(zip(fingertips[1:], pips[1:], mcp[1:]), 1):
                if landmarks[tip].y < landmarks[pip].y:
                    extended_fingers.append(i)
                angle = self._finger_angle(landmarks[tip], landmarks[pip], landmarks[mcp_joint])
                finger_angles.append(angle)
            extended_count = len(extended_fingers)
            gesture_type = self._determine_gesture_type(extended_count, extended_fingers)
            gesture_quality = self._gesture_quality(landmarks, finger_angles)
            return {
                "gesture": gesture_type,
                "extended_fingers": extended_fingers,
                "extended_count": extended_count,
                "gesture_quality": gesture_quality,
                "effectiveness_score": self.presentation_gestures.get(gesture_type, {'effectiveness': 5})['effectiveness'],
            }
        except Exception as e:
            logger.error(f"Error classifying gesture: {e}")
            return {
                "gesture": "unknown",
                "extended_fingers": [],
                "extended_count": 0,
                "gesture_quality": 5.0,
                "effectiveness_score": 3
            }

    def _determine_gesture_type(self, extended_count: int, extended_fingers: List[int]) -> str:
        if extended_count == 0:
            return "fist"
        elif extended_count == 1:
            if 1 in extended_fingers:
                return "pointing"
            elif 0 in extended_fingers:
                return "thumbs_up"
            else:
                return "pointing"
        elif extended_count == 2:
            if 1 in extended_fingers and 2 in extended_fingers:
                return "peace_or_two"
            elif 0 in extended_fingers and 1 in extended_fingers:
                return "counting"
            else:
                return "counting"
        elif extended_count in [3, 4]:
            return "counting"
        elif extended_count == 5:
            return "open_palm"
        else:
            return "unknown"

    def _finger_angle(self, tip, pip, mcp) -> float:
        try:
            v1 = np.array([pip.x - mcp.x, pip.y - mcp.y])
            v2 = np.array([tip.x - pip.x, tip.y - pip.y])
            cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
            angle = np.arccos(np.clip(cos_angle, -1.0, 1.0)) * 180 / np.pi
            return angle
        except Exception:
            return 90.0

    def _gesture_quality(self, landmarks, finger_angles: List[float]) -> float:
        quality_score = 5.0
        if finger_angles:
            angle_consistency = 10 - min(np.std(finger_angles) / 10, 5)
            quality_score += (angle_consistency - 5) * 0.3
        wrist = landmarks[0]
        if 0.1 < wrist.x < 0.9 and 0.1 < wrist.y < 0.9:
            quality_score += 1.0
        return max(0.0, min(10.0, quality_score))

    def _gesture_zone(self, hand_landmarks) -> str:
        try:
            wrist_y = hand_landmarks.landmark[0].y
            if wrist_y < 0.4:
                return "upper"
            elif wrist_y < 0.7:
                return "middle"
            else:
                return "lower"
        except Exception:
            return "middle"

    def _calculate_statistics(self, gesture_data: List[Dict]) -> Dict[str, Any]:
        total_frames = len(gesture_data)
        hands_detected_frames = sum(1 for data in gesture_data if data["hands_detected"] > 0)
        gesture_counts = {}
        effectiveness_scores = []
        for data in gesture_data:
            for hand_data in data.get("hands_data", []):
                gesture = hand_data.get("gesture", "unknown")
                gesture_counts[gesture] = gesture_counts.get(gesture, 0) + 1
                effectiveness_scores.append(hand_data.get("effectiveness_score", 5))
        avg_effectiveness = np.mean(effectiveness_scores) if effectiveness_scores else 5.0
        return {
            "hands_visible_percentage": (hands_detected_frames / total_frames) * 100 if total_frames else 0,
            "gesture_distribution": gesture_counts,
            "average_effectiveness": float(avg_effectiveness),
            "gesture_variety": len(gesture_counts)
        }

    def _calculate_engagement(self, gesture_stats: Dict, duration: float) -> Dict[str, Any]:
        hands_visible = gesture_stats.get("hands_visible_percentage", 0)
        gesture_variety = gesture_stats.get("gesture_variety", 0)
        avg_effectiveness = gesture_stats.get("average_effectiveness", 5.0)
        engagement_score = 0
        if 60 <= hands_visible <= 90:
            engagement_score += 3
        elif 40 <= hands_visible <= 95:
            engagement_score += 2
        elif 20 <= hands_visible <= 100:
            engagement_score += 1
        if gesture_variety >= 4:
            engagement_score += 2
        elif gesture_variety >= 2:
            engagement_score += 1
        if avg_effectiveness >= 7:
            engagement_score += 3
        elif avg_effectiveness >= 5:
            engagement_score += 2
        else:
            engagement_score += 1
        if engagement_score >= 8:
            engagement_level = "high"
        elif engagement_score >= 6:
            engagement_level = "moderate"
        elif engagement_score >= 4:
            engagement_level = "low"
        else:
            engagement_level = "very_low"
        return {
            "gesture_engagement_score": float(min(10, engagement_score)),
            "engagement_level": engagement_level,
        }

    def _analyze_effectiveness(self, gesture_data: List[Dict]) -> Dict[str, Any]:
        if not gesture_data:
            return {"average_effectiveness": 3.0, "effectiveness_trend": "no_data"}
        effectiveness_scores = [data.get("frame_effectiveness", 5.0) for data in gesture_data]
        avg_effectiveness = np.mean(effectiveness_scores)
        return {
            "average_effectiveness": float(avg_effectiveness),
        }

    def _analyze_temporal_patterns(self, gesture_data: List[Dict]) -> Dict[str, Any]:
        if len(gesture_data) < 5:
            return {"pattern_quality": 5.0, "rhythm": "insufficient_data"}
        gesture_frequency = [data["hands_detected"] for data in gesture_data]
        frequency_std = np.std(gesture_frequency)
        frequency_mean = np.mean(gesture_frequency)
        if 0.3 <= frequency_std <= 0.7 and frequency_mean >= 0.5:
            rhythm_score = 9
            rhythm = "good_rhythm"
        elif 0.1 <= frequency_std <= 1.0 and frequency_mean >= 0.3:
            rhythm_score = 7
            rhythm = "moderate_rhythm"
        elif frequency_std > 1.2:
            rhythm_score = 4
            rhythm = "erratic"
        else:
            rhythm_score = 5
            rhythm = "static"
        return {
            "pattern_quality": float(rhythm_score),
            "rhythm": rhythm,
        }

    def _calculate_overall_score(self, engagement_metrics: Dict, effectiveness_analysis: Dict, temporal_patterns: Dict) -> float:
        engagement_score = engagement_metrics.get("gesture_engagement_score", 5.0)
        effectiveness_score = effectiveness_analysis.get("average_effectiveness", 5.0)
        pattern_score = temporal_patterns.get("pattern_quality", 5.0)
        overall_score = (
            engagement_score * 0.40 +
            effectiveness_score * 0.30 +
            pattern_score * 0.30
        )
        return max(0.0, min(10.0, overall_score))

    def _generate_recommendations(self, gesture_stats: Dict, engagement_metrics: Dict, effectiveness_analysis: Dict, temporal_patterns: Dict) -> List[str]:
        recommendations = []
        hands_visible = gesture_stats.get("hands_visible_percentage", 0)
        if hands_visible < 50:
            recommendations.append("Increase hand gesture usage. Aim for hands to be visible 60-80% of the time for better engagement.")
        elif hands_visible > 95:
            recommendations.append("Allow for some natural pauses in gesturing to avoid appearing overly animated.")
        variety = gesture_stats.get("gesture_variety", 0)
        if variety < 3:
            recommendations.append("Practice using more varied gestures. Try incorporating counting, descriptive, and emphasizing gestures.")
        avg_effectiveness = effectiveness_analysis.get("average_effectiveness", 5.0)
        if avg_effectiveness < 6:
            recommendations.append("Focus on using more effective gestures like open palms, counting, and descriptive movements.")
        rhythm = temporal_patterns.get("rhythm", "unknown")
        if rhythm == "erratic":
            recommendations.append("Practice more consistent gesture timing. Avoid rapid, erratic hand movements.")
        elif rhythm == "static":
            recommendations.append("Add more dynamic gesturing. Use hand movements to emphasize key points.")
        if not recommendations:
            engagement_level = engagement_metrics.get("engagement_level", "unknown")
            if engagement_level in ["high", "moderate"]:
                recommendations.append("Great gesture usage! Continue practicing to maintain this level of engagement.")
            else:
                recommendations.append("Consider practicing hand gestures to enhance your presentation delivery.")
        return recommendations

# Usage example:
# detector = HandGestureDetector()
# result = detector.analyze("your_video.mp4")
# print(result)
