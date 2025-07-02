import numpy as np
import librosa
import parselmouth
from parselmouth.praat import call
import asyncio
import logging
from typing import Dict, List, Any, Tuple

logger = logging.getLogger(__name__)

class PitchAnalyzer:
    """
    Pitch and Intonation Analysis using Parselmouth (Praat wrapper)
    Analyzes fundamental frequency variation and intonation patterns
    """
    
    def __init__(self):
        self.sample_rate = 22050
        self.min_pitch = 75  # Hz
        self.max_pitch = 500  # Hz
        
    async def analyze(self, audio_path: str) -> Dict[str, Any]:
        """
        Analyze pitch characteristics of speech
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dictionary containing pitch analysis results
        """
        print(f"🎵 DEBUG: Starting Pitch Analysis for {audio_path}")
        
        try:
            # Load audio with parselmouth
            sound = parselmouth.Sound(audio_path)
            
            # Extract pitch
            pitch = await self._extract_pitch(sound)
            
            # Calculate pitch statistics
            pitch_stats = await self._calculate_pitch_statistics(pitch)
            
            # Analyze intonation patterns
            intonation_analysis = await self._analyze_intonation(pitch)
            
            # Calculate variation metrics
            variation_metrics = await self._calculate_variation_metrics(pitch)
            
            # Assess monotone vs dynamic speaking
            speaking_style = await self._assess_speaking_style(pitch_stats, variation_metrics)
            
            # Calculate overall score (0-10) based on pitch engagement and variation
            overall_score = await self._calculate_overall_score(pitch_stats, variation_metrics, speaking_style)
            
            return {
                "pitch_statistics": pitch_stats,
                "intonation_patterns": intonation_analysis,
                "variation_metrics": variation_metrics,
                "speaking_style": speaking_style,
                "overall_score": float(overall_score),
                "recommendations": await self._generate_recommendations(pitch_stats, variation_metrics)
            }
            
        except Exception as e:
            logger.error(f"Error in pitch analysis: {e}")
            return await self._fallback_analysis(audio_path)
    
    async def _extract_pitch(self, sound) -> parselmouth.Pitch:
        """Extract pitch using Praat algorithm"""
        try:
            pitch = call(sound, "To Pitch", 0.0, self.min_pitch, self.max_pitch)
            return pitch
        except Exception as e:
            logger.error(f"Error extracting pitch: {e}")
            raise
    
    async def _calculate_pitch_statistics(self, pitch) -> Dict[str, float]:
        """Calculate basic pitch statistics"""
        try:
            # Get pitch values
            pitch_values = pitch.selected_array['frequency']
            pitch_values = pitch_values[pitch_values != 0]  # Remove unvoiced frames
            
            if len(pitch_values) == 0:
                return {
                    "mean_pitch": 0.0,
                    "median_pitch": 0.0,
                    "std_pitch": 0.0,
                    "min_pitch": 0.0,
                    "max_pitch": 0.0,
                    "pitch_range": 0.0,
                    "voiced_frames_percentage": 0.0
                }
            
            # Calculate statistics
            mean_pitch = float(np.mean(pitch_values))
            median_pitch = float(np.median(pitch_values))
            std_pitch = float(np.std(pitch_values))
            min_pitch = float(np.min(pitch_values))
            max_pitch = float(np.max(pitch_values))
            pitch_range = max_pitch - min_pitch
            
            # Calculate voiced frames percentage
            total_frames = len(pitch.selected_array['frequency'])
            voiced_frames = len(pitch_values)
            voiced_percentage = (voiced_frames / total_frames) * 100 if total_frames > 0 else 0
            
            return {
                "mean_pitch": mean_pitch,
                "median_pitch": median_pitch,
                "std_pitch": std_pitch,
                "min_pitch": min_pitch,
                "max_pitch": max_pitch,
                "pitch_range": pitch_range,
                "voiced_frames_percentage": float(voiced_percentage)
            }
            
        except Exception as e:
            logger.error(f"Error calculating pitch statistics: {e}")
            return {}
    
    async def _analyze_intonation(self, pitch) -> Dict[str, Any]:
        """Analyze intonation patterns and contours"""
        try:
            pitch_values = pitch.selected_array['frequency']
            pitch_values = pitch_values[pitch_values != 0]
            
            if len(pitch_values) < 10:
                return {"pattern": "insufficient_data", "contour_type": "unknown"}
            
            # Smooth pitch for contour analysis
            smoothed_pitch = np.convolve(pitch_values, np.ones(5)/5, mode='same')
            
            # Calculate pitch slope (overall trend)
            x = np.arange(len(smoothed_pitch))
            slope, intercept = np.polyfit(x, smoothed_pitch, 1)
            
            # Detect contour type
            contour_type = self._classify_contour(smoothed_pitch, slope)
            
            # Calculate pitch movements
            pitch_movements = self._analyze_pitch_movements(smoothed_pitch)
            
            # Detect stress patterns
            stress_pattern = self._detect_stress_pattern(pitch_values)
            
            return {
                "overall_slope": float(slope),
                "contour_type": contour_type,
                "pitch_movements": pitch_movements,
                "stress_pattern": stress_pattern,
                "intonation_variability": float(np.std(np.diff(smoothed_pitch)))
            }
            
        except Exception as e:
            logger.error(f"Error analyzing intonation: {e}")
            return {"pattern": "error", "error": str(e)}
    
    def _classify_contour(self, pitch_values: np.ndarray, slope: float) -> str:
        """Classify overall pitch contour"""
        if abs(slope) < 0.1:
            return "flat"
        elif slope > 0.1:
            return "rising"
        else:
            return "falling"
    
    def _analyze_pitch_movements(self, pitch_values: np.ndarray) -> Dict[str, int]:
        """Analyze pitch movements (rises and falls)"""
        diff = np.diff(pitch_values)
        
        rises = np.sum(diff > 2)  # Significant rises
        falls = np.sum(diff < -2)  # Significant falls
        
        return {
            "rises": int(rises),
            "falls": int(falls),
            "total_movements": int(rises + falls)
        }
    
    def _detect_stress_pattern(self, pitch_values: np.ndarray) -> Dict[str, Any]:
        """Detect stress and emphasis patterns"""
        # Find peaks (potential stress points)
        from scipy.signal import find_peaks
        
        try:
            peaks, properties = find_peaks(pitch_values, height=np.mean(pitch_values) + np.std(pitch_values))
            
            return {
                "stress_points": len(peaks),
                "average_stress_height": float(np.mean(pitch_values[peaks])) if len(peaks) > 0 else 0.0,
                "stress_frequency": len(peaks) / (len(pitch_values) / 100)  # per 100 frames
            }
        except:
            return {
                "stress_points": 0,
                "average_stress_height": 0.0,
                "stress_frequency": 0.0
            }
    
    async def _calculate_variation_metrics(self, pitch) -> Dict[str, float]:
        """Calculate pitch variation metrics"""
        try:
            pitch_values = pitch.selected_array['frequency']
            pitch_values = pitch_values[pitch_values != 0]
            
            if len(pitch_values) == 0:
                return {
                    "coefficient_of_variation": 0.0,
                    "semitone_range": 0.0,
                    "pitch_dynamism": 0.0
                }
            
            # Coefficient of variation
            cv = (np.std(pitch_values) / np.mean(pitch_values)) * 100
            
            # Semitone range
            semitone_range = 12 * np.log2(np.max(pitch_values) / np.min(pitch_values))
            
            # Pitch dynamism (how much pitch changes over time)
            pitch_diff = np.abs(np.diff(pitch_values))
            dynamism = np.mean(pitch_diff)
            
            return {
                "coefficient_of_variation": float(cv),
                "semitone_range": float(semitone_range),
                "pitch_dynamism": float(dynamism)
            }
            
        except Exception as e:
            logger.error(f"Error calculating variation metrics: {e}")
            return {
                "coefficient_of_variation": 0.0,
                "semitone_range": 0.0,
                "pitch_dynamism": 0.0
            }
    
    async def _assess_speaking_style(self, pitch_stats: Dict, variation_metrics: Dict) -> Dict[str, Any]:
        """Assess speaking style based on pitch analysis"""
        try:
            cv = variation_metrics.get("coefficient_of_variation", 0)
            semitone_range = variation_metrics.get("semitone_range", 0)
            dynamism = variation_metrics.get("pitch_dynamism", 0)
            
            # Classify speaking style
            if cv < 10 and semitone_range < 3:
                style = "monotone"
                engagement_score = 2
            elif cv < 20 and semitone_range < 6:
                style = "somewhat_varied"
                engagement_score = 5
            elif cv < 30 and semitone_range < 12:
                style = "varied"
                engagement_score = 8
            else:
                style = "highly_dynamic"
                engagement_score = 10
            
            return {
                "speaking_style": style,
                "engagement_score": engagement_score,
                "monotone_risk": cv < 15,
                "expressiveness_level": "high" if cv > 25 else "medium" if cv > 15 else "low"
            }
            
        except Exception as e:
            logger.error(f"Error assessing speaking style: {e}")
            return {
                "speaking_style": "unknown",
                "engagement_score": 5,
                "monotone_risk": True,
                "expressiveness_level": "unknown"
            }
    
    async def _generate_recommendations(self, pitch_stats: Dict, variation_metrics: Dict) -> List[str]:
        """Generate recommendations based on pitch analysis"""
        recommendations = []
        
        try:
            cv = variation_metrics.get("coefficient_of_variation", 0)
            semitone_range = variation_metrics.get("semitone_range", 0)
            
            if cv < 15:
                recommendations.append("Try to vary your pitch more to sound more engaging")
                recommendations.append("Practice emphasizing key words with pitch changes")
            
            if semitone_range < 4:
                recommendations.append("Expand your pitch range for more expressive speech")
            
            voiced_percentage = pitch_stats.get("voiced_frames_percentage", 0)
            if voiced_percentage < 70:
                recommendations.append("Work on maintaining consistent voicing throughout speech")
            
            if not recommendations:
                recommendations.append("Good pitch variation! Keep up the dynamic speaking style")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return ["Unable to generate recommendations due to analysis error"]
    
    async def _fallback_analysis(self, audio_path: str) -> Dict[str, Any]:
        """Fallback analysis using librosa if Parselmouth fails"""
        try:
            # Load audio with librosa
            y, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Extract pitch using librosa's piptrack
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr, threshold=0.1)
            
            # Get fundamental frequency
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)
            
            if len(pitch_values) == 0:
                return {
                    "error": "No pitch detected",
                    "pitch_statistics": {},
                    "speaking_style": {"speaking_style": "unknown", "engagement_score": 5}
                }
            
            pitch_values = np.array(pitch_values)
            
            # Basic statistics
            mean_pitch = float(np.mean(pitch_values))
            std_pitch = float(np.std(pitch_values))
            cv = (std_pitch / mean_pitch) * 100 if mean_pitch > 0 else 0
            
            # Calculate overall score for fallback
            variation_metrics = {"coefficient_of_variation": cv, "semitone_range": 0}
            speaking_style = {"speaking_style": "varied" if cv > 20 else "monotone", "engagement_score": 8 if cv > 20 else 3}
            pitch_stats = {"voiced_frames_percentage": 80}  # Assume good voicing for fallback
            overall_score = await self._calculate_overall_score(pitch_stats, variation_metrics, speaking_style)
            
            return {
                "pitch_statistics": {
                    "mean_pitch": mean_pitch,
                    "std_pitch": std_pitch,
                    "pitch_range": float(np.max(pitch_values) - np.min(pitch_values))
                },
                "variation_metrics": {
                    "coefficient_of_variation": cv
                },
                "speaking_style": {
                    "speaking_style": "varied" if cv > 20 else "monotone",
                    "engagement_score": 8 if cv > 20 else 3
                },
                "overall_score": float(overall_score),
                "analysis_method": "librosa_fallback"
            }
            
        except Exception as e:
            logger.error(f"Error in fallback analysis: {e}")
            return {
                "error": str(e),
                "pitch_statistics": {},
                "speaking_style": {"speaking_style": "unknown", "engagement_score": 5},
                "overall_score": 5.0
            }
    
    async def _calculate_overall_score(self, pitch_stats: Dict, variation_metrics: Dict, speaking_style: Dict) -> float:
        """
        Calculate overall score (0-10) based on pitch engagement and variation
        
        Args:
            pitch_stats: Pitch statistics
            variation_metrics: Variation metrics
            speaking_style: Speaking style assessment
            
        Returns:
            Score from 0-10
        """
        try:
            # Base score starts at 5
            score = 5.0
            
            # Get key metrics
            cv = variation_metrics.get("coefficient_of_variation", 0)
            semitone_range = variation_metrics.get("semitone_range", 0)
            engagement_score = speaking_style.get("engagement_score", 5)
            voiced_percentage = pitch_stats.get("voiced_frames_percentage", 0)
            
            # Pitch variation scoring (0-3 points)
            if cv >= 25:
                score += 3.0  # Excellent variation
            elif cv >= 15:
                score += 2.0  # Good variation
            elif cv >= 8:
                score += 1.0  # Some variation
            else:
                score -= 1.0  # Too monotone
            
            # Semitone range scoring (0-2 points)
            if semitone_range >= 8:
                score += 2.0  # Good range
            elif semitone_range >= 4:
                score += 1.0  # Adequate range
            else:
                score -= 0.5  # Limited range
            
            # Engagement score from speaking style (0-2 points)
            score += (engagement_score - 5) * 0.4  # Scale engagement score to 0-2 points
            
            # Voiced frames percentage (0-1 point)
            if voiced_percentage >= 80:
                score += 1.0
            elif voiced_percentage >= 60:
                score += 0.5
            else:
                score -= 0.5
            
            # Ensure score is within 0-10 range
            score = max(0.0, min(10.0, score))
            
            return round(score, 1)
            
        except Exception as e:
            logger.error(f"Error calculating overall score: {e}")
            return 5.0
