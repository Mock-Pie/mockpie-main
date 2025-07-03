import torch
import torchaudio
import numpy as np
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification
import librosa
import asyncio
import logging
from typing import Dict, List, Any
from scipy.stats import skew, kurtosis

logger = logging.getLogger(__name__)

class SpeechEmotionAnalyzer:
    """
    Enhanced Speech Emotion Recognition optimized for presentation analysis
    Includes confidence detection, engagement metrics, and presentation-specific features
    """
    
    def __init__(self):
        self.model_name = "facebook/wav2vec2-large-xlsr-53"
        self.emotion_model_name = "superb/wav2vec2-base-superb-er"
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.sample_rate = 16000
        
        try:
            # Load feature extractor and model
            self.feature_extractor = AutoFeatureExtractor.from_pretrained(self.emotion_model_name)
            self.model = AutoModelForAudioClassification.from_pretrained(self.emotion_model_name)
            self.model.to(self.device)
            self.model.eval()
            
            logger.info(f"Speech emotion model loaded on {self.device}")
        except Exception as e:
            logger.error(f"Error loading speech emotion model: {e}")
            # Fallback to a simpler approach
            self.feature_extractor = None
            self.model = None
    
    async def analyze(self, audio_path: str) -> Dict[str, Any]:
        """
        Enhanced emotion analysis for presentations with confidence and engagement metrics
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dictionary containing comprehensive emotion analysis results
        """
        print(f"🔊 DEBUG: Starting Enhanced Speech Emotion Analysis for {audio_path}")
        
        try:
            # Load and preprocess audio
            audio_data = await self._load_audio(audio_path)
            
            if self.model is None or self.feature_extractor is None:
                return self._get_error_result("Speech emotion model not loaded.")
            
            # Segment audio for temporal analysis
            segments = await self._segment_audio(audio_data)
            
            # Analyze each segment
            segment_results = []
            for i, segment in enumerate(segments):
                segment_result = await self._analyze_segment(segment, i)
                if segment_result is not None:
                    segment_results.append(segment_result)
            
            # Aggregate results
            final_results = await self._aggregate_segment_results(segment_results, audio_data)
            
            return final_results
            
        except Exception as e:
            logger.error(f"Error in speech emotion analysis: {e}")
            return self._get_error_result(str(e))
    
    async def _segment_audio(self, audio_data: np.ndarray, segment_duration: float = 5.0) -> List[np.ndarray]:
        """Segment audio into chunks for temporal analysis"""
        segment_samples = int(segment_duration * self.sample_rate)
        segments = []
        
        for i in range(0, len(audio_data), segment_samples):
            segment = audio_data[i:i + segment_samples]
            if len(segment) > self.sample_rate:  # At least 1 second
                segments.append(segment)
        
        return segments
    
    async def _analyze_segment(self, segment: np.ndarray, segment_idx: int) -> Dict[str, Any]:
        """Analyze emotion in a single audio segment"""
        try:
            if self.feature_extractor is None or self.model is None:
                return self._get_error_result("Speech emotion model or feature extractor not loaded.")
            # Extract features
            inputs = self.feature_extractor(
                segment, 
                sampling_rate=self.sample_rate, 
                return_tensors="pt"
            )
            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            # Run inference
            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            # Get emotion labels
            emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
            probs = predictions.cpu().numpy()[0]
            # Create emotions dictionary
            emotions = {}
            for i, label in enumerate(emotion_labels[:len(probs)]):
                emotions[label] = float(probs[i])
            # Calculate presentation-specific metrics
            confidence_score = await self._calculate_confidence_from_emotions(emotions, segment)
            engagement_score = await self._calculate_engagement_from_emotions(emotions)
            return {
                'segment_idx': segment_idx,
                'emotions': emotions,
                'confidence_score': confidence_score,
                'engagement_score': engagement_score,
                'dominant_emotion': max(emotions.items(), key=lambda x: x[1])
            }
        except Exception as e:
            logger.error(f"Error analyzing segment {segment_idx}: {e}")
            return self._get_error_result(f"Error analyzing segment {segment_idx}: {e}")
    
    async def _calculate_confidence_from_emotions(self, emotions: Dict[str, float], audio_segment: np.ndarray) -> float:
        """Calculate presentation confidence from emotional patterns and acoustic features"""
        try:
            # Emotional confidence indicators
            positive_emotions = emotions.get('happy', 0) + emotions.get('surprise', 0) * 0.5
            negative_emotions = emotions.get('fear', 0) + emotions.get('sad', 0) + emotions.get('angry', 0) * 0.5
            neutral_stable = emotions.get('neutral', 0)
            
            # Acoustic confidence indicators
            # Voice stability (lower variation = higher confidence)
            f0 = librosa.yin(audio_segment, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
            f0_valid = f0[f0 > 0]
            f0_stability = 1.0 - min(np.std(f0_valid) / np.mean(f0_valid), 1.0) if len(f0_valid) > 0 else 0.5
            
            # Energy consistency
            rms = librosa.feature.rms(y=audio_segment)[0]
            energy_consistency = 1.0 - min(np.std(rms) / np.mean(rms), 1.0) if np.mean(rms) > 0 else 0.5
            
            # Combine indicators
            emotional_confidence = (positive_emotions * 0.8 + neutral_stable * 0.6) - (negative_emotions * 0.4)
            acoustic_confidence = (f0_stability + energy_consistency) / 2
            
            # Weighted combination
            confidence = (emotional_confidence * 0.6 + acoustic_confidence * 0.4)
            return max(0.0, min(10.0, confidence * 10))
            
        except Exception as e:
            logger.error(f"Error calculating confidence: {e}")
            return 5.0
    
    async def _calculate_engagement_from_emotions(self, emotions: Dict[str, float]) -> float:
        """Calculate audience engagement potential from emotional expression"""
        try:
            # Engagement is higher with expressive emotions (not too neutral)
            expressive_emotions = (
                emotions.get('happy', 0) * 1.0 +
                emotions.get('surprise', 0) * 0.8 +
                emotions.get('angry', 0) * 0.6 +  # Passion can be engaging
                emotions.get('sad', 0) * 0.4  # Some emotional depth
            )
            
            # Penalize excessive fear or disgust
            negative_penalty = (emotions.get('fear', 0) + emotions.get('disgust', 0)) * 0.3
            
            # Moderate neutrality is okay, excessive neutrality reduces engagement
            neutral_factor = min(emotions.get('neutral', 0) * 1.5, 1.0)  # Cap the boost
            
            engagement = (expressive_emotions + neutral_factor * 0.5) - negative_penalty
            return max(0.0, min(10.0, engagement * 10))
            
        except Exception as e:
            logger.error(f"Error calculating engagement: {e}")
            return 5.0
    
    async def _aggregate_segment_results(self, segment_results: List[Dict], full_audio: np.ndarray) -> Dict[str, Any]:
        """Aggregate results from all segments into final analysis"""
        try:
            if not segment_results:
                return self._get_error_result("No segments analyzed successfully")
            
            # Aggregate emotions
            all_emotions = {}
            emotion_keys = segment_results[0]['emotions'].keys()
            
            for emotion in emotion_keys:
                values = [seg['emotions'][emotion] for seg in segment_results]
                all_emotions[emotion] = {
                    'mean': float(np.mean(values)),
                    'std': float(np.std(values)),
                    'max': float(np.max(values)),
                    'min': float(np.min(values))
                }
            
            # Calculate overall metrics
            confidence_scores = [seg['confidence_score'] for seg in segment_results]
            engagement_scores = [seg['engagement_score'] for seg in segment_results]
            
            overall_confidence = float(np.mean(confidence_scores))
            overall_engagement = float(np.mean(engagement_scores))
            
            # Emotional consistency (lower std = more consistent)
            emotion_consistency = 10.0 - min(np.mean([all_emotions[e]['std'] for e in emotion_keys]) * 20, 10.0)
            
            # Calculate presentation-specific overall score
            overall_score = await self._calculate_presentation_score(
                overall_confidence, overall_engagement, emotion_consistency, all_emotions
            )
            
            # Get dominant emotion across all segments
            mean_emotions = {k: v['mean'] for k, v in all_emotions.items()}
            dominant_emotion = max(mean_emotions.items(), key=lambda x: x[1])
            
            return {
                "emotions": mean_emotions,  # For backward compatibility
                "emotion_analysis": all_emotions,
                "dominant_emotion": {
                    "emotion": dominant_emotion[0],
                    "confidence": dominant_emotion[1]
                },
                "presentation_metrics": {
                    "confidence_score": overall_confidence,
                    "engagement_score": overall_engagement,
                    "emotion_consistency": emotion_consistency,
                    "emotional_range": float(np.max(list(mean_emotions.values())) - np.min(list(mean_emotions.values())))
                },
                "temporal_analysis": {
                    "segments_analyzed": len(segment_results),
                    "confidence_trend": confidence_scores,
                    "engagement_trend": engagement_scores
                },
                "overall_score": float(overall_score),
                "emotional_intensity": float(max(mean_emotions.values())),
                "neutrality_score": mean_emotions.get('neutral', 0.0),  # For backward compatibility
                "analysis_method": "enhanced_wav2vec2_presentation_analysis"
            }
            
        except Exception as e:
            logger.error(f"Error aggregating segment results: {e}")
            return self._get_error_result(str(e))
    
    async def _calculate_presentation_score(self, confidence: float, engagement: float, 
                                         consistency: float, emotions: Dict) -> float:
        """Calculate overall presentation score based on emotional analysis"""
        try:
            # Presentation benefits from:
            # 1. High confidence (40% weight)
            # 2. Good engagement (30% weight) 
            # 3. Emotional consistency (20% weight)
            # 4. Appropriate emotional balance (10% weight)
            
            # Emotional balance: not too much negative emotion
            positive_ratio = (emotions.get('happy', {}).get('mean', 0) + 
                            emotions.get('surprise', {}).get('mean', 0) * 0.5)
            negative_ratio = (emotions.get('fear', {}).get('mean', 0) + 
                            emotions.get('sad', {}).get('mean', 0) + 
                            emotions.get('angry', {}).get('mean', 0))
            
            balance_score = max(0, 10 - (negative_ratio * 15))  # Penalize excessive negative emotions
            
            # Weighted combination
            presentation_score = (
                confidence * 0.40 +
                engagement * 0.30 +
                consistency * 0.20 +
                balance_score * 0.10
            )
            
            return max(0.0, min(10.0, presentation_score))
            
        except Exception as e:
            logger.error(f"Error calculating presentation score: {e}")
            return 5.0

    async def _load_audio(self, audio_path: str) -> np.ndarray:
        """Load and preprocess audio file"""
        try:
            # Load audio with librosa
            audio, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Normalize audio
            audio = librosa.util.normalize(audio)
            
            return audio
            
        except Exception as e:
            logger.error(f"Error loading audio: {e}")
            raise

    def _get_error_result(self, error_message: str) -> Dict[str, Any]:
        """Return standardized error result"""
        return {
            "error": error_message,
            "emotions": {"neutral": 1.0},
            "dominant_emotion": {"emotion": "unknown", "confidence": 0.0},
            "presentation_metrics": {
                "confidence_score": 5.0,
                "engagement_score": 5.0,
                "emotion_consistency": 5.0,
                "emotional_range": 0.0
            },
            "overall_score": 5.0,
            "emotional_intensity": 0.0,
            "neutrality_score": 1.0
        }
