import cv2
import numpy as np
import mediapipe as mp
import asyncio
import logging
from typing import Dict, List, Any, Tuple
import math

logger = logging.getLogger(__name__)

class HandGestureDetector:
    """
    Enhanced Hand Gesture Detection for Presentation Analysis
    Uses MediaPipe Hands with sophisticated gesture classification and engagement metrics
    Optimized for presentation effectiveness evaluation
    """
    
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.frame_sample_rate = 10  # Analyze every 10th frame for better performance
        
        # Presentation-specific gesture analysis
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
        
        # Gesture zones for presentation analysis
        self.gesture_zones = {
            'upper': 'Expressive zone - good for emphasis',
            'middle': 'Natural zone - optimal for most gestures', 
            'lower': 'Passive zone - less engaging'
        }
    
    async def analyze(self, video_path: str) -> Dict[str, Any]:
        """
        Enhanced hand gesture analysis for presentations
        
        Args:
            video_path: Path to video file
            
        Returns:
            Dictionary containing comprehensive hand gesture analysis results
        """
        print(f"👋 DEBUG: Starting Enhanced Hand Gesture Analysis for {video_path}")
        
        try:
            gesture_data = []
            cap = cv2.VideoCapture(video_path)
            frame_count = 0
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0
            
            logger.info(f"Analyzing hand gestures: {total_frames} frames, {duration:.1f}s")
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_count % self.frame_sample_rate == 0:
                    timestamp = frame_count / fps if fps > 0 else frame_count
                    result = await self._analyze_frame_enhanced(frame, timestamp)
                    if result:
                        gesture_data.append(result)
                
                frame_count += 1
                
                # Progress logging
                if frame_count % max(1, total_frames // 10) == 0:
                    progress = (frame_count / total_frames) * 100
                    logger.info(f"Hand gesture analysis progress: {progress:.1f}%")
            
            cap.release()
            
            # Enhanced analysis results
            if not gesture_data:
                return {
                    "error": "No hands detected",
                    "gesture_statistics": {},
                    "engagement_metrics": {"gesture_usage": "none"},
                    "overall_score": 3.0,  # Low score for no gestures
                    "recommendations": ["Practice using hand gestures to enhance your presentation"]
                }
            
            # Calculate comprehensive metrics
            gesture_stats = await self._calculate_enhanced_statistics(gesture_data)
            engagement_metrics = await self._calculate_presentation_engagement(gesture_stats, duration)
            effectiveness_analysis = await self._analyze_gesture_effectiveness(gesture_data)
            temporal_patterns = await self._analyze_temporal_patterns(gesture_data)
            
            # Calculate overall score
            overall_score = await self._calculate_overall_gesture_score(
                engagement_metrics, effectiveness_analysis, temporal_patterns
            )
            
            # Generate actionable recommendations
            recommendations = await self._generate_enhanced_recommendations(
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
                "presentation_insights": await self._generate_presentation_insights(
                    gesture_stats, effectiveness_analysis
                )
            }
            
        except Exception as e:
            logger.error(f"Error in hand gesture analysis: {e}")
            return {
                "error": str(e), 
                "gesture_statistics": {}, 
                "overall_score": 5.0,
                "recommendations": ["Unable to analyze gestures due to technical error"]
            }
    
    async def _analyze_frame_enhanced(self, frame: np.ndarray, timestamp: float) -> Dict[str, Any]:
        """Enhanced frame analysis with sophisticated gesture classification"""
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
                
                # Enhanced gesture recognition
                gesture_analysis = await self._classify_gesture_enhanced(hand_landmarks, frame_width, frame_height)
                hand_info.update(gesture_analysis)
                
                # Calculate gesture zone
                gesture_zone = self._calculate_gesture_zone(hand_landmarks, frame_height)
                hand_info["gesture_zone"] = gesture_zone
                
                # Calculate gesture dynamics
                dynamics = await self._calculate_gesture_dynamics(hand_landmarks)
                hand_info["dynamics"] = dynamics
                
                hands_data.append(hand_info)
            
            return {
                "timestamp": timestamp,
                "hands_detected": len(hands_data),
                "hands_data": hands_data,
                "frame_engagement": await self._calculate_frame_engagement(hands_data),
                "frame_effectiveness": await self._calculate_frame_effectiveness(hands_data)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            return None
    
    async def _classify_gesture_enhanced(self, hand_landmarks, frame_width: int, frame_height: int) -> Dict[str, Any]:
        """Enhanced gesture classification with presentation-specific analysis"""
        try:
            landmarks = hand_landmarks.landmark
            
            # Get fingertip and joint positions
            fingertips = [4, 8, 12, 16, 20]  # Thumb, Index, Middle, Ring, Pinky tips
            pips = [3, 6, 10, 14, 18]  # PIP joints
            mcp = [2, 5, 9, 13, 17]   # MCP joints
            
            # Calculate extended fingers
            extended_fingers = []
            finger_angles = []
            
            # Thumb (different logic - x-axis for most hand orientations)
            thumb_extended = abs(landmarks[4].x - landmarks[3].x) > abs(landmarks[3].x - landmarks[2].x)
            if thumb_extended:
                extended_fingers.append(0)
            
            # Other fingers (y-axis)
            for i, (tip, pip, mcp_joint) in enumerate(zip(fingertips[1:], pips[1:], mcp[1:]), 1):
                # Calculate finger extension based on relative positions
                tip_y = landmarks[tip].y
                pip_y = landmarks[pip].y
                mcp_y = landmarks[mcp_joint].y
                
                # Finger is extended if tip is above PIP
                if tip_y < pip_y:
                    extended_fingers.append(i)
                
                # Calculate finger angle for gesture quality assessment
                angle = self._calculate_finger_angle(landmarks[tip], landmarks[pip], landmarks[mcp_joint])
                finger_angles.append(angle)
            
            extended_count = len(extended_fingers)
            
            # Enhanced gesture classification
            gesture_type = await self._determine_gesture_type(extended_count, extended_fingers, landmarks, finger_angles)
            
            # Calculate gesture quality and effectiveness
            gesture_quality = await self._calculate_gesture_quality(landmarks, finger_angles, frame_width, frame_height)
            
            # Determine gesture purpose in presentation context
            presentation_purpose = await self._determine_presentation_purpose(gesture_type, landmarks)
            
            return {
                "gesture": gesture_type,
                "extended_fingers": extended_fingers,
                "extended_count": extended_count,
                "gesture_quality": gesture_quality,
                "presentation_purpose": presentation_purpose,
                "effectiveness_score": self.presentation_gestures.get(gesture_type, {'effectiveness': 5})['effectiveness'],
                "finger_angles": finger_angles
            }
                
        except Exception as e:
            logger.error(f"Error classifying gesture: {e}")
            return {
                "gesture": "unknown",
                "extended_fingers": [],
                "extended_count": 0,
                "gesture_quality": 5.0,
                "presentation_purpose": "unclear",
                "effectiveness_score": 3
            }
    
    async def _determine_gesture_type(self, extended_count: int, extended_fingers: List[int], 
                                    landmarks, finger_angles: List[float]) -> str:
        """Determine specific gesture type with enhanced classification"""
        try:
            # Basic classification by extended finger count
            if extended_count == 0:
                return "fist"
            elif extended_count == 1:
                if 1 in extended_fingers:  # Index finger
                    return "pointing"
                elif 0 in extended_fingers:  # Thumb
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
            elif extended_count == 3:
                return "counting"
            elif extended_count == 4:
                return "counting"
            elif extended_count == 5:
                # Analyze hand shape for open palm vs descriptive gesture
                if await self._is_descriptive_gesture(landmarks, finger_angles):
                    return "descriptive"
                else:
                    return "open_palm"
            else:
                return "unknown"
                
        except Exception as e:
            logger.error(f"Error determining gesture type: {e}")
            return "unknown"
    
    async def _is_descriptive_gesture(self, landmarks, finger_angles: List[float]) -> bool:
        """Determine if open hand is being used descriptively"""
        try:
            # Check if fingers are curved (indicating shape description)
            avg_curvature = np.mean(finger_angles)
            
            # Check hand orientation and positioning
            wrist = landmarks[0]
            middle_finger_tip = landmarks[12]
            
            # If hand is positioned away from body center and fingers show some curvature
            if abs(middle_finger_tip.x - 0.5) > 0.1 and 120 < avg_curvature < 160:
                return True
                
            return False
            
        except Exception:
            return False
    
    async def _determine_presentation_purpose(self, gesture_type: str, landmarks) -> str:
        """Determine the likely purpose of the gesture in presentation context"""
        purposes = {
            "open_palm": "welcoming_engaging",
            "pointing": "directional_emphasis", 
            "counting": "enumeration_listing",
            "descriptive": "size_shape_illustration",
            "thumbs_up": "positive_reinforcement",
            "fist": "strong_emphasis",
            "peace_or_two": "basic_counting"
        }
        
        return purposes.get(gesture_type, "unclear_purpose")
    
    def _calculate_finger_angle(self, tip, pip, mcp) -> float:
        """Calculate the angle of finger extension"""
        try:
            # Calculate vectors
            v1 = np.array([pip.x - mcp.x, pip.y - mcp.y])
            v2 = np.array([tip.x - pip.x, tip.y - pip.y])
            
            # Calculate angle between vectors
            cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
            angle = np.arccos(np.clip(cos_angle, -1.0, 1.0)) * 180 / np.pi
            
            return angle
            
        except Exception:
            return 90.0  # Default neutral angle
    
    async def _calculate_gesture_quality(self, landmarks, finger_angles: List[float], 
                                       frame_width: int, frame_height: int) -> float:
        """Calculate the quality/clarity of the gesture"""
        try:
            quality_score = 5.0
            
            # Finger position consistency
            if len(finger_angles) > 0:
                angle_consistency = 10 - min(np.std(finger_angles) / 10, 5)
                quality_score += (angle_consistency - 5) * 0.3
            
            # Hand visibility (not too close to edges)
            wrist = landmarks[0]
            if 0.1 < wrist.x < 0.9 and 0.1 < wrist.y < 0.9:
                quality_score += 1.0
            
            # Hand size (indicates good distance from camera)
            hand_span = self._calculate_hand_span(landmarks)
            if 0.1 < hand_span < 0.4:  # Good size range
                quality_score += 1.0
            elif hand_span < 0.05:  # Too small/far
                quality_score -= 1.0
            elif hand_span > 0.5:  # Too large/close
                quality_score -= 0.5
            
            return max(0.0, min(10.0, quality_score))
            
        except Exception as e:
            logger.error(f"Error calculating gesture quality: {e}")
            return 5.0
    
    def _calculate_hand_span(self, landmarks) -> float:
        """Calculate the span of the hand for size assessment"""
        try:
            # Distance from thumb tip to pinky tip
            thumb_tip = landmarks[4]
            pinky_tip = landmarks[20]
            
            span = math.sqrt((thumb_tip.x - pinky_tip.x)**2 + (thumb_tip.y - pinky_tip.y)**2)
            return span
            
        except Exception:
            return 0.1  # Default small span
    
    def _calculate_gesture_zone(self, hand_landmarks, frame_height: int) -> str:
        """Calculate which zone the gesture is in (upper, middle, lower)"""
        try:
            # Use wrist position to determine zone
            wrist_y = hand_landmarks.landmark[0].y
            
            if wrist_y < 0.4:
                return "upper"
            elif wrist_y < 0.7:
                return "middle"
            else:
                return "lower"
                
        except Exception:
            return "middle"
    
    async def _calculate_gesture_dynamics(self, hand_landmarks) -> Dict[str, float]:
        """Calculate gesture dynamics (would need frame-to-frame comparison for full implementation)"""
        try:
            # For now, return basic analysis - in full implementation would track movement
            wrist = hand_landmarks.landmark[0]
            
            return {
                "position_x": float(wrist.x),
                "position_y": float(wrist.y),
                "estimated_movement": 0.5,  # Placeholder
                "gesture_confidence": 0.8   # Placeholder
            }
            
        except Exception:
            return {
                "position_x": 0.5,
                "position_y": 0.5,
                "estimated_movement": 0.0,
                "gesture_confidence": 0.5
            }
    
    async def _calculate_frame_engagement(self, hands_data: List[Dict]) -> float:
        """Calculate engagement score for this frame"""
        if not hands_data:
            return 0.0
        
        engagement = 0.0
        for hand in hands_data:
            # Base engagement from gesture effectiveness
            effectiveness = hand.get("effectiveness_score", 5)
            engagement += effectiveness
            
            # Bonus for gesture quality
            quality = hand.get("gesture_quality", 5.0)
            engagement += quality * 0.3
            
            # Zone bonus (middle zone is optimal)
            zone = hand.get("gesture_zone", "middle")
            if zone == "middle":
                engagement += 1.0
            elif zone == "upper":
                engagement += 0.5
        
        # Average across hands and normalize to 0-10
        return min(10.0, engagement / len(hands_data))
    
    async def _calculate_frame_effectiveness(self, hands_data: List[Dict]) -> float:
        """Calculate effectiveness score for this frame"""
        if not hands_data:
            return 3.0  # Low effectiveness for no gestures
        
        effectiveness_scores = [hand.get("effectiveness_score", 5) for hand in hands_data]
        return np.mean(effectiveness_scores)

    async def _calculate_enhanced_statistics(self, gesture_data: List[Dict]) -> Dict[str, Any]:
        """Calculate comprehensive gesture statistics"""
        try:
            total_frames = len(gesture_data)
            hands_detected_frames = sum(1 for data in gesture_data if data["hands_detected"] > 0)
            
            # Gesture type distribution
            gesture_counts = {}
            effectiveness_scores = []
            quality_scores = []
            zone_distribution = {"upper": 0, "middle": 0, "lower": 0}
            hand_usage = {"left": 0, "right": 0, "both": 0}
            
            for data in gesture_data:
                hands_count = data["hands_detected"]
                
                # Track hand usage patterns
                if hands_count == 1:
                    handedness = data["hands_data"][0]["handedness"]
                    hand_usage[handedness.lower()] += 1
                elif hands_count == 2:
                    hand_usage["both"] += 1
                
                # Analyze each hand
                for hand_data in data.get("hands_data", []):
                    gesture = hand_data.get("gesture", "unknown")
                    gesture_counts[gesture] = gesture_counts.get(gesture, 0) + 1
                    
                    effectiveness_scores.append(hand_data.get("effectiveness_score", 5))
                    quality_scores.append(hand_data.get("gesture_quality", 5.0))
                    
                    zone = hand_data.get("gesture_zone", "middle")
                    zone_distribution[zone] += 1
            
            # Calculate averages and metrics
            avg_effectiveness = np.mean(effectiveness_scores) if effectiveness_scores else 5.0
            avg_quality = np.mean(quality_scores) if quality_scores else 5.0
            
            # Most effective gesture
            gesture_effectiveness = {}
            for gesture, count in gesture_counts.items():
                gesture_scores = [
                    hand.get("effectiveness_score", 5) 
                    for data in gesture_data 
                    for hand in data.get("hands_data", [])
                    if hand.get("gesture") == gesture
                ]
                gesture_effectiveness[gesture] = np.mean(gesture_scores) if gesture_scores else 5.0
            
            most_effective_gesture = max(gesture_effectiveness.items(), key=lambda x: x[1]) if gesture_effectiveness else ("none", 0)
            
            return {
                "hands_visible_percentage": (hands_detected_frames / total_frames) * 100,
                "gesture_distribution": gesture_counts,
                "gesture_effectiveness": gesture_effectiveness,
                "hand_usage_distribution": hand_usage,
                "zone_distribution": zone_distribution,
                "average_hands_per_frame": sum(data["hands_detected"] for data in gesture_data) / total_frames,
                "most_common_gesture": max(gesture_counts.items(), key=lambda x: x[1])[0] if gesture_counts else "none",
                "most_effective_gesture": most_effective_gesture,
                "average_effectiveness": float(avg_effectiveness),
                "average_gesture_quality": float(avg_quality),
                "gesture_variety": len(gesture_counts)
            }
            
        except Exception as e:
            logger.error(f"Error calculating enhanced statistics: {e}")
            return {}

    async def _calculate_presentation_engagement(self, gesture_stats: Dict, duration: float) -> Dict[str, Any]:
        """Calculate presentation-specific engagement metrics"""
        try:
            hands_visible = gesture_stats.get("hands_visible_percentage", 0)
            gesture_variety = gesture_stats.get("gesture_variety", 0)
            avg_effectiveness = gesture_stats.get("average_effectiveness", 5.0)
            zone_dist = gesture_stats.get("zone_distribution", {})
            
            # Calculate engagement score
            engagement_score = 0
            
            # Hand visibility contribution (optimal range: 60-90%)
            if 60 <= hands_visible <= 90:
                engagement_score += 3
            elif 40 <= hands_visible <= 95:
                engagement_score += 2
            elif 20 <= hands_visible <= 100:
                engagement_score += 1
            
            # Gesture variety contribution
            if gesture_variety >= 4:
                engagement_score += 2
            elif gesture_variety >= 2:
                engagement_score += 1
            
            # Effectiveness contribution
            if avg_effectiveness >= 7:
                engagement_score += 3
            elif avg_effectiveness >= 5:
                engagement_score += 2
            else:
                engagement_score += 1
            
            # Zone distribution (prefer middle zone)
            total_gestures = sum(zone_dist.values())
            if total_gestures > 0:
                middle_percentage = (zone_dist.get("middle", 0) / total_gestures) * 100
                if middle_percentage >= 60:
                    engagement_score += 2
                elif middle_percentage >= 40:
                    engagement_score += 1
            
            # Determine engagement level
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
                "hands_usage_rating": self._rate_hands_usage(hands_visible),
                "gesture_variety_rating": self._rate_gesture_variety(gesture_variety),
                "optimal_zone_usage": float(middle_percentage) if 'middle_percentage' in locals() else 0.0
            }
            
        except Exception as e:
            logger.error(f"Error calculating presentation engagement: {e}")
            return {"gesture_engagement_score": 5.0, "engagement_level": "unknown"}
    
    def _rate_hands_usage(self, hands_visible: float) -> str:
        """Rate the hands usage percentage"""
        if hands_visible >= 80:
            return "excellent"
        elif hands_visible >= 60:
            return "good"
        elif hands_visible >= 40:
            return "moderate"
        elif hands_visible >= 20:
            return "limited"
        else:
            return "poor"
    
    def _rate_gesture_variety(self, variety: int) -> str:
        """Rate the gesture variety"""
        if variety >= 5:
            return "excellent"
        elif variety >= 3:
            return "good"
        elif variety >= 2:
            return "moderate"
        elif variety >= 1:
            return "limited"
        else:
            return "none"

    async def _analyze_gesture_effectiveness(self, gesture_data: List[Dict]) -> Dict[str, Any]:
        """Analyze overall gesture effectiveness for presentations"""
        try:
            if not gesture_data:
                return {"average_effectiveness": 3.0, "effectiveness_trend": "no_data"}
            
            effectiveness_scores = []
            for data in gesture_data:
                frame_effectiveness = data.get("frame_effectiveness", 5.0)
                effectiveness_scores.append(frame_effectiveness)
            
            avg_effectiveness = np.mean(effectiveness_scores)
            effectiveness_std = np.std(effectiveness_scores)
            
            # Analyze trend
            if len(effectiveness_scores) > 10:
                first_half = np.mean(effectiveness_scores[:len(effectiveness_scores)//2])
                second_half = np.mean(effectiveness_scores[len(effectiveness_scores)//2:])
                
                if second_half > first_half + 0.5:
                    trend = "improving"
                elif second_half < first_half - 0.5:
                    trend = "declining"
                else:
                    trend = "stable"
            else:
                trend = "stable"
            
            # Consistency score
            consistency = max(0, 10 - effectiveness_std * 2)
            
            return {
                "average_effectiveness": float(avg_effectiveness),
                "effectiveness_consistency": float(consistency),
                "effectiveness_trend": trend,
                "peak_effectiveness": float(max(effectiveness_scores)),
                "minimum_effectiveness": float(min(effectiveness_scores)),
                "effectiveness_range": float(max(effectiveness_scores) - min(effectiveness_scores))
            }
            
        except Exception as e:
            logger.error(f"Error analyzing gesture effectiveness: {e}")
            return {"average_effectiveness": 5.0, "effectiveness_trend": "unknown"}
    
    async def _analyze_temporal_patterns(self, gesture_data: List[Dict]) -> Dict[str, Any]:
        """Analyze temporal patterns of gesture usage"""
        try:
            if len(gesture_data) < 5:
                return {"pattern_quality": 5.0, "rhythm": "insufficient_data"}
            
            # Analyze gesture frequency over time
            gesture_frequency = [data["hands_detected"] for data in gesture_data]
            
            # Calculate rhythm score (consistent but not monotonous)
            frequency_std = np.std(gesture_frequency)
            frequency_mean = np.mean(gesture_frequency)
            
            # Optimal rhythm: some variation but not erratic
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
            
            # Analyze gesture timing (peaks and valleys)
            gesture_activity = []
            window_size = max(1, len(gesture_data) // 10)
            
            for i in range(0, len(gesture_data), window_size):
                window = gesture_data[i:i+window_size]
                avg_activity = np.mean([d["hands_detected"] for d in window])
                gesture_activity.append(avg_activity)
            
            return {
                "pattern_quality": float(rhythm_score),
                "rhythm": rhythm,
                "gesture_frequency_std": float(frequency_std),
                "average_gesture_activity": float(frequency_mean),
                "activity_periods": len(gesture_activity),
                "peak_activity": float(max(gesture_activity)) if gesture_activity else 0.0
            }
            
        except Exception as e:
            logger.error(f"Error analyzing temporal patterns: {e}")
            return {"pattern_quality": 5.0, "rhythm": "unknown"}
    
    async def _calculate_overall_gesture_score(self, engagement_metrics: Dict, 
                                             effectiveness_analysis: Dict, 
                                             temporal_patterns: Dict) -> float:
        """Calculate overall gesture score for presentation"""
        try:
            # Weighted combination of different factors
            engagement_score = engagement_metrics.get("gesture_engagement_score", 5.0)
            effectiveness_score = effectiveness_analysis.get("average_effectiveness", 5.0)
            pattern_score = temporal_patterns.get("pattern_quality", 5.0)
            consistency_score = effectiveness_analysis.get("effectiveness_consistency", 5.0)
            
            # Weights: engagement (40%), effectiveness (30%), patterns (20%), consistency (10%)
            overall_score = (
                engagement_score * 0.40 +
                effectiveness_score * 0.30 +
                pattern_score * 0.20 +
                consistency_score * 0.10
            )
            
            return max(0.0, min(10.0, overall_score))
            
        except Exception as e:
            logger.error(f"Error calculating overall gesture score: {e}")
            return 5.0

    async def _generate_enhanced_recommendations(self, gesture_stats: Dict, 
                                               engagement_metrics: Dict,
                                               effectiveness_analysis: Dict,
                                               temporal_patterns: Dict) -> List[str]:
        """Generate comprehensive, actionable recommendations"""
        recommendations = []
        
        try:
            # Hand visibility recommendations
            hands_visible = gesture_stats.get("hands_visible_percentage", 0)
            if hands_visible < 50:
                recommendations.append(
                    "Increase hand gesture usage. Aim for hands to be visible 60-80% of the time for better engagement."
                )
            elif hands_visible > 95:
                recommendations.append(
                    "Allow for some natural pauses in gesturing to avoid appearing overly animated."
                )
            
            # Gesture variety recommendations
            variety = gesture_stats.get("gesture_variety", 0)
            if variety < 3:
                recommendations.append(
                    "Practice using more varied gestures. Try incorporating counting, descriptive, and emphasizing gestures."
                )
            
            # Effectiveness recommendations
            avg_effectiveness = effectiveness_analysis.get("average_effectiveness", 5.0)
            if avg_effectiveness < 6:
                recommendations.append(
                    "Focus on using more effective gestures like open palms, counting, and descriptive movements."
                )
            
            # Zone usage recommendations
            zone_dist = gesture_stats.get("zone_distribution", {})
            total_gestures = sum(zone_dist.values())
            if total_gestures > 0:
                middle_percentage = (zone_dist.get("middle", 0) / total_gestures) * 100
                if middle_percentage < 50:
                    recommendations.append(
                        "Keep gestures in the middle zone (chest to waist level) for optimal audience visibility."
                    )
            
            # Rhythm recommendations
            rhythm = temporal_patterns.get("rhythm", "unknown")
            if rhythm == "erratic":
                recommendations.append(
                    "Practice more consistent gesture timing. Avoid rapid, erratic hand movements."
                )
            elif rhythm == "static":
                recommendations.append(
                    "Add more dynamic gesturing. Use hand movements to emphasize key points."
                )
            
            # Hand usage balance
            hand_usage = gesture_stats.get("hand_usage_distribution", {})
            both_hands = hand_usage.get("both", 0)
            total_usage = sum(hand_usage.values())
            if total_usage > 0 and (both_hands / total_usage) < 0.2:
                recommendations.append(
                    "Consider using both hands together for emphasis and larger descriptive gestures."
                )
            
            # Quality recommendations
            avg_quality = gesture_stats.get("average_gesture_quality", 5.0)
            if avg_quality < 6:
                recommendations.append(
                    "Improve gesture clarity by keeping hands visible and using deliberate, controlled movements."
                )
            
            # Specific gesture recommendations
            most_effective = gesture_stats.get("most_effective_gesture", ("none", 0))
            if most_effective[1] > 7:
                recommendations.append(
                    f"You use '{most_effective[0]}' gestures effectively. Continue incorporating similar movements."
                )
            
            # If no specific issues found
            if not recommendations:
                engagement_level = engagement_metrics.get("engagement_level", "unknown")
                if engagement_level in ["high", "moderate"]:
                    recommendations.append(
                        "Great gesture usage! Continue practicing to maintain this level of engagement."
                    )
                else:
                    recommendations.append(
                        "Consider practicing hand gestures to enhance your presentation delivery."
                    )
                    
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating enhanced recommendations: {e}")
            return ["Continue practicing hand gestures to enhance your presentation effectiveness."]
    
    async def _generate_presentation_insights(self, gesture_stats: Dict, effectiveness_analysis: Dict) -> Dict[str, str]:
        """Generate specific insights for presentation improvement"""
        try:
            insights = {}
            
            # Gesture strength analysis
            most_effective = gesture_stats.get("most_effective_gesture", ("none", 0))
            if most_effective[1] > 7:
                insights["strength"] = f"Strong use of {most_effective[0]} gestures shows good presentation instincts"
            
            # Area for improvement
            avg_effectiveness = effectiveness_analysis.get("average_effectiveness", 5.0)
            if avg_effectiveness < 6:
                insights["improvement"] = "Focus on incorporating more open and descriptive gestures"
            elif avg_effectiveness < 8:
                insights["improvement"] = "Good gesture foundation, work on consistency and variety"
            else:
                insights["improvement"] = "Excellent gesture usage, maintain this standard"
            
            # Engagement potential
            engagement_level = gesture_stats.get("hands_visible_percentage", 0)
            if engagement_level > 70:
                insights["engagement"] = "High gesture frequency suggests strong audience engagement potential"
            elif engagement_level > 40:
                insights["engagement"] = "Moderate gesture usage provides good foundation for improvement"
            else:
                insights["engagement"] = "Increased gesture usage could significantly boost audience engagement"
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating presentation insights: {e}")
            return {"general": "Continue practicing hand gestures for better presentation delivery"}
