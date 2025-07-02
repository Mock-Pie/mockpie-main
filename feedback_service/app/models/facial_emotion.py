import cv2
import numpy as np
import torch
import torch.nn.functional as F
from transformers import pipeline
import mediapipe as mp
import asyncio
import logging
from typing import Dict, List, Any, Tuple, Optional
import os

logger = logging.getLogger(__name__)

class FacialEmotionAnalyzer:
    """
    Facial Emotion Recognition using MediaPipe for face detection
    and pre-trained emotion classification models
    """
    
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Initialize MediaPipe face detection
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_drawing = mp.solutions.drawing_utils
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=0, min_detection_confidence=0.5
        )
        
        # Initialize emotion classifier as None
        self.emotion_classifier = None
        self.transformer_available = False
        
        # Try to load emotion classification model
        try:
            print("😊 DEBUG: Loading facial emotion classifier...")
            self.emotion_classifier = pipeline(
                "image-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Test if the classifier is working by making a simple test call
            if self.emotion_classifier is not None:
                try:
                    # Create a simple test image
                    from PIL import Image
                    import numpy as np
                    test_image = Image.fromarray(np.zeros((64, 64, 3), dtype=np.uint8))
                    test_result = self.emotion_classifier(test_image)
                    
                    if test_result and isinstance(test_result, list):
                        self.transformer_available = True
                        print("😊 DEBUG: Facial emotion classifier loaded and tested successfully")
                        logger.info("Facial emotion model loaded successfully")
                    else:
                        print("😊 DEBUG: Emotion classifier test failed - invalid result format")
                        self.emotion_classifier = None
                        self.transformer_available = False
                        
                except Exception as test_error:
                    print(f"😊 DEBUG: Emotion classifier test failed: {test_error}")
                    self.emotion_classifier = None
                    self.transformer_available = False
            else:
                print("😊 DEBUG: Emotion classifier loaded but is None")
                self.transformer_available = False
                
        except Exception as e:
            print(f"😊 DEBUG: Could not load emotion classifier: {e}")
            logger.warning(f"Could not load emotion model: {e}")
            self.emotion_classifier = None
            self.transformer_available = False
        
        # Emotion labels for manual classification
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        
        # Frame sampling rate (analyze every nth frame)
        self.frame_sample_rate = 30
    
    def _is_emotion_classifier_ready(self) -> bool:
        """Check if emotion classifier is properly loaded and ready"""
        return (self.transformer_available and 
                self.emotion_classifier is not None and 
                callable(self.emotion_classifier))
    
    async def analyze(self, video_path: str) -> Dict[str, Any]:
        """
        Analyze facial emotions from video
        
        Args:
            video_path: Path to video file
            
        Returns:
            Dictionary containing facial emotion analysis results
        """
        print(f"😊 DEBUG: Starting Facial Emotion Analysis for {video_path}")
        
        # Check emotion classifier status
        if self._is_emotion_classifier_ready():
            print("😊 DEBUG: Using transformer-based emotion classification")
        else:
            print("😊 DEBUG: Using heuristic emotion classification (transformer not available)")
        
        try:
            # Extract frames and detect faces
            emotions_over_time = []
            face_detections = []
            
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return self._get_fallback_result("Could not open video file")
            
            frame_count = 0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Sample frames to reduce computation
                if frame_count % self.frame_sample_rate == 0:
                    # Detect face and analyze emotion
                    emotion_result = await self._analyze_frame(frame, frame_count / fps)
                    if emotion_result:
                        emotions_over_time.append(emotion_result)
                        face_detections.append({
                            "frame": frame_count,
                            "timestamp": frame_count / fps,
                            "face_detected": True
                        })
                    else:
                        face_detections.append({
                            "frame": frame_count,
                            "timestamp": frame_count / fps,
                            "face_detected": False
                        })
                
                frame_count += 1
            
            cap.release()
            
            # Analyze results
            if not emotions_over_time:
                return self._get_fallback_result("No faces detected in video")
            
            # Calculate emotion statistics
            emotion_stats = await self._calculate_emotion_statistics(emotions_over_time)
            
            # Analyze temporal patterns
            temporal_analysis = await self._analyze_temporal_patterns(emotions_over_time)
            
            # Calculate face detection rate
            face_detection_rate = len([d for d in face_detections if d["face_detected"]]) / len(face_detections)
            
            # Calculate engagement metrics
            engagement_metrics = await self._calculate_engagement_metrics(emotion_stats)
            overall_score = engagement_metrics.get("engagement_score", 5.0)
            
            return {
                "face_detection_rate": float(face_detection_rate),
                "total_analyzed_frames": len(emotions_over_time),
                "emotion_statistics": emotion_stats,
                "temporal_analysis": temporal_analysis,
                "engagement_metrics": engagement_metrics,
                "overall_score": float(overall_score),
                "recommendations": await self._generate_recommendations(emotion_stats, temporal_analysis),
                "analysis_method": "transformer" if self._is_emotion_classifier_ready() else "heuristic"
            }
            
        except Exception as e:
            logger.error(f"Error in facial emotion analysis: {e}")
            return self._get_fallback_result(f"Analysis failed: {str(e)}")
    
    async def _analyze_frame(self, frame: np.ndarray, timestamp: float) -> Optional[Dict[str, Any]]:
        """Analyze emotion in a single frame"""
        try:
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Detect faces
            results = self.face_detection.process(rgb_frame)
            
            if not results.detections:
                return None
            
            # Get the largest face (assuming main speaker)
            largest_face = max(results.detections, key=lambda d: d.location_data.relative_bounding_box.width)
            
            # Extract face region
            h, w, _ = frame.shape
            bbox = largest_face.location_data.relative_bounding_box
            
            x = int(bbox.xmin * w)
            y = int(bbox.ymin * h)
            width = int(bbox.width * w)
            height = int(bbox.height * h)
            
            # Ensure bbox is within frame
            x = max(0, x)
            y = max(0, y)
            width = min(width, w - x)
            height = min(height, h - y)
            
            if width <= 0 or height <= 0:
                return None
            
            face_crop = rgb_frame[y:y+height, x:x+width]
            
            # Analyze emotion
            try:
                if self._is_emotion_classifier_ready():
                    print("😊 DEBUG: Using transformer emotion classification")
                    emotion_probs = await self._classify_emotion_transformer(face_crop)
                else:
                    print("😊 DEBUG: Using heuristic emotion classification (transformer not available)")
                    emotion_probs = await self._classify_emotion_heuristic(face_crop)
            except Exception as e:
                print(f"😊 DEBUG: Emotion classification failed, using heuristic: {e}")
                logger.error(f"Emotion classification error: {e}")
                emotion_probs = await self._classify_emotion_heuristic(face_crop)
            
            return {
                "timestamp": timestamp,
                "emotions": emotion_probs,
                "face_confidence": float(largest_face.score[0]),
                "face_bbox": {"x": x, "y": y, "width": width, "height": height}
            }
            
        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            return None

    async def _classify_emotion_transformer(self, face_crop: np.ndarray) -> Dict[str, float]:
        """Classify emotion using transformer model"""
        try:
            # Double-check if emotion classifier is available and callable
            if not self._is_emotion_classifier_ready():
                print("😊 DEBUG: Emotion classifier not available, using heuristic fallback")
                logger.warning("Emotion classifier not available, using heuristic fallback")
                return await self._classify_emotion_heuristic(face_crop)
            
            # Additional safety check for None classifier
            if self.emotion_classifier is None:
                print("😊 DEBUG: Emotion classifier is None, using heuristic fallback")
                return await self._classify_emotion_heuristic(face_crop)
            
            # Convert to PIL Image format expected by the pipeline
            from PIL import Image
            face_image = Image.fromarray(face_crop)
            
            # Get emotion predictions with additional error handling
            try:
                results = self.emotion_classifier(face_image)
            except Exception as e:
                print(f"😊 DEBUG: Transformer inference failed: {e}")
                logger.error(f"Transformer inference failed: {e}")
                return await self._classify_emotion_heuristic(face_crop)
            
            # Validate results
            if not results or not isinstance(results, list):
                print("😊 DEBUG: Invalid transformer results, using heuristic fallback")
                return await self._classify_emotion_heuristic(face_crop)
            
            # Convert to our emotion format
            emotion_probs = {}
            for result in results:
                if isinstance(result, dict) and 'label' in result and 'score' in result:
                    label = result['label'].lower()
                    score = result['score']
                    emotion_probs[label] = float(score)
            
            # Ensure all emotion labels are present
            for emotion in self.emotion_labels:
                if emotion not in emotion_probs:
                    emotion_probs[emotion] = 0.0
            
            return emotion_probs
            
        except Exception as e:
            print(f"😊 DEBUG: Error in transformer emotion classification: {e}")
            logger.error(f"Error in transformer emotion classification: {e}")
            # Fallback to heuristic method
            return await self._classify_emotion_heuristic(face_crop)
    
    async def _classify_emotion_heuristic(self, face_crop: np.ndarray) -> Dict[str, float]:
        """Fallback heuristic emotion classification using facial features"""
        try:
            # Convert to grayscale for feature analysis
            gray_face = cv2.cvtColor(face_crop, cv2.COLOR_RGB2GRAY)
            
            # Simple heuristics based on image properties
            # Calculate brightness (might indicate happiness/positivity)
            brightness = np.mean(gray_face) / 255.0
            
            # Calculate contrast (might indicate expressiveness)
            contrast = np.std(gray_face) / 255.0
            
            # Simple emotion mapping based on basic features
            emotions = {}
            
            # High brightness might suggest happiness
            if brightness > 0.6:
                emotions['happy'] = 0.4
                emotions['neutral'] = 0.4
                emotions['surprise'] = 0.2
            # Low brightness might suggest negative emotions
            elif brightness < 0.3:
                emotions['sad'] = 0.4
                emotions['neutral'] = 0.3
                emotions['angry'] = 0.3
            # Medium brightness suggests neutral
            else:
                emotions['neutral'] = 0.6
                emotions['happy'] = 0.2
                emotions['sad'] = 0.2
            
            # Ensure all emotions sum to 1
            total = sum(emotions.values())
            if total > 0:
                emotions = {k: v/total for k, v in emotions.items()}
            
            # Fill missing emotions
            for emotion in self.emotion_labels:
                if emotion not in emotions:
                    emotions[emotion] = 0.0
            
            return emotions
            
        except Exception as e:
            logger.error(f"Error in heuristic emotion classification: {e}")
            # Return neutral emotion as fallback
            return {emotion: 1.0 if emotion == 'neutral' else 0.0 for emotion in self.emotion_labels}
    
    async def _calculate_emotion_statistics(self, emotions_over_time: List[Dict]) -> Dict[str, Any]:
        """Calculate emotion statistics over time"""
        try:
            if not emotions_over_time:
                return {}
            
            # Aggregate emotions
            emotion_sums = {emotion: 0.0 for emotion in self.emotion_labels}
            emotion_counts = {emotion: 0 for emotion in self.emotion_labels}
            
            for frame_data in emotions_over_time:
                emotions = frame_data.get("emotions", {})
                for emotion, prob in emotions.items():
                    if emotion in emotion_sums:
                        emotion_sums[emotion] += prob
                        emotion_counts[emotion] += 1
            
            # Calculate averages
            emotion_averages = {}
            for emotion in self.emotion_labels:
                if emotion_counts[emotion] > 0:
                    emotion_averages[emotion] = emotion_sums[emotion] / emotion_counts[emotion]
                else:
                    emotion_averages[emotion] = 0.0
            
            # Find dominant emotion
            dominant_emotion = max(emotion_averages.items(), key=lambda x: x[1])
            
            # Calculate emotional variability
            emotional_variability = np.std(list(emotion_averages.values()))
            
            # Calculate positivity score (happy vs negative emotions)
            positive_score = emotion_averages.get('happy', 0) + emotion_averages.get('surprise', 0) * 0.5
            negative_score = (emotion_averages.get('sad', 0) + emotion_averages.get('angry', 0) + 
                            emotion_averages.get('fear', 0) + emotion_averages.get('disgust', 0))
            
            return {
                "emotion_averages": emotion_averages,
                "dominant_emotion": {
                    "emotion": dominant_emotion[0],
                    "probability": dominant_emotion[1]
                },
                "emotional_variability": float(emotional_variability),
                "positivity_score": float(positive_score),
                "negativity_score": float(negative_score),
                "neutrality_score": emotion_averages.get('neutral', 0.0)
            }
            
        except Exception as e:
            logger.error(f"Error calculating emotion statistics: {e}")
            return {}
    
    async def _analyze_temporal_patterns(self, emotions_over_time: List[Dict]) -> Dict[str, Any]:
        """Analyze how emotions change over time"""
        try:
            if len(emotions_over_time) < 2:
                return {"pattern": "insufficient_data"}
            
            # Track emotion changes
            emotion_changes = []
            previous_dominant = None
            
            for frame_data in emotions_over_time:
                emotions = frame_data.get("emotions", {})
                current_dominant = max(emotions.items(), key=lambda x: x[1])[0]
                
                if previous_dominant and current_dominant != previous_dominant:
                    emotion_changes.append({
                        "timestamp": frame_data["timestamp"],
                        "from": previous_dominant,
                        "to": current_dominant
                    })
                
                previous_dominant = current_dominant
            
            # Calculate consistency
            timestamps = [frame["timestamp"] for frame in emotions_over_time]
            duration = max(timestamps) - min(timestamps) if timestamps else 0
            
            change_frequency = len(emotion_changes) / duration if duration > 0 else 0
            
            return {
                "emotion_changes": emotion_changes,
                "change_frequency": float(change_frequency),  # changes per second
                "emotional_consistency": "high" if change_frequency < 0.1 else "medium" if change_frequency < 0.3 else "low",
                "total_duration": float(duration)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing temporal patterns: {e}")
            return {"pattern": "error", "error": str(e)}
    
    async def _calculate_engagement_metrics(self, emotion_stats: Dict) -> Dict[str, Any]:
        """Calculate engagement metrics based on facial emotions"""
        try:
            if not emotion_stats:
                return {"engagement_score": 0, "engagement_level": "unknown"}
            
            # Calculate engagement score based on emotion distribution
            positivity = emotion_stats.get("positivity_score", 0)
            variability = emotion_stats.get("emotional_variability", 0)
            neutrality = emotion_stats.get("neutrality_score", 0)
            
            # High positivity and some variability indicate good engagement
            # Too much neutrality or negativity reduces engagement
            engagement_score = (
                positivity * 4 +  # Positive emotions boost engagement
                variability * 2 +  # Some emotion variety is good
                max(0, 0.5 - neutrality) * 2  # Too much neutrality is bad
            )
            
            # Normalize to 0-10 scale
            engagement_score = min(10, max(0, engagement_score * 10))
            
            # Classify engagement level
            if engagement_score >= 7:
                engagement_level = "high"
            elif engagement_score >= 4:
                engagement_level = "medium"
            else:
                engagement_level = "low"
            
            return {
                "engagement_score": float(engagement_score),
                "engagement_level": engagement_level,
                "visual_appeal": "high" if positivity > 0.3 else "medium" if positivity > 0.1 else "low"
            }
            
        except Exception as e:
            logger.error(f"Error calculating engagement metrics: {e}")
            return {"engagement_score": 0, "engagement_level": "unknown"}
    
    async def _generate_recommendations(self, emotion_stats: Dict, temporal_analysis: Dict) -> List[str]:
        """Generate recommendations based on facial emotion analysis"""
        recommendations = []
        
        try:
            if not emotion_stats:
                return ["Unable to generate recommendations due to insufficient data"]
            
            positivity = emotion_stats.get("positivity_score", 0)
            neutrality = emotion_stats.get("neutrality_score", 0)
            variability = emotion_stats.get("emotional_variability", 0)
            
            if positivity < 0.2:
                recommendations.append("Try to smile more and show positive facial expressions")
            
            if neutrality > 0.7:
                recommendations.append("Vary your facial expressions to appear more engaging")
            
            if variability < 0.1:
                recommendations.append("Use more expressive facial gestures to emphasize points")
            
            change_frequency = temporal_analysis.get("change_frequency", 0)
            if change_frequency > 0.5:
                recommendations.append("Try to maintain consistent facial expressions for key points")
            
            if not recommendations:
                recommendations.append("Good facial expression control! Keep up the engaging presentation style")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return ["Unable to generate recommendations due to analysis error"]

    def _get_fallback_result(self, error_message: str) -> Dict[str, Any]:
        """Return a fallback result when analysis fails"""
        return {
            "error": error_message,
            "face_detection_rate": 0.0,
            "total_analyzed_frames": 0,
            "emotion_statistics": {
                "emotion_averages": {emotion: 0.0 for emotion in self.emotion_labels},
                "dominant_emotion": {"emotion": "neutral", "probability": 1.0},
                "emotional_variability": 0.0,
                "positivity_score": 0.0,
                "negativity_score": 0.0,
                "neutrality_score": 1.0
            },
            "temporal_analysis": {"pattern": "no_data"},
            "engagement_metrics": {"engagement_score": 5.0, "engagement_level": "unknown"},
            "overall_score": 5.0,
            "recommendations": ["Unable to analyze facial emotions due to technical issues"],
            "analysis_method": "fallback"
        }
