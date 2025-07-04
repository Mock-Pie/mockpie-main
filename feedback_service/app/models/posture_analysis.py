import cv2
import mediapipe as mp
import numpy as np
import logging
from typing import Dict, List, Any
import math

logger = logging.getLogger(__name__)

class PostureAnalyzer:
    """
    Enhanced Presentation Posture Analysis using MediaPipe Pose
    Detects comprehensive body language patterns for professional presentations
    """
    
    def __init__(self, frame_sample_rate: int = 5):
        try:
            self.mp_pose = mp.solutions.pose
            self.pose = self.mp_pose.Pose(
                static_image_mode=False,
                model_complexity=1,  # Reduced for better performance
                enable_segmentation=False,
                min_detection_confidence=0.6,  # Increased for reliability
                min_tracking_confidence=0.6
            )
            self.mp_drawing = mp.solutions.drawing_utils
            self.frame_sample_rate = frame_sample_rate
            logger.info("MediaPipe Pose initialized for posture analysis")
        except Exception as e:
            logger.error(f"Error initializing MediaPipe Pose: {e}")
            self.pose = None
        
        # Enhanced pose detection with severity weights based on presentation impact
        self.pose_severity_weights = {
            'Crossed Arms': 2.5,           # High impact - appears defensive
            'Hands on Hips': 2.0,          # Confrontational appearance
            'Hands Behind Back': 2.5,      # Reduces engagement and trust
            'Slouching': 3.0,              # Poor professional appearance
            'Head Tilt': 1.5,              # Appears uncertain
            'Arms Too Close': 1.0,         # Constrained appearance
            'Hands Above Shoulders': 1.5,  # Distracting gestures
            'Face Touching': 2.0,          # Sign of nervousness
            'Hair Touching': 1.5,          # Stress response
            'Excessive Swaying': 2.0,      # Shows nervousness
            'Weight Shifting': 1.5,        # Restlessness
            'Foot Fidgeting': 1.0,         # Minor fidgeting
            'Leaning Posture': 2.0,        # Poor stance
            'Shoulder Asymmetry': 1.5,     # Unprofessional appearance
            'Hands in Pockets': 1.5        # Disengagement
        }
        
        # Movement tracking for nervous behaviors
        self.previous_landmarks = None
        self.movement_history = []
        self.sway_history = []

    def analyze(self, video_path: str) -> Dict[str, Any]:
        """Analyze posture from video and return comprehensive metrics with score out of 10"""
        logger.info(f"Starting Enhanced Posture Analysis for {video_path}")
        
        try:
            if self.pose is None:
                return {"error": "MediaPipe Pose not available", "overall_score": 5.0}

            posture_data = self._process_video_frames(video_path)
            if "error" in posture_data:
                return {**posture_data, "overall_score": 5.0}

            posture_analysis = self._analyze_posture_patterns(posture_data)
            posture_metrics = self._calculate_posture_metrics(posture_analysis)
            recommendations = self._generate_recommendations(posture_metrics)

            return {
                "posture_timeline": posture_analysis["timeline"],
                "posture_summary": posture_analysis["summary"],
                "pose_segments": posture_data.get("pose_segments", {}),
                "posture_metrics": posture_metrics,
                "recommendations": recommendations,
                "overall_score": posture_metrics.get("overall_posture_score", 5.0),
                "analysis_method": "enhanced_mediapipe"
            }
        except Exception as e:
            logger.error(f"Error in posture analysis: {e}")
            return {"error": str(e), "overall_score": 5.0}

    def _process_video_frames(self, video_path: str) -> Dict[str, Any]:
        """Process video frames efficiently with optimized sampling"""
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return {"error": "Could not open video file"}
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frame_interval = max(int(fps / self.frame_sample_rate), 1)
            
            posture_timeline = []
            pose_timers = {}
            all_pose_segments = {}
            frame_count = 0
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_count % frame_interval == 0:
                    timestamp = frame_count / fps
                    frame_analysis = self._analyze_frame(frame, timestamp, pose_timers, all_pose_segments)
                    
                    if frame_analysis:
                        posture_timeline.append({
                            "timestamp": timestamp,
                            "frame_number": frame_count,
                            "bad_poses": frame_analysis["bad_poses"],
                            "pose_durations": frame_analysis["pose_durations"].copy(),
                            "movement_score": frame_analysis.get("movement_score", 5.0)
                        })
                
                frame_count += 1
            
            cap.release()
            return {
                "timeline": posture_timeline,
                "pose_segments": all_pose_segments,
                "video_info": {
                    "total_frames": total_frames,
                    "fps": fps,
                    "duration": total_frames / fps
                }
            }
        except Exception as e:
            logger.error(f"Error processing video frames: {e}")
            return {"error": str(e)}

    def _analyze_frame(self, frame: np.ndarray, timestamp: float, pose_timers: Dict, all_pose_segments: Dict = None) -> Dict[str, Any]:
        """Enhanced frame analysis with comprehensive pose detection"""
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = self.pose.process(rgb_frame)
            
            bad_poses = []
            movement_score = 5.0
            
            if result.pose_landmarks:
                landmarks = result.pose_landmarks.landmark
                keypoints = self._extract_enhanced_keypoints(landmarks)
                
                # Detect all pose issues
                bad_poses = self._detect_comprehensive_postures(keypoints)
                
                # Analyze movement patterns for nervous behaviors
                movement_score = self._analyze_movement_patterns(keypoints)
                
                # Update pose tracking
                self._update_pose_timers(bad_poses, timestamp, pose_timers, all_pose_segments)
                
                # Store for movement analysis
                self.previous_landmarks = keypoints
            
            pose_durations = {pose_type: pose_data['current_duration'] 
                            for pose_type, pose_data in pose_timers.items()}
            
            return {
                "bad_poses": bad_poses,
                "pose_durations": pose_durations,
                "landmarks_detected": result.pose_landmarks is not None,
                "movement_score": movement_score
            }
        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            return None

    def _extract_enhanced_keypoints(self, landmarks) -> Dict[str, Any]:
        """Extract comprehensive keypoints for detailed posture analysis"""
        keypoints = {}
        
        # Extended landmark set for comprehensive analysis
        landmark_names = [
            'LEFT_WRIST', 'RIGHT_WRIST', 'LEFT_ELBOW', 'RIGHT_ELBOW',
            'LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_HIP', 'RIGHT_HIP',
            'NOSE', 'LEFT_EAR', 'RIGHT_EAR', 'LEFT_EYE', 'RIGHT_EYE',
            'LEFT_ANKLE', 'RIGHT_ANKLE', 'LEFT_KNEE', 'RIGHT_KNEE',
            'LEFT_FOOT_INDEX', 'RIGHT_FOOT_INDEX'
        ]
        
        for name in landmark_names:
            try:
                landmark = landmarks[getattr(self.mp_pose.PoseLandmark, name)]
                keypoints[name] = {
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z,
                    'visibility': landmark.visibility
                }
            except:
                # Handle missing landmarks gracefully
                keypoints[name] = {'x': 0, 'y': 0, 'z': 0, 'visibility': 0}
        
        return keypoints

    def _detect_comprehensive_postures(self, keypoints: Dict) -> List[str]:
        """Comprehensive pose detection based on presentation standards"""
        bad_poses = []
        visibility_threshold = 0.6
        
        # Get keypoint data with safety checks
        def get_keypoint(name):
            return keypoints.get(name, {'x': 0, 'y': 0, 'z': 0, 'visibility': 0})
        
        left_wrist = get_keypoint('LEFT_WRIST')
        right_wrist = get_keypoint('RIGHT_WRIST')
        left_elbow = get_keypoint('LEFT_ELBOW')
        right_elbow = get_keypoint('RIGHT_ELBOW')
        left_shoulder = get_keypoint('LEFT_SHOULDER')
        right_shoulder = get_keypoint('RIGHT_SHOULDER')
        left_hip = get_keypoint('LEFT_HIP')
        right_hip = get_keypoint('RIGHT_HIP')
        nose = get_keypoint('NOSE')
        left_ear = get_keypoint('LEFT_EAR')
        right_ear = get_keypoint('RIGHT_EAR')
        
        # Visibility checks
        left_wrist_visible = left_wrist['visibility'] > visibility_threshold
        right_wrist_visible = right_wrist['visibility'] > visibility_threshold
        
        # 1. Crossed Arms Detection (enhanced)
        if (left_wrist_visible and right_wrist_visible and 
            left_wrist['x'] > right_wrist['x'] and 
            abs(left_wrist['y'] - right_wrist['y']) < 0.15):
            bad_poses.append("Crossed Arms")
        
        # 2. Hands on Hips Detection (improved accuracy)
        if left_wrist_visible and right_wrist_visible:
            left_hip_distance = abs(left_wrist['y'] - left_hip['y'])
            right_hip_distance = abs(right_wrist['y'] - right_hip['y'])
            wrist_width = abs(left_wrist['x'] - right_wrist['x'])
            if (left_hip_distance < 0.08 and right_hip_distance < 0.08 and 
                wrist_width > 0.2):
                bad_poses.append("Hands on Hips")
        
        # 3. Hands Above Shoulders Detection
        if (left_wrist_visible and right_wrist_visible and
            left_wrist['y'] < left_shoulder['y'] - 0.05 and 
            right_wrist['y'] < right_shoulder['y'] - 0.05):
            bad_poses.append("Hands Above Shoulders")
        
        # 4. Hands Behind Back Detection (enhanced)
        left_hip_visible = left_hip['visibility'] > visibility_threshold
        right_hip_visible = right_hip['visibility'] > visibility_threshold
        if (not left_wrist_visible and not right_wrist_visible and
            left_hip_visible and right_hip_visible):
            bad_poses.append("Hands Behind Back")
        
        # 5. Slouching Detection (improved with shoulder-hip relationship)
        if (left_shoulder['visibility'] > visibility_threshold and 
            right_shoulder['visibility'] > visibility_threshold and
            left_hip_visible and right_hip_visible):
            shoulder_center_z = (left_shoulder['z'] + right_shoulder['z']) / 2
            hip_center_z = (left_hip['z'] + right_hip['z']) / 2
            if shoulder_center_z > hip_center_z + 0.05:
                bad_poses.append("Slouching")
        
        # 6. Head Tilt Detection (enhanced sensitivity)
        if (left_ear['visibility'] > visibility_threshold and 
            right_ear['visibility'] > visibility_threshold):
            head_tilt = abs(left_ear['y'] - right_ear['y'])
            if head_tilt > 0.04:
                bad_poses.append("Head Tilt")
        
        # 7. Arms Too Close to Body
        if (left_elbow['visibility'] > visibility_threshold and 
            right_elbow['visibility'] > visibility_threshold):
            left_arm_width = abs(left_elbow['x'] - left_shoulder['x'])
            right_arm_width = abs(right_elbow['x'] - right_shoulder['x'])
            if left_arm_width < 0.04 and right_arm_width < 0.04:
                bad_poses.append("Arms Too Close")
        
        # 8. NEW: Face Touching Detection
        if left_wrist_visible or right_wrist_visible:
            nose_y = nose['y']
            if ((left_wrist_visible and abs(left_wrist['y'] - nose_y) < 0.1 and 
                 abs(left_wrist['x'] - nose['x']) < 0.15) or
                (right_wrist_visible and abs(right_wrist['y'] - nose_y) < 0.1 and 
                 abs(right_wrist['x'] - nose['x']) < 0.15)):
                bad_poses.append("Face Touching")
        
        # 9. NEW: Hair Touching Detection
        if left_wrist_visible or right_wrist_visible:
            ear_level = (left_ear['y'] + right_ear['y']) / 2 if left_ear['visibility'] > 0.5 and right_ear['visibility'] > 0.5 else nose['y'] - 0.1
            if ((left_wrist_visible and left_wrist['y'] < ear_level and 
                 abs(left_wrist['x'] - left_ear['x']) < 0.1) or
                (right_wrist_visible and right_wrist['y'] < ear_level and 
                 abs(right_wrist['x'] - right_ear['x']) < 0.1)):
                bad_poses.append("Hair Touching")
        
        # 10. NEW: Leaning Posture Detection
        if (left_shoulder['visibility'] > visibility_threshold and 
            right_shoulder['visibility'] > visibility_threshold):
            shoulder_center_x = (left_shoulder['x'] + right_shoulder['x']) / 2
            if abs(shoulder_center_x - 0.5) > 0.15:  # Significant lean from center
                bad_poses.append("Leaning Posture")
        
        # 11. NEW: Shoulder Asymmetry Detection
        if (left_shoulder['visibility'] > visibility_threshold and 
            right_shoulder['visibility'] > visibility_threshold):
            shoulder_height_diff = abs(left_shoulder['y'] - right_shoulder['y'])
            if shoulder_height_diff > 0.06:
                bad_poses.append("Shoulder Asymmetry")
        
        # 12. NEW: Hands in Pockets Detection (low visibility + arms close)
        if (left_wrist['visibility'] < 0.3 and right_wrist['visibility'] < 0.3 and
            left_elbow['visibility'] > visibility_threshold and right_elbow['visibility'] > visibility_threshold):
            elbow_close = (abs(left_elbow['x'] - left_shoulder['x']) < 0.08 and 
                          abs(right_elbow['x'] - right_shoulder['x']) < 0.08)
            if elbow_close:
                bad_poses.append("Hands in Pockets")
        
        return bad_poses

    def _analyze_movement_patterns(self, keypoints: Dict) -> float:
        """Analyze movement patterns for nervous behaviors like swaying and fidgeting"""
        movement_score = 5.0
        
        if self.previous_landmarks is None:
            self.previous_landmarks = keypoints
            return movement_score
        
        try:
            # Calculate center of mass movement
            current_center = self._calculate_center_of_mass(keypoints)
            previous_center = self._calculate_center_of_mass(self.previous_landmarks)
            
            movement = math.sqrt((current_center['x'] - previous_center['x'])**2 + 
                               (current_center['y'] - previous_center['y'])**2)
            
            # Track movement history
            self.movement_history.append(movement)
            if len(self.movement_history) > 30:  # Keep last 30 frames
                self.movement_history.pop(0)
            
            # Analyze movement patterns
            if len(self.movement_history) >= 10:
                avg_movement = sum(self.movement_history) / len(self.movement_history)
                movement_variance = np.var(self.movement_history)
                
                # Excessive movement (fidgeting/swaying)
                if avg_movement > 0.01:  # Threshold for excessive movement
                    movement_score -= 2.0
                
                # Erratic movement patterns
                if movement_variance > 0.001:
                    movement_score -= 1.0
            
            return max(0.0, min(10.0, movement_score))
        
        except Exception as e:
            logger.error(f"Error analyzing movement patterns: {e}")
            return 5.0

    def _calculate_center_of_mass(self, keypoints: Dict) -> Dict[str, float]:
        """Calculate center of mass from key body points"""
        key_points = ['LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_HIP', 'RIGHT_HIP']
        valid_points = []
        
        for point_name in key_points:
            point = keypoints.get(point_name, {'visibility': 0})
            if point['visibility'] > 0.5:
                valid_points.append(point)
        
        if not valid_points:
            return {'x': 0.5, 'y': 0.5}
        
        center_x = sum(p['x'] for p in valid_points) / len(valid_points)
        center_y = sum(p['y'] for p in valid_points) / len(valid_points)
        
        return {'x': center_x, 'y': center_y}

    def _update_pose_timers(self, bad_poses: List[str], timestamp: float, pose_timers: Dict, all_pose_segments: Dict = None):
        """Update pose timing with improved segment tracking"""
        # Start timing for new poses
        for pose_type in bad_poses:
            if pose_type not in pose_timers:
                pose_timers[pose_type] = {
                    'start_time': timestamp,
                    'current_duration': 0,
                    'segments': []
                }
        
        # Update durations and complete segments
        for pose_type in list(pose_timers.keys()):
            if pose_type in bad_poses:
                pose_timers[pose_type]['current_duration'] = timestamp - pose_timers[pose_type]['start_time']
            else:
                pose_data = pose_timers[pose_type]
                duration = timestamp - pose_data['start_time']
                
                # Record segments of 2+ seconds (reduced threshold for better detection)
                if duration >= 2.0:
                    segment = {
                        'pose_type': pose_type,
                        'start_time': pose_data['start_time'],
                        'end_time': timestamp,
                        'duration': duration
                    }
                    pose_data['segments'].append(segment)
                    
                    if all_pose_segments is not None:
                        if pose_type not in all_pose_segments:
                            all_pose_segments[pose_type] = []
                        all_pose_segments[pose_type].append(segment)
                
                del pose_timers[pose_type]

    def _analyze_posture_patterns(self, posture_data: Dict) -> Dict[str, Any]:
        """Comprehensive posture pattern analysis"""
        try:
            timeline = posture_data.get("timeline", [])
            pose_segments = posture_data.get("pose_segments", {})
            
            if not timeline:
                return {"error": "No posture data to analyze"}
            
            pose_counts = {}
            pose_max_durations = {}
            movement_scores = [frame.get("movement_score", 5.0) for frame in timeline]
            
            for frame_data in timeline:
                bad_poses = frame_data.get("bad_poses", [])
                pose_durations = frame_data.get("pose_durations", {})
                
                for pose in bad_poses:
                    pose_counts[pose] = pose_counts.get(pose, 0) + 1
                    
                    if pose in pose_durations:
                        duration = pose_durations[pose]
                        if pose not in pose_max_durations or duration > pose_max_durations[pose]:
                            pose_max_durations[pose] = duration
            
            total_frames = len(timeline)
            pose_percentages = {
                pose: (count / total_frames) * 100 
                for pose, count in pose_counts.items()
            }
            
            return {
                "timeline": timeline,
                "summary": {
                    "pose_counts": pose_counts,
                    "pose_percentages": pose_percentages,
                    "pose_max_durations": pose_max_durations,
                    "pose_segments": pose_segments,
                    "total_frames_analyzed": total_frames,
                    "average_movement_score": float(np.mean(movement_scores)),
                    "most_common_issues": sorted(pose_counts.items(), 
                                               key=lambda x: x[1], reverse=True)[:5]
                }
            }
        except Exception as e:
            logger.error(f"Error analyzing posture patterns: {e}")
            return {"error": str(e)}

    def _calculate_posture_metrics(self, posture_analysis: Dict) -> Dict[str, Any]:
        """Enhanced posture metrics calculation with research-based scoring"""
        try:
            summary = posture_analysis.get("summary", {})
            pose_percentages = summary.get("pose_percentages", {})
            pose_max_durations = summary.get("pose_max_durations", {})
            avg_movement_score = summary.get("average_movement_score", 5.0)
            
            # Start with perfect score
            posture_score = 10.0
            total_penalty = 0
            
            # Frequency-based penalties
            for pose, percentage in pose_percentages.items():
                weight = self.pose_severity_weights.get(pose, 1.0)
                # Progressive penalty: higher percentages get exponentially worse
                penalty = (percentage / 100) * weight * (1 + percentage / 50)
                total_penalty += penalty
            
            # Duration-based penalties (longer holds are worse)
            for pose, max_duration in pose_max_durations.items():
                if max_duration > 5:  # Poses held longer than 5 seconds
                    duration_penalty = min(max_duration / 20, 3.0)  # Cap at 3 points
                    total_penalty += duration_penalty
            
            # Movement pattern penalty
            if avg_movement_score < 5.0:
                movement_penalty = (5.0 - avg_movement_score) * 0.5
                total_penalty += movement_penalty
            
            posture_score = max(0, posture_score - total_penalty)
            
            # Classification based on professional presentation standards
            if posture_score >= 8.5:
                posture_quality = "excellent"
                professionalism = "high"
            elif posture_score >= 7.0:
                posture_quality = "good"
                professionalism = "good"
            elif posture_score >= 5.5:
                posture_quality = "fair"
                professionalism = "moderate"
            elif posture_score >= 3.0:
                posture_quality = "needs_improvement"
                professionalism = "low"
            else:
                posture_quality = "poor"
                professionalism = "very_low"
            
            return {
                "overall_posture_score": float(posture_score),
                "posture_quality": posture_quality,
                "professionalism_level": professionalism,
                "main_issues": list(pose_percentages.keys()),
                "most_problematic": max(pose_percentages.items(), key=lambda x: x[1])[0] if pose_percentages else None,
                "total_penalty_points": float(total_penalty),
                "movement_quality": "good" if avg_movement_score >= 6 else "needs_work",
                "nervous_behavior_detected": any(pose in ["Face Touching", "Hair Touching", "Excessive Swaying"] 
                                               for pose in pose_percentages.keys())
            }
        except Exception as e:
            logger.error(f"Error calculating posture metrics: {e}")
            return {"overall_posture_score": 5.0, "posture_quality": "unknown"}

    def _generate_recommendations(self, posture_metrics: Dict) -> List[str]:
        """Generate specific, actionable recommendations based on detected issues"""
        recommendations = []
        
        try:
            main_issues = posture_metrics.get("main_issues", [])
            posture_score = posture_metrics.get("overall_posture_score", 5)
            nervous_behavior = posture_metrics.get("nervous_behavior_detected", False)
            
            # High-priority recommendations for severe issues
            if posture_score < 4:
                recommendations.extend([
                    "Focus on fundamental posture training before presenting",
                    "Practice in front of a mirror to build body awareness",
                    "Consider working with a presentation coach"
                ])
            
            # Specific issue-based recommendations
            issue_recommendations = {
                "Crossed Arms": "Keep arms uncrossed - use open gestures to appear approachable",
                "Hands on Hips": "Avoid hands on hips - use purposeful hand gestures instead",
                "Hands Above Shoulders": "Keep gestures within chest-to-waist level for better impact",
                "Hands Behind Back": "Bring hands into view - use visible gestures to support your message",
                "Slouching": "Stand tall with shoulders back - imagine a string pulling you upward",
                "Head Tilt": "Keep your head level and centered to appear more confident",
                "Arms Too Close": "Give your arms space to move naturally away from your body",
                "Face Touching": "Avoid touching your face - it signals nervousness to the audience",
                "Hair Touching": "Keep hands away from hair - practice stress management techniques",
                "Excessive Swaying": "Plant your feet shoulder-width apart and minimize swaying",
                "Weight Shifting": "Practice standing still with weight evenly distributed",
                "Foot Fidgeting": "Keep feet planted and avoid tapping or shuffling",
                "Leaning Posture": "Maintain an upright, centered stance throughout your presentation",
                "Shoulder Asymmetry": "Practice keeping shoulders level and evenly positioned",
                "Hands in Pockets": "Keep hands visible and use them for expressive gestures"
            }
            
            # Add specific recommendations for detected issues
            for issue in main_issues[:4]:  # Limit to top 4 issues
                if issue in issue_recommendations:
                    recommendations.append(issue_recommendations[issue])
            
            # Nervous behavior recommendations
            if nervous_behavior:
                recommendations.extend([
                    "Practice relaxation techniques before presenting to reduce nervous behaviors",
                    "Focus on controlled breathing to maintain composure"
                ])
            
            # General improvement recommendations
            if posture_score < 7:
                recommendations.extend([
                    "Practice the 'presenter's stance': feet shoulder-width apart, upright posture",
                    "Record yourself presenting to identify unconscious habits"
                ])
            
            # Positive reinforcement for good performance
            if not recommendations or posture_score >= 8:
                recommendations.append("Excellent posture! Continue maintaining professional body language")
            
            return recommendations[:6]  # Limit to 6 most important recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return ["Focus on maintaining professional posture throughout your presentation"]
