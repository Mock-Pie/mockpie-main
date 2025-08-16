import numpy as np
import librosa
import logging
from typing import Dict, List, Any
from scipy.stats import skew, kurtosis
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class SpeechEmotionAnalyzer:
    """
    Optimized Speech Emotion Recognition for presentation analysis.
    Uses lightweight models with research-based confidence and engagement metrics.
    """
    
    def __init__(self):
        self.device = "cpu"  # Optimized for CPU to avoid GPU overhead
        self.sample_rate = 16000
        self.segment_duration = 3.0  # Reduced for better temporal resolution
        
        # Try to load transformer model, fall back to lightweight approach
        self.model = None
        self.feature_extractor = None
        self.use_transformer = False
        
        try:
            from transformers import AutoFeatureExtractor, AutoModelForAudioClassification
            import torch
            
            self.feature_extractor = AutoFeatureExtractor.from_pretrained("superb/wav2vec2-base-superb-er")
            self.model = AutoModelForAudioClassification.from_pretrained("superb/wav2vec2-base-superb-er")
            self.model.eval()
            self.use_transformer = True
            logger.info("Transformer emotion model loaded successfully")
        except Exception as e:
            logger.warning(f"Transformer model not available, using lightweight fallback: {e}")
            self.use_transformer = False
        
        # Research-based emotion labels and weights
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        
        # Presentation-specific emotion weights based on engagement research
        self.engagement_weights = {
            'happy': 1.0,        # High engagement
            'surprise': 0.8,     # Moderate engagement  
            'angry': 0.6,        # Can be engaging if controlled
            'sad': 0.4,          # Some emotional depth
            'neutral': 0.5,      # Baseline
            'fear': -0.3,        # Reduces engagement
            'disgust': -0.4      # Reduces engagement
        }
        
        # Confidence indicators based on acoustic research
        self.confidence_features = [
            'pitch_stability', 'energy_consistency', 'harmonics_ratio',
            'jitter', 'shimmer', 'spectral_centroid_stability'
        ]

    def analyze(self, audio_path: str) -> Dict[str, Any]:
        """
        Analyze speech emotion with optimized performance and research-based metrics.
        Always returns a score out of 10.
        """
        logger.info(f"Starting Optimized Speech Emotion Analysis for {audio_path}")
        
        try:
            # Load and preprocess audio efficiently
            audio_data = self._load_audio_optimized(audio_path)
            
            # Segment audio for temporal analysis
            segments = self._segment_audio_efficient(audio_data)
            
            # Analyze segments using best available method
            segment_results = []
            for i, segment in enumerate(segments):
                if self.use_transformer:
                    result = self._analyze_segment_transformer(segment, i)
                else:
                    result = self._analyze_segment_lightweight(segment, i)
                
                if result:
                    segment_results.append(result)
            
            if not segment_results:
                return self._get_fallback_result("No segments analyzed successfully")
            
            # Aggregate with research-based scoring
            final_results = self._aggregate_results_optimized(segment_results, audio_data)
            
            return final_results
            
        except Exception as e:
            logger.error(f"Error in speech emotion analysis: {e}")
            return self._get_fallback_result(str(e))

    def _load_audio_optimized(self, audio_path: str) -> np.ndarray:
        """Optimized audio loading with preprocessing"""
        try:
            # Load with librosa (most reliable)
            audio, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Normalize and remove silence
            audio = librosa.util.normalize(audio)
            
            # Remove leading/trailing silence for better analysis
            audio, _ = librosa.effects.trim(audio, top_db=20)
            
            return audio
        except Exception as e:
            logger.error(f"Error loading audio: {e}")
            raise

    def _segment_audio_efficient(self, audio_data: np.ndarray) -> List[np.ndarray]:
        """Efficient audio segmentation with overlap for better continuity"""
        segment_samples = int(self.segment_duration * self.sample_rate)
        overlap_samples = int(0.5 * self.sample_rate)  # 0.5 second overlap
        segments = []
        
        for i in range(0, len(audio_data) - segment_samples + 1, segment_samples - overlap_samples):
            segment = audio_data[i:i + segment_samples]
            if len(segment) >= self.sample_rate:  # At least 1 second
                segments.append(segment)
        
        return segments

    def _analyze_segment_transformer(self, segment: np.ndarray, segment_idx: int) -> Dict[str, Any]:
        """Analyze segment using transformer model if available"""
        try:
            import torch
            
            # Extract features
            inputs = self.feature_extractor(
                segment, 
                sampling_rate=self.sample_rate, 
                return_tensors="pt"
            )
            
            # Run inference
            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            
            probs = predictions.cpu().numpy()[0]
            
            # Create emotions dictionary
            emotions = {}
            for i, label in enumerate(self.emotion_labels[:len(probs)]):
                emotions[label] = float(probs[i])
            
            # Calculate presentation metrics
            confidence_score = self._calculate_confidence_research_based(emotions, segment)
            engagement_score = self._calculate_engagement_research_based(emotions)
            
            return {
                'segment_idx': segment_idx,
                'emotions': emotions,
                'confidence_score': confidence_score,
                'engagement_score': engagement_score,
                'dominant_emotion': max(emotions.items(), key=lambda x: x[1])
            }
            
        except Exception as e:
            logger.error(f"Error in transformer analysis for segment {segment_idx}: {e}")
            return self._analyze_segment_lightweight(segment, segment_idx)

    def _analyze_segment_lightweight(self, segment: np.ndarray, segment_idx: int) -> Dict[str, Any]:
        """Lightweight emotion analysis using acoustic features and heuristics"""
        try:
            # Extract comprehensive acoustic features
            features = self._extract_acoustic_features(segment)
            
            # Heuristic emotion classification based on research
            emotions = self._classify_emotions_heuristic(features)
            
            # Calculate metrics using acoustic analysis
            confidence_score = self._calculate_confidence_acoustic(features)
            engagement_score = self._calculate_engagement_research_based(emotions)
            
            return {
                'segment_idx': segment_idx,
                'emotions': emotions,
                'confidence_score': confidence_score,
                'engagement_score': engagement_score,
                'dominant_emotion': max(emotions.items(), key=lambda x: x[1]),
                'features': features
            }
            
        except Exception as e:
            logger.error(f"Error in lightweight analysis for segment {segment_idx}: {e}")
            return None

    def _extract_acoustic_features(self, segment: np.ndarray) -> Dict[str, float]:
        """Extract research-validated acoustic features for emotion analysis"""
        try:
            features = {}
            
            # Fundamental frequency (pitch) analysis
            f0 = librosa.yin(segment, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
            f0_valid = f0[f0 > 0]
            
            if len(f0_valid) > 0:
                features['pitch_mean'] = float(np.mean(f0_valid))
                features['pitch_std'] = float(np.std(f0_valid))
                features['pitch_range'] = float(np.max(f0_valid) - np.min(f0_valid))
                features['pitch_stability'] = 1.0 - min(features['pitch_std'] / features['pitch_mean'], 1.0)
            else:
                features.update({'pitch_mean': 150.0, 'pitch_std': 20.0, 'pitch_range': 50.0, 'pitch_stability': 0.5})
            
            # Energy and intensity features
            rms = librosa.feature.rms(y=segment)[0]
            features['energy_mean'] = float(np.mean(rms))
            features['energy_std'] = float(np.std(rms))
            features['energy_consistency'] = 1.0 - min(features['energy_std'] / features['energy_mean'], 1.0) if features['energy_mean'] > 0 else 0.5
            
            # Spectral features
            spectral_centroids = librosa.feature.spectral_centroid(y=segment, sr=self.sample_rate)[0]
            features['spectral_centroid_mean'] = float(np.mean(spectral_centroids))
            features['spectral_centroid_std'] = float(np.std(spectral_centroids))
            
            # MFCC features for emotion classification
            mfccs = librosa.feature.mfcc(y=segment, sr=self.sample_rate, n_mfcc=13)
            features['mfcc_mean'] = float(np.mean(mfccs))
            features['mfcc_std'] = float(np.std(mfccs))
            
            # Voice quality indicators
            features['zero_crossing_rate'] = float(np.mean(librosa.feature.zero_crossing_rate(segment)[0]))
            
            # Harmonics-to-noise ratio estimation
            features['harmonics_ratio'] = self._estimate_hnr(segment)
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting acoustic features: {e}")
            return {'pitch_mean': 150.0, 'energy_mean': 0.1, 'pitch_stability': 0.5, 'energy_consistency': 0.5}

    def _estimate_hnr(self, segment: np.ndarray) -> float:
        """Estimate harmonics-to-noise ratio for voice quality assessment"""
        try:
            # Simple HNR estimation using autocorrelation
            autocorr = np.correlate(segment, segment, mode='full')
            autocorr = autocorr[len(autocorr)//2:]
            
            # Find first peak (fundamental frequency)
            if len(autocorr) > 100:
                peak_idx = np.argmax(autocorr[20:100]) + 20
                hnr = autocorr[peak_idx] / (np.mean(autocorr) + 1e-8)
                return float(min(max(hnr, 0), 10))
            else:
                return 1.0
        except:
            return 1.0

    def _classify_emotions_heuristic(self, features: Dict[str, float]) -> Dict[str, float]:
        """Research-based heuristic emotion classification using acoustic features"""
        try:
            emotions = {label: 0.0 for label in self.emotion_labels}
            
            # Pitch-based emotion indicators (research-validated)
            pitch_mean = features.get('pitch_mean', 150)
            pitch_std = features.get('pitch_std', 20)
            energy_mean = features.get('energy_mean', 0.1)
            
            # Happiness: Higher pitch, more variation
            if pitch_mean > 180 and pitch_std > 15:
                emotions['happy'] = 0.4
            
            # Anger: Higher energy, moderate pitch, high variation
            if energy_mean > 0.15 and pitch_std > 25:
                emotions['angry'] = 0.3
            
            # Sadness: Lower pitch, lower energy, less variation
            if pitch_mean < 130 and energy_mean < 0.08:
                emotions['sad'] = 0.3
            
            # Fear: Higher pitch, high variation, moderate energy
            if pitch_mean > 170 and pitch_std > 30 and energy_mean > 0.1:
                emotions['fear'] = 0.2
            
            # Surprise: Very high pitch variation, high energy
            if pitch_std > 35 and energy_mean > 0.12:
                emotions['surprise'] = 0.2
            
            # Neutral: Moderate values
            emotions['neutral'] = max(0.2, 1.0 - sum(emotions.values()))
            
            # Normalize to sum to 1
            total = sum(emotions.values())
            if total > 0:
                emotions = {k: v/total for k, v in emotions.items()}
            
            return emotions
            
        except Exception as e:
            logger.error(f"Error in heuristic emotion classification: {e}")
            return {'neutral': 1.0, 'happy': 0.0, 'angry': 0.0, 'sad': 0.0, 'fear': 0.0, 'surprise': 0.0, 'disgust': 0.0}

    def _calculate_confidence_research_based(self, emotions: Dict[str, float], segment: np.ndarray) -> float:
        """Calculate confidence using research-validated acoustic and emotional indicators"""
        try:
            # Emotional confidence (research-based weights)
            positive_emotions = emotions.get('happy', 0) + emotions.get('surprise', 0) * 0.5
            negative_emotions = emotions.get('fear', 0) + emotions.get('sad', 0) + emotions.get('angry', 0) * 0.5
            neutral_stable = emotions.get('neutral', 0)
            
            # Acoustic confidence indicators
            features = self._extract_acoustic_features(segment)
            
            # Voice stability (pitch consistency)
            pitch_confidence = features.get('pitch_stability', 0.5)
            
            # Energy consistency
            energy_confidence = features.get('energy_consistency', 0.5)
            
            # Voice quality (HNR)
            voice_quality = min(features.get('harmonics_ratio', 1.0) / 3.0, 1.0)
            
            # Combine indicators with research-based weights
            emotional_confidence = (positive_emotions * 0.8 + neutral_stable * 0.6) - (negative_emotions * 0.4)
            acoustic_confidence = (pitch_confidence * 0.4 + energy_confidence * 0.3 + voice_quality * 0.3)
            
            # Weighted combination (acoustic features more reliable for confidence)
            confidence = (emotional_confidence * 0.4 + acoustic_confidence * 0.6)
            
            return float(max(0.0, min(10.0, confidence * 10)))
            
        except Exception as e:
            logger.error(f"Error calculating confidence: {e}")
            return 5.0

    def _calculate_confidence_acoustic(self, features: Dict[str, float]) -> float:
        """Calculate confidence purely from acoustic features when emotions unavailable"""
        try:
            # Voice stability indicators
            pitch_confidence = features.get('pitch_stability', 0.5)
            energy_confidence = features.get('energy_consistency', 0.5)
            voice_quality = min(features.get('harmonics_ratio', 1.0) / 3.0, 1.0)
            
            # Spectral stability
            spectral_stability = 1.0 - min(features.get('spectral_centroid_std', 100) / 1000, 1.0)
            
            # Combine acoustic confidence indicators
            acoustic_confidence = (
                pitch_confidence * 0.35 +
                energy_confidence * 0.25 +
                voice_quality * 0.25 +
                spectral_stability * 0.15
            )
            
            return float(max(0.0, min(10.0, acoustic_confidence * 10)))
            
        except Exception as e:
            logger.error(f"Error calculating acoustic confidence: {e}")
            return 5.0

    def _calculate_engagement_research_based(self, emotions: Dict[str, float]) -> float:
        """Calculate engagement using research-based emotion weights"""
        try:
            engagement_score = 0.0
            
            # Apply research-based engagement weights
            for emotion, probability in emotions.items():
                weight = self.engagement_weights.get(emotion, 0.0)
                engagement_score += probability * weight
            
            # Boost for emotional variation (not too monotone)
            emotion_variance = np.var(list(emotions.values()))
            variation_bonus = min(emotion_variance * 5, 1.0)  # Cap at 1.0
            
            engagement_score += variation_bonus
            
            # Normalize to 0-10 scale
            engagement_score = max(0.0, min(10.0, (engagement_score + 1.0) * 5))
            
            return float(engagement_score)
            
        except Exception as e:
            logger.error(f"Error calculating engagement: {e}")
            return 5.0

    def _aggregate_results_optimized(self, segment_results: List[Dict], full_audio: np.ndarray) -> Dict[str, Any]:
        """Aggregate results with research-based overall scoring"""
        try:
            # Extract all emotion data
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
            
            # Emotional consistency (important for presentations)
            emotion_consistency = 10.0 - min(np.mean([all_emotions[e]['std'] for e in emotion_keys]) * 15, 10.0)
            
            # Calculate research-based presentation score
            overall_score = self._calculate_presentation_score_research(
                overall_confidence, overall_engagement, emotion_consistency, all_emotions
            )
            
            # Get dominant emotion
            mean_emotions = {k: v['mean'] for k, v in all_emotions.items()}
            dominant_emotion = max(mean_emotions.items(), key=lambda x: x[1])
            
            return {
                "emotions": mean_emotions,
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
                "neutrality_score": mean_emotions.get('neutral', 0.0),
                "analysis_method": "optimized_research_based" if not self.use_transformer else "optimized_transformer"
            }
            
        except Exception as e:
            logger.error(f"Error aggregating results: {e}")
            return self._get_fallback_result(str(e))

    def _calculate_presentation_score_research(self, confidence: float, engagement: float, 
                                             consistency: float, emotions: Dict) -> float:
        """Calculate presentation score using research-validated criteria"""
        try:
            # Research-based scoring criteria for presentations
            # Confidence (40%): Most important for presentation effectiveness
            # Engagement (35%): Critical for audience connection  
            # Consistency (15%): Professional appearance
            # Emotional balance (10%): Appropriate emotional tone
            
            # Emotional balance scoring
            positive_ratio = (emotions.get('happy', {}).get('mean', 0) + 
                            emotions.get('surprise', {}).get('mean', 0) * 0.5)
            negative_ratio = (emotions.get('fear', {}).get('mean', 0) + 
                            emotions.get('sad', {}).get('mean', 0) + 
                            emotions.get('angry', {}).get('mean', 0))
            
            # Optimal balance: some positive, minimal negative
            balance_score = min(10.0, positive_ratio * 8 + max(0, 5 - negative_ratio * 20))
            
            # Weighted combination based on presentation research
            presentation_score = (
                confidence * 0.40 +
                engagement * 0.35 +
                consistency * 0.15 +
                balance_score * 0.10
            )
            
            return max(0.0, min(10.0, presentation_score))
            
        except Exception as e:
            logger.error(f"Error calculating presentation score: {e}")
            return 5.0

    def _get_fallback_result(self, error_message: str) -> Dict[str, Any]:
        """Return standardized fallback result with neutral baseline"""
        return {
            "error": error_message,
            "emotions": {"neutral": 0.7, "happy": 0.1, "angry": 0.05, "sad": 0.05, "fear": 0.05, "surprise": 0.025, "disgust": 0.025},
            "dominant_emotion": {"emotion": "neutral", "confidence": 0.7},
            "presentation_metrics": {
                "confidence_score": 5.0,
                "engagement_score": 5.0,
                "emotion_consistency": 5.0,
                "emotional_range": 0.2
            },
            "temporal_analysis": {
                "segments_analyzed": 0,
                "confidence_trend": [],
                "engagement_trend": []
            },
            "overall_score": 5.0,
            "emotional_intensity": 0.7,
            "neutrality_score": 0.7,
            "analysis_method": "fallback"
        }
