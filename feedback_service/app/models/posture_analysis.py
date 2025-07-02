import cv2
import mediapipe as mp
import numpy as np
import time
import asyncio
import logging
from typing import Dict, List, Any, Tuple

logger = logging.getLogger(__name__)

class PostureAnalyzer:
    """
    Presentation Posture Analysis using MediaPipe Pose
    Detects and analyzes body language and posture for presentations
    """
    
    def __init__(self):
        try:
            self.mp_pose = mp.solutions.pose
            self.pose = self.mp_pose.Pose(
                static_image_mode=False,
                model_complexity=2,
                enable_segmentation=False,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self.mp_drawing = mp.solutions.drawing_utils
            logger.info("MediaPipe Pose initialized for posture analysis")
        except Exception as e:
            logger.error(f"Error initializing MediaPipe Pose: {e}")
            self.pose = None
    
    async def analyze(self, video_path: str) -> Dict[str, Any]:
        print(f"🧍 DEBUG: Starting Posture Analysis for {video_path}")
        try:
            if self.pose is None:
                return {"error": "MediaPipe Pose not available"}

            posture_data = await self._process_video_frames(video_path)

            if "error" in posture_data:
                return posture_data

            posture_analysis = await self._analyze_posture_patterns(posture_data)
            posture_metrics = await self._calculate_posture_metrics(posture_analysis)
            recommendations = await self._generate_posture_recommendations(posture_metrics)

            return {
                "posture_timeline": posture_analysis["timeline"],
                "bad_posture_summary": posture_analysis["summary"],
                "pose_segments": posture_data.get("pose_segments", {}),
                "flat_pose_segments": self._flatten_pose_segments(posture_data.get("pose_segments", {})),
                "posture_metrics": posture_metrics,
                "recommendations": recommendations,
                "overall_score": posture_metrics.get("overall_posture_score", 5.0)
            }
        except Exception as e:
            logger.error(f"Error in posture analysis: {e}")
            return {"error": str(e)}
    
    async def analyze_live(self, duration_seconds: int = 60) -> Dict[str, Any]:
        """
        Analyze posture from live webcam feed
        
        Args:
            duration_seconds: How long to analyze (default 60 seconds)
            
        Returns:
            Dictionary containing live posture analysis results
        """
        try:
            if self.pose is None:
                return {"error": "MediaPipe Pose not available"}
            
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                return {"error": "Could not open webcam"}
            
            posture_timeline = []
            pose_timers = {}
            all_pose_segments = {}  # Track segments for live analysis
            start_time = time.time()
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                current_time = time.time()
                elapsed_time = current_time - start_time
                
                # Stop after specified duration
                if elapsed_time >= duration_seconds:
                    break
                
                # Analyze current frame
                frame_analysis = await self._analyze_frame(frame, elapsed_time, pose_timers, all_pose_segments)
                
                if frame_analysis:
                    posture_timeline.append({
                        "timestamp": elapsed_time,
                        "bad_poses": frame_analysis["bad_poses"],
                        "pose_durations": frame_analysis["pose_durations"].copy()
                    })
                
                # Optional: Display real-time feedback (remove if running headless)
                if frame_analysis and frame_analysis["annotated_frame"] is not None:
                    cv2.imshow("Posture Analysis", frame_analysis["annotated_frame"])
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
            
            # Check for any remaining active poses at the end
            for pose_type in list(pose_timers.keys()):
                pose_data = pose_timers[pose_type]
                duration = duration_seconds - pose_data['start_time']
                
                # If pose was held for 5+ seconds, record the final segment
                if duration >= 3.0:
                    segment = {
                        'pose_type': pose_type,
                        'start_time': pose_data['start_time'],
                        'end_time': duration_seconds,
                        'duration': duration
                    }
                    if pose_type not in all_pose_segments:
                        all_pose_segments[pose_type] = []
                    all_pose_segments[pose_type].append(segment)
            
            cap.release()
            cv2.destroyAllWindows()
            
            # Analyze collected data
            analysis_results = await self._analyze_timeline_data(posture_timeline, all_pose_segments)
            
            return {
                "duration_analyzed": elapsed_time,
                "posture_timeline": posture_timeline[-100:],  # Last 100 frames
                "pose_segments": all_pose_segments,
                "analysis_summary": analysis_results,
                "overall_score": analysis_results.get("overall_posture_score", 5.0)
            }
            
        except Exception as e:
            logger.error(f"Error in live posture analysis: {e}")
            return {"error": str(e)}
    
    async def _process_video_frames(self, video_path: str) -> Dict[str, Any]:
        """Process video frames and extract posture data"""
        try:
            cap = cv2.VideoCapture(video_path)
            
            if not cap.isOpened():
                return {"error": "Could not open video file"}
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # Calculate frame interval for 3 FPS sampling
            target_fps = 3
            frame_interval = max(int(fps / target_fps), 1)      

            posture_timeline = []
            pose_timers = {}
            all_pose_segments = {}  # Track all segments across the entire video
            frame_count = 0
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process every frame based on 3 FPS sampling to optimize performance
                if frame_count % frame_interval == 0:
                    timestamp = frame_count / fps
                    frame_analysis = await self._analyze_frame(frame, timestamp, pose_timers, all_pose_segments)
                    
                    if frame_analysis:
                        posture_timeline.append({
                            "timestamp": timestamp,
                            "frame_number": frame_count,
                            "bad_poses": frame_analysis["bad_poses"],
                            "pose_durations": frame_analysis["pose_durations"].copy()
                        })
                
                frame_count += 1
            
            # After processing all frames, check for any remaining active poses
            final_timestamp = total_frames / fps
            for pose_type in list(pose_timers.keys()):
                pose_data = pose_timers[pose_type]
                duration = final_timestamp - pose_data['start_time']
                
                # If pose was held for 5+ seconds, record the final segment
                if duration >= 5.0:
                    segment = {
                        'pose_type': pose_type,
                        'start_time': pose_data['start_time'],
                        'end_time': final_timestamp,
                        'duration': duration
                    }
                    if pose_type not in all_pose_segments:
                        all_pose_segments[pose_type] = []
                    all_pose_segments[pose_type].append(segment)
            
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
    
    async def _analyze_frame(self, frame: np.ndarray, timestamp: float, pose_timers: Dict, all_pose_segments: Dict = None) -> Dict[str, Any]:
        """Analyze a single frame for posture issues"""
        try:
            # Convert to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process frame with MediaPipe
            result = self.pose.process(rgb_frame)
            
            bad_poses = []
            annotated_frame = frame.copy()
            
            if result.pose_landmarks:
                landmarks = result.pose_landmarks.landmark
                
                # Extract keypoints
                keypoints = self._extract_keypoints(landmarks)
                
                # Check for bad postures
                bad_poses = self._detect_bad_postures(keypoints)
                
                # Update pose timers
                self._update_pose_timers(bad_poses, timestamp, pose_timers, all_pose_segments)
                
                # Draw pose landmarks on frame
                self.mp_drawing.draw_landmarks(
                    annotated_frame, 
                    result.pose_landmarks, 
                    self.mp_pose.POSE_CONNECTIONS
                )
                
                # Draw pose warnings
                self._draw_pose_warnings(annotated_frame, bad_poses, pose_timers, timestamp)
            
            # Calculate current pose durations
            pose_durations = {}
            for pose_type, pose_data in pose_timers.items():
                pose_durations[pose_type] = pose_data['current_duration']
            
            return {
                "bad_poses": bad_poses,
                "pose_durations": pose_durations,
                "annotated_frame": annotated_frame,
                "landmarks_detected": result.pose_landmarks is not None
            }
            
        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            return None
    
    def _flatten_pose_segments(self, pose_segments: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        flat_segments = []
        for pose_type, segments in pose_segments.items():
            for seg in segments:
                if seg['duration'] >= 3.0:
                    flat_segments.append({
                        "bad_pose": pose_type,
                        "start_time": seg["start_time"],
                        "end_time": seg["end_time"],
                        "duration": seg["duration"]
                    })
        return sorted(flat_segments, key=lambda x: x["start_time"])

    def _extract_keypoints(self, landmarks) -> Dict[str, Any]:
        """Extract relevant keypoints from MediaPipe landmarks"""
        keypoints = {}
        
        # Key landmarks for posture analysis
        landmark_names = [
            'LEFT_WRIST', 'RIGHT_WRIST', 'LEFT_ELBOW', 'RIGHT_ELBOW',
            'LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_HIP', 'RIGHT_HIP',
            'NOSE', 'LEFT_EAR', 'RIGHT_EAR'
        ]
        
        for name in landmark_names:
            landmark = landmarks[getattr(self.mp_pose.PoseLandmark, name)]
            keypoints[name] = {
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'visibility': landmark.visibility
            }
        
        return keypoints
    
    def _detect_bad_postures(self, keypoints: Dict) -> List[str]:
        """Detect various bad posture patterns"""
        bad_poses = []
        
        # Get keypoint data
        left_wrist = keypoints['LEFT_WRIST']
        right_wrist = keypoints['RIGHT_WRIST']
        left_elbow = keypoints['LEFT_ELBOW']
        right_elbow = keypoints['RIGHT_ELBOW']
        left_shoulder = keypoints['LEFT_SHOULDER']
        right_shoulder = keypoints['RIGHT_SHOULDER']
        left_hip = keypoints['LEFT_HIP']
        right_hip = keypoints['RIGHT_HIP']
        
        # Visibility thresholds
        visibility_threshold = 0.5
        left_wrist_visible = left_wrist['visibility'] > visibility_threshold
        right_wrist_visible = right_wrist['visibility'] > visibility_threshold
        print(f"🧍 DEBUG: Left wrist visible: {left_wrist['visibility']}, Right wrist visible: {right_wrist['visibility'] }")
        # 1. Crossed Arms Detection
        if (left_wrist_visible and right_wrist_visible and 
            right_wrist['x'] > left_wrist['x']):
            bad_poses.append("Crossed Arms")
        
        # 2. Hands on Hips Detection
        if left_wrist_visible and right_wrist_visible:
            left_hip_distance = abs(left_wrist['y'] - left_hip['y'])
            right_hip_distance = abs(right_wrist['y'] - right_hip['y'])
            if left_hip_distance < 0.1 and right_hip_distance < 0.1:
                bad_poses.append("Hands on Hips")
        
        # 3. Hands Above Shoulders Detection
        if (left_wrist_visible and right_wrist_visible and
            left_wrist['y'] < left_shoulder['y'] and 
            right_wrist['y'] < right_shoulder['y']):
            bad_poses.append("Hands Above Shoulders")
        
        # 4. Hands Behind Back (low visibility)
        if not left_wrist_visible and not right_wrist_visible:
            bad_poses.append("Hands Behind Back")
        
        # 5. Slouching Detection (shoulder position relative to hips)
        if (left_shoulder['visibility'] > visibility_threshold and 
            right_shoulder['visibility'] > visibility_threshold):
            shoulder_forward = (left_shoulder['z'] + right_shoulder['z']) / 2
            if shoulder_forward > 0.1:  # Shoulders forward of normal position
                bad_poses.append("Slouching")
        
        # 6. Head Tilt Detection
        left_ear = keypoints['LEFT_EAR']
        right_ear = keypoints['RIGHT_EAR']
        if (left_ear['visibility'] > visibility_threshold and 
            right_ear['visibility'] > visibility_threshold):
            head_tilt = abs(left_ear['y'] - right_ear['y'])
            if head_tilt > 0.05:  # Significant head tilt
                bad_poses.append("Head Tilt")
        
        # 7. Arms Too Close to Body
        if (left_elbow['visibility'] > visibility_threshold and 
            right_elbow['visibility'] > visibility_threshold):
            left_arm_width = abs(left_elbow['x'] - left_shoulder['x'])
            right_arm_width = abs(right_elbow['x'] - right_shoulder['x'])
            if left_arm_width < 0.05 and right_arm_width < 0.05:
                bad_poses.append("Arms Too Close")
        
        return bad_poses
    
    def _update_pose_timers(self, bad_poses: List[str], timestamp: float, pose_timers: Dict, all_pose_segments: Dict = None):
        """Update timing for detected poses and track segments"""
        # Start timing for new poses
        for pose_type in bad_poses:
            if pose_type not in pose_timers:
                pose_timers[pose_type] = {
                    'start_time': timestamp,
                    'current_duration': 0,
                    'segments': []
                }
        
        # Update current durations and check for completed segments
        for pose_type in list(pose_timers.keys()):
            if pose_type in bad_poses:
                # Pose is still active, update duration
                pose_timers[pose_type]['current_duration'] = timestamp - pose_timers[pose_type]['start_time']
            else:
                # Pose is no longer detected, check if we need to record a segment
                pose_data = pose_timers[pose_type]
                duration = timestamp - pose_data['start_time']
                
                # If pose was held for 5+ seconds, record the segment
                if duration >= 3.0:
                    segment = {
                        'pose_type': pose_type,
                        'start_time': pose_data['start_time'],
                        'end_time': timestamp,
                        'duration': duration
                    }
                    pose_data['segments'].append(segment)
                    
                    # Also add to the main segments dictionary if provided
                    if all_pose_segments is not None:
                        if pose_type not in all_pose_segments:
                            all_pose_segments[pose_type] = []
                        all_pose_segments[pose_type].append(segment)
                
                # Remove the pose timer
                del pose_timers[pose_type]
    
    def _draw_pose_warnings(self, frame: np.ndarray, bad_poses: List[str], 
                           pose_timers: Dict, current_timestamp: float):
        """Draw pose warnings on frame"""
        y_position = 50
        for pose_type in bad_poses:
            if pose_type in pose_timers:
                duration = pose_timers[pose_type]['current_duration']
                message = f"{pose_type} - {duration:.1f}s"
                cv2.putText(frame, message, (30, y_position), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                y_position += 30
    
    async def _analyze_posture_patterns(self, posture_data: Dict) -> Dict[str, Any]:
        """Analyze patterns in posture data over time"""
        try:
            timeline = posture_data.get("timeline", [])
            pose_segments = posture_data.get("pose_segments", {})
            
            if not timeline:
                return {"error": "No posture data to analyze"}
            
            # Count occurrences and total durations
            pose_counts = {}
            pose_total_durations = {}
            pose_max_durations = {}
            
            for frame_data in timeline:
                bad_poses = frame_data.get("bad_poses", [])
                pose_durations = frame_data.get("pose_durations", {})
                
                for pose in bad_poses:
                    pose_counts[pose] = pose_counts.get(pose, 0) + 1
                    
                    # Track duration information
                    if pose in pose_durations:
                        duration = pose_durations[pose]
                        if pose not in pose_max_durations or duration > pose_max_durations[pose]:
                            pose_max_durations[pose] = duration
                        pose_total_durations[pose] = pose_total_durations.get(pose, 0) + duration
            
            # Calculate percentages
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
                    "most_common_issues": sorted(pose_counts.items(), 
                                               key=lambda x: x[1], reverse=True)[:3]
                }
            }
            
        except Exception as e:
            logger.error(f"Error analyzing posture patterns: {e}")
            return {"error": str(e)}
    
    async def _calculate_posture_metrics(self, posture_analysis: Dict) -> Dict[str, Any]:
        """Calculate overall posture metrics and scores"""
        try:
            summary = posture_analysis.get("summary", {})
            pose_percentages = summary.get("pose_percentages", {})
            pose_max_durations = summary.get("pose_max_durations", {})
            
            # Calculate posture score (0-10)
            posture_score = 10.0
            
            # Penalize based on frequency and severity of bad postures
            severity_weights = {
                "Crossed Arms": 2.0,
                "Hands on Hips": 1.5,
                "Hands Above Shoulders": 1.0,
                "Hands Behind Back": 2.5,
                "Slouching": 3.0,
                "Head Tilt": 1.5,
                "Arms Too Close": 1.0
            }
            
            total_penalty = 0
            for pose, percentage in pose_percentages.items():
                weight = severity_weights.get(pose, 1.0)
                penalty = (percentage / 100) * weight * 1.6
                total_penalty += penalty
            
            # Additional penalty for long durations
            for pose, max_duration in pose_max_durations.items():
                if max_duration > 10:  # More than 10 seconds
                    duration_penalty = min(max_duration / 30, 2.0)  # Cap at 2 points
                    total_penalty += duration_penalty
            
            posture_score = max(0, posture_score - total_penalty)
            
            # Classify posture quality
            if posture_score >= 8:
                posture_quality = "excellent"
            elif posture_score >= 6:
                posture_quality = "good"
            elif posture_score >= 4:
                posture_quality = "fair"
            else:
                posture_quality = "needs_improvement"
            
            return {
                "overall_posture_score": float(posture_score),
                "posture_quality": posture_quality,
                "main_issues": list(pose_percentages.keys()),
                "most_problematic": max(pose_percentages.items(), key=lambda x: x[1])[0] if pose_percentages else None,
                "total_penalty_points": float(total_penalty),
                "professionalism_impact": "high" if posture_score < 5 else "medium" if posture_score < 7 else "low"
            }
            
        except Exception as e:
            logger.error(f"Error calculating posture metrics: {e}")
            return {"overall_posture_score": 5.0, "posture_quality": "unknown"}
    
    async def _generate_posture_recommendations(self, posture_metrics: Dict) -> List[str]:
        """Generate specific recommendations for posture improvement"""
        recommendations = []
        
        try:
            main_issues = posture_metrics.get("main_issues", [])
            posture_score = posture_metrics.get("overall_posture_score", 5)
            
            # General recommendations based on score
            if posture_score < 4:
                recommendations.append("Focus on fundamental posture training before presenting")
                recommendations.append("Practice in front of a mirror to build body awareness")
            
            # Specific recommendations for each issue
            issue_recommendations = {
                "Crossed Arms": [
                    "Keep arms uncrossed - use open gestures to appear more approachable",
                    "Practice holding your hands loosely at your sides or in front"
                ],
                "Hands on Hips": [
                    "Avoid hands on hips - it can appear confrontational or impatient",
                    "Use purposeful hand gestures to emphasize points instead"
                ],
                "Hands Above Shoulders": [
                    "Keep hand gestures within the 'presentation box' (chest to waist level)",
                    "Excessive overhead gestures can be distracting"
                ],
                "Hands Behind Back": [
                    "Bring hands into view - hidden hands reduce trust and engagement",
                    "Use visible hand gestures to support your message"
                ],
                "Slouching": [
                    "Stand tall with shoulders back and chest open",
                    "Imagine a string pulling you up from the top of your head",
                    "Practice good posture daily to make it habitual"
                ],
                "Head Tilt": [
                    "Keep your head level and centered",
                    "Avoid excessive head tilting which can appear uncertain"
                ],
                "Arms Too Close": [
                    "Give your arms space to move naturally",
                    "Practice gestures that extend slightly away from your body"
                ]
            }
            
            for issue in main_issues:
                if issue in issue_recommendations:
                    recommendations.extend(issue_recommendations[issue])
            
            # Add general good posture tips
            if posture_score < 7:
                recommendations.extend([
                    "Practice the 'presenter's stance': feet shoulder-width apart, weight evenly distributed",
                    "Record yourself presenting to identify unconscious posture habits",
                    "Do posture exercises and stretches before important presentations"
                ])
            
            if not recommendations:
                recommendations.append("Excellent posture! Continue maintaining professional body language")
            
            return recommendations[:6]  # Limit to 6 most important recommendations
            
        except Exception as e:
            logger.error(f"Error generating posture recommendations: {e}")
            return ["Focus on maintaining professional posture throughout your presentation"]
    
    async def _analyze_timeline_data(self, timeline: List[Dict], all_pose_segments: Dict) -> Dict[str, Any]:
        """Analyze timeline data from live capture"""
        try:
            if not timeline:
                return {"overall_posture_score": 5.0, "error": "No timeline data"}
            
            # Create summary similar to video analysis
            pose_counts = {}
            for frame in timeline:
                for pose in frame.get("bad_poses", []):
                    pose_counts[pose] = pose_counts.get(pose, 0) + 1
            
            total_frames = len(timeline)
            pose_percentages = {
                pose: (count / total_frames) * 100 
                for pose, count in pose_counts.items()
            }
            
            # Calculate score using same logic as video analysis
            posture_analysis = {
                "summary": {
                    "pose_percentages": pose_percentages, 
                    "pose_max_durations": {},
                    "pose_segments": all_pose_segments
                }
            }
            metrics = await self._calculate_posture_metrics(posture_analysis)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error analyzing timeline data: {e}")
            return {"overall_posture_score": 5.0, "error": str(e)}
