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
            
            if self.model is None:
                # Enhanced fallback analysis
                return await self._enhanced_fallback_analysis(audio_data)
            
            # Segment audio for temporal analysis
            segments = await self._segment_audio(audio_data)
            
            # Analyze each segment
            segment_results = []
            for i, segment in enumerate(segments):
                segment_result = await self._analyze_segment(segment, i)
                if segment_result:
                    segment_results.append(segment_result)
            
            # Aggregate results
            final_results = await self._aggregate_segment_results(segment_results, audio_data)
            
            return final_results
            
        except Exception as e:
            logger.error(f"Error in speech emotion analysis: {e}")
            return self._get_error_result(str(e))
    
    async def _segment_audio(self, audio_data: np.ndarray, segment_duration: float = 10.0) -> List[np.ndarray]:
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
            return None
    
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

    async def _enhanced_fallback_analysis(self, audio_data: np.ndarray) -> Dict[str, Any]:
        """
        Enhanced fallback analysis with sophisticated acoustic feature extraction
        """
        try:
            # Extract comprehensive acoustic features
            features = await self._extract_acoustic_features(audio_data)
            
            # Enhanced emotion estimation based on acoustic patterns
            emotions = await self._estimate_emotions_from_features(features)
            
            # Calculate presentation metrics
            confidence_score = await self._estimate_confidence_from_features(features)
            engagement_score = await self._estimate_engagement_from_features(features)
            
            # Calculate overall score
            overall_score = await self._calculate_presentation_score(
                confidence_score, engagement_score, 7.0, emotions  # Default consistency
            )
            
            dominant_emotion = max(emotions.items(), key=lambda x: x[1])
            
            return {
                "emotions": emotions,
                "dominant_emotion": {
                    "emotion": dominant_emotion[0],
                    "confidence": dominant_emotion[1]
                },
                "presentation_metrics": {
                    "confidence_score": confidence_score,
                    "engagement_score": engagement_score,
                    "emotion_consistency": 7.0,  # Default for fallback
                    "emotional_range": float(max(emotions.values()) - min(emotions.values()))
                },
                "acoustic_features": features,
                "overall_score": float(overall_score),
                "emotional_intensity": float(max(emotions.values())),
                "neutrality_score": emotions.get('neutral', 0.0),
                "analysis_method": "enhanced_acoustic_fallback_analysis"
            }
            
        except Exception as e:
            logger.error(f"Error in enhanced fallback analysis: {e}")
            return self._get_error_result(str(e))
    
    async def _extract_acoustic_features(self, audio_data: np.ndarray) -> Dict[str, float]:
        """Extract comprehensive acoustic features for emotion estimation"""
        try:
            # Fundamental frequency (pitch) features
            f0 = librosa.yin(audio_data, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
            f0_valid = f0[f0 > 0]
            
            # Spectral features
            spectral_centroid = librosa.feature.spectral_centroid(y=audio_data, sr=self.sample_rate)[0]
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=audio_data, sr=self.sample_rate)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=audio_data, sr=self.sample_rate)[0]
            zero_crossing_rate = librosa.feature.zero_crossing_rate(audio_data)[0]
            
            # Energy features
            rms = librosa.feature.rms(y=audio_data)[0]
            
            # MFCC features
            mfccs = librosa.feature.mfcc(y=audio_data, sr=self.sample_rate, n_mfcc=13)
            
            # Temporal features
            tempo, _ = librosa.beat.beat_track(y=audio_data, sr=self.sample_rate)
            
            return {
                "pitch_mean": float(np.mean(f0_valid)) if len(f0_valid) > 0 else 0.0,
                "pitch_std": float(np.std(f0_valid)) if len(f0_valid) > 0 else 0.0,
                "pitch_range": float(np.max(f0_valid) - np.min(f0_valid)) if len(f0_valid) > 0 else 0.0,
                "spectral_centroid_mean": float(np.mean(spectral_centroid)),
                "spectral_bandwidth_mean": float(np.mean(spectral_bandwidth)),
                "spectral_rolloff_mean": float(np.mean(spectral_rolloff)),
                "zero_crossing_rate_mean": float(np.mean(zero_crossing_rate)),
                "rms_mean": float(np.mean(rms)),
                "rms_std": float(np.std(rms)),
                "mfcc_mean": np.mean(mfccs, axis=1).tolist(),
                "tempo": float(tempo)
            }
            
        except Exception as e:
            logger.error(f"Error extracting acoustic features: {e}")
            return {}
    
    async def _estimate_emotions_from_features(self, features: Dict[str, float]) -> Dict[str, float]:
        """Estimate emotions using acoustic feature patterns"""
        try:
            emotions = {"happy": 0.1, "sad": 0.1, "angry": 0.1, "fear": 0.1, "neutral": 0.6, "surprise": 0.0, "disgust": 0.0}
            
            pitch_mean = features.get("pitch_mean", 150)
            pitch_std = features.get("pitch_std", 10)
            rms_mean = features.get("rms_mean", 0.01)
            spectral_centroid = features.get("spectral_centroid_mean", 2000)
            tempo = features.get("tempo", 120)
            
            # High pitch + high energy + high tempo = excitement/happiness
            if pitch_mean > 180 and rms_mean > 0.02 and tempo > 140:
                emotions["happy"] = 0.7
                emotions["surprise"] = 0.2
                emotions["neutral"] = 0.1
            
            # Low pitch + low energy = sadness
            elif pitch_mean < 120 and rms_mean < 0.01:
                emotions["sad"] = 0.6
                emotions["neutral"] = 0.3
                emotions["happy"] = 0.1
            
            # High pitch variability + high energy = anger or fear
            elif pitch_std > 20 and rms_mean > 0.015:
                if spectral_centroid > 2500:  # Harsh sounds = anger
                    emotions["angry"] = 0.5
                    emotions["fear"] = 0.3
                    emotions["neutral"] = 0.2
                else:  # Fear
                    emotions["fear"] = 0.5
                    emotions["angry"] = 0.2
                    emotions["neutral"] = 0.3
            
            # Moderate values = neutral with some positive
            else:
                emotions["neutral"] = 0.5
                emotions["happy"] = 0.3
                emotions["sad"] = 0.2
            
            return emotions
            
        except Exception as e:
            logger.error(f"Error estimating emotions: {e}")
            return {"neutral": 1.0}
    
    async def _estimate_confidence_from_features(self, features: Dict[str, float]) -> float:
        """Estimate speaker confidence from acoustic features"""
        try:
            pitch_std = features.get("pitch_std", 10)
            rms_std = features.get("rms_std", 0.005)
            pitch_mean = features.get("pitch_mean", 150)
            
            # Confident speakers typically have:
            # - Moderate pitch (not too high from nervousness)
            # - Stable energy (low RMS variation)
            # - Controlled pitch variation
            
            pitch_confidence = 10 - min(abs(pitch_mean - 140) / 10, 10)  # Optimal around 140 Hz
            stability_confidence = 10 - min(pitch_std / 5, 10)  # Less variation = more confident
            energy_confidence = 10 - min(rms_std * 1000, 10)  # Stable energy
            
            confidence = (pitch_confidence + stability_confidence + energy_confidence) / 3
            return max(0.0, min(10.0, confidence))
            
        except Exception as e:
            logger.error(f"Error estimating confidence: {e}")
            return 5.0
    
    async def _estimate_engagement_from_features(self, features: Dict[str, float]) -> float:
        """Estimate audience engagement potential from acoustic features"""
        try:
            pitch_range = features.get("pitch_range", 50)
            spectral_centroid = features.get("spectral_centroid_mean", 2000)
            tempo = features.get("tempo", 120)
            rms_mean = features.get("rms_mean", 0.01)
            
            # Engaging speakers typically have:
            # - Good pitch variation (expressive)
            # - Appropriate energy level
            # - Good speaking pace
            
            pitch_engagement = min(pitch_range / 20, 10)  # More variation = more engaging
            energy_engagement = min(rms_mean * 500, 10)  # Adequate energy
            pace_engagement = 10 - min(abs(tempo - 130) / 10, 10)  # Optimal around 130 BPM
            
            engagement = (pitch_engagement + energy_engagement + pace_engagement) / 3
            return max(0.0, min(10.0, engagement))
            
        except Exception as e:
            logger.error(f"Error estimating engagement: {e}")
            return 5.0
    
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
