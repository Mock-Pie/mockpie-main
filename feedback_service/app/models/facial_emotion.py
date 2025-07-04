import cv2
import numpy as np
import torch
from transformers import pipeline
import mediapipe as mp
import logging
from typing import Dict, List, Any, Tuple, Optional
from concurrent.futures import ProcessPoolExecutor
import scipy.stats

logger = logging.getLogger(__name__)

class FacialEmotionAnalyzer:
    def __init__(self, frame_sample_rate: int = 30):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.mp_face_detection = mp.solutions.face_detection
        self.face_detection = self.mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)
        self.emotion_classifier = None
        self.transformer_available = False
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        self.frame_sample_rate = frame_sample_rate
        try:
            self.emotion_classifier = pipeline(
                "image-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                device=0 if torch.cuda.is_available() else -1
            )
            from PIL import Image
            test_image = Image.fromarray(np.zeros((64, 64, 3), dtype=np.uint8))
            test_result = self.emotion_classifier(test_image)
            if test_result and isinstance(test_result, list):
                self.transformer_available = True
                logger.info("Facial emotion model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load emotion model: {e}")
            self.transformer_available = False

    def analyze(self, video_path: str) -> Dict[str, Any]:
        logger.info(f"Starting Facial Emotion Analysis for {video_path}")
        if not self.transformer_available:
            logger.warning("Transformer-based emotion classifier not available, using heuristics.")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return self._get_fallback_result("Could not open video file")

        frame_count = 0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frames_to_analyze = []
        timestamps = []
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_count % self.frame_sample_rate == 0:
                frames_to_analyze.append(frame)
                timestamps.append(frame_count / fps)
            frame_count += 1
        cap.release()

        # Sequential analysis to avoid pickling issues with transformers
        results = []
        for frame, timestamp in zip(frames_to_analyze, timestamps):
            result = self._analyze_frame_worker((frame, timestamp))
            if result is not None:
                results.append(result)

        emotions_over_time = [res for res in results if res is not None]
        if not emotions_over_time:
            return self._get_fallback_result("No faces detected in video")

        # Analyze results
        emotion_stats = self._calculate_emotion_statistics(emotions_over_time)
        temporal_analysis = self._analyze_temporal_patterns(emotions_over_time)
        face_detection_rate = len(emotions_over_time) / len(frames_to_analyze)

        return {
            "face_detection_rate": float(face_detection_rate),
            "total_analyzed_frames": len(emotions_over_time),
            "emotion_statistics": emotion_stats,
            "temporal_analysis": temporal_analysis,
            "analysis_method": "transformer" if self.transformer_available else "heuristic"
        }

    def _analyze_frame_worker(self, args):
        frame, timestamp = args
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_detection.process(rgb_frame)
            if not results.detections:
                return None
            largest_face = max(results.detections, key=lambda d: d.location_data.relative_bounding_box.width)
            h, w, _ = frame.shape
            bbox = largest_face.location_data.relative_bounding_box
            x = max(0, int(bbox.xmin * w))
            y = max(0, int(bbox.ymin * h))
            width = min(int(bbox.width * w), w - x)
            height = min(int(bbox.height * h), h - y)
            if width <= 0 or height <= 0:
                return None
            face_crop = rgb_frame[y:y+height, x:x+width]
            emotion_probs = self._classify_emotion(face_crop)
            return {
                "timestamp": timestamp,
                "emotions": emotion_probs,
                "face_confidence": float(largest_face.score[0]),
                "face_bbox": {"x": x, "y": y, "width": width, "height": height}
            }
        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            return None

    def _classify_emotion(self, face_crop: np.ndarray) -> Dict[str, float]:
        try:
            if self.transformer_available and self.emotion_classifier is not None:
                from PIL import Image
                face_image = Image.fromarray(face_crop)
                results = self.emotion_classifier(face_image)
                emotion_probs = {e: 0.0 for e in self.emotion_labels}
                for result in results:
                    label = result['label'].lower()
                    if label in emotion_probs:
                        emotion_probs[label] = float(result['score'])
                total = sum(emotion_probs.values())
                if total > 0:
                    emotion_probs = {k: v/total for k, v in emotion_probs.items()}
                return emotion_probs
            else:
                gray_face = cv2.cvtColor(face_crop, cv2.COLOR_RGB2GRAY)
                brightness = np.mean(gray_face) / 255.0
                emotions = {}
                if brightness > 0.6:
                    emotions['happy'] = 0.5
                    emotions['neutral'] = 0.3
                    emotions['surprise'] = 0.2
                elif brightness < 0.3:
                    emotions['sad'] = 0.5
                    emotions['neutral'] = 0.3
                    emotions['angry'] = 0.2
                else:
                    emotions['neutral'] = 0.6
                    emotions['happy'] = 0.2
                    emotions['sad'] = 0.2
                for emotion in self.emotion_labels:
                    if emotion not in emotions:
                        emotions[emotion] = 0.0
                return emotions
        except Exception as e:
            logger.error(f"Error in emotion classification: {e}")
            return {emotion: 1.0 if emotion == 'neutral' else 0.0 for emotion in self.emotion_labels}

    def _calculate_emotion_statistics(self, emotions_over_time: List[Dict]) -> Dict[str, Any]:
        try:
            if not emotions_over_time:
                return {}
            emotion_sums = {emotion: 0.0 for emotion in self.emotion_labels}
            emotion_counts = {emotion: 0 for emotion in self.emotion_labels}
            for frame_data in emotions_over_time:
                emotions = frame_data.get("emotions", {})
                for emotion, prob in emotions.items():
                    if emotion in emotion_sums:
                        emotion_sums[emotion] += prob
                        emotion_counts[emotion] += 1
            emotion_averages = {}
            for emotion in self.emotion_labels:
                if emotion_counts[emotion] > 0:
                    emotion_averages[emotion] = emotion_sums[emotion] / emotion_counts[emotion]
                else:
                    emotion_averages[emotion] = 0.0
            dominant_emotion = max(emotion_averages.items(), key=lambda x: x[1])
            emotional_variability = np.std(list(emotion_averages.values()))
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

    def _analyze_temporal_patterns(self, emotions_over_time: List[Dict]) -> Dict[str, Any]:
        try:
            if len(emotions_over_time) < 2:
                return {"pattern": "insufficient_data"}
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
            timestamps = [frame["timestamp"] for frame in emotions_over_time]
            duration = max(timestamps) - min(timestamps) if timestamps else 0
            change_frequency = len(emotion_changes) / duration if duration > 0 else 0
            return {
                "emotion_changes": emotion_changes,
                "change_frequency": float(change_frequency),
                "emotional_consistency": "high" if change_frequency < 0.1 else "medium" if change_frequency < 0.3 else "low",
                "total_duration": float(duration)
            }
        except Exception as e:
            logger.error(f"Error analyzing temporal patterns: {e}")
            return {"pattern": "error", "error": str(e)}

    def _get_fallback_result(self, error_message: str) -> Dict[str, Any]:
        logger.error(error_message)
        return {
            "error": error_message,
            "face_detection_rate": 0.0,
            "total_analyzed_frames": 0,
            "emotion_statistics": {},
            "temporal_analysis": {},
            "analysis_method": "error"
        }
