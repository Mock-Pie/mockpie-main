import librosa
import numpy as np
import pyloudnorm as pyln
import asyncio
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class VolumeConsistencyAnalyzer:
    """
    Volume Consistency Analysis using audio processing libraries
    Measures loudness variation and consistency
    """
    
    def __init__(self):
        self.sample_rate = 22050
        self.frame_length = int(0.025 * self.sample_rate)  # 25ms frames
        self.hop_length = int(0.010 * self.sample_rate)    # 10ms hop
        
        # Loudness thresholds (LUFS)
        self.min_loudness = -40.0
        self.max_loudness = -6.0
        self.target_loudness = -23.0  # Broadcast standard
    
    async def analyze(self, audio_path: str) -> Dict[str, Any]:
        """
        Analyze volume consistency and dynamics
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dictionary containing volume analysis results
        """
        print(f"🔊 DEBUG: Starting Volume Consistency Analysis for {audio_path}")
        
        try:
            # Load audio
            y, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Calculate RMS energy over time
            rms_analysis = await self._analyze_rms_energy(y)
            
            # Calculate LUFS loudness if possible
            loudness_analysis = await self._analyze_loudness(y, sr)
            
            # Analyze volume variation
            variation_analysis = await self._analyze_volume_variation(rms_analysis, loudness_analysis)
            
            # Detect volume issues
            issues = await self._detect_volume_issues(rms_analysis, loudness_analysis)
            
            # Generate assessment
            assessment = await self._generate_assessment(variation_analysis, issues)
            
            # Extract main scores for composite scorer compatibility
            consistency_score = variation_analysis.get("overall_consistency_score", 5.0)
            volume_quality_score = assessment.get("volume_quality_score", 5.0)
            
            return {
                "rms_analysis": rms_analysis,
                "loudness_analysis": loudness_analysis,
                "variation_analysis": variation_analysis,
                "detected_issues": issues,
                "assessment": assessment,
                "recommendations": await self._generate_recommendations(variation_analysis, issues),
                # Main scores for composite scorer
                "consistency_score": float(consistency_score),
                "overall_score": float(volume_quality_score),
                "volume_quality_score": float(volume_quality_score)
            }
            
        except Exception as e:
            logger.error(f"Error in volume consistency analysis: {e}")
            return {
                "error": str(e), 
                "volume_analysis": {},
                "consistency_score": 5.0,
                "overall_score": 5.0,
                "volume_quality_score": 5.0
            }
    
    async def _analyze_rms_energy(self, y: np.ndarray) -> Dict[str, Any]:
        """Analyze RMS energy over time"""
        try:
            # Calculate RMS energy
            rms = librosa.feature.rms(
                y=y, 
                frame_length=self.frame_length, 
                hop_length=self.hop_length
            )[0]
            
            # Convert to dB
            rms_db = librosa.amplitude_to_db(rms, ref=np.max)
            
            # Calculate statistics
            mean_rms = float(np.mean(rms_db))
            std_rms = float(np.std(rms_db))
            min_rms = float(np.min(rms_db))
            max_rms = float(np.max(rms_db))
            dynamic_range = max_rms - min_rms
            
            return {
                "mean_rms_db": mean_rms,
                "std_rms_db": std_rms,
                "min_rms_db": min_rms,
                "max_rms_db": max_rms,
                "dynamic_range_db": float(dynamic_range)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing RMS energy: {e}")
            return {}
    
    async def _analyze_loudness(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """Analyze LUFS loudness"""
        try:
            # Try to use pyloudnorm for ITU-R BS.1770 loudness
            try:
                meter = pyln.Meter(sr)
                loudness = meter.integrated_loudness(y)
                
                # Calculate loudness over time (gated)
                block_size = sr  # 1 second blocks
                block_loudness = []
                
                for i in range(0, len(y) - block_size, block_size // 2):
                    block = y[i:i + block_size]
                    if len(block) == block_size:
                        block_lufs = meter.integrated_loudness(block)
                        block_loudness.append(block_lufs)
                
                if block_loudness:
                    block_loudness = np.array(block_loudness)
                    # Remove infinite values
                    block_loudness = block_loudness[np.isfinite(block_loudness)]
                    
                    if len(block_loudness) > 0:
                        return {
                            "integrated_loudness_lufs": float(loudness) if np.isfinite(loudness) else None,
                            "block_loudness": block_loudness.tolist(),
                            "mean_loudness": float(np.mean(block_loudness)),
                            "std_loudness": float(np.std(block_loudness)),
                            "min_loudness": float(np.min(block_loudness)),
                            "max_loudness": float(np.max(block_loudness)),
                            "loudness_range": float(np.max(block_loudness) - np.min(block_loudness))
                        }
                
            except Exception as e:
                logger.warning(f"pyloudnorm analysis failed: {e}")
            
            # Fallback: simple loudness estimation
            return await self._fallback_loudness_analysis(y)
            
        except Exception as e:
            logger.error(f"Error analyzing loudness: {e}")
            return {}
    
    async def _fallback_loudness_analysis(self, y: np.ndarray) -> Dict[str, Any]:
        """Fallback loudness analysis without pyloudnorm"""
        try:
            # Simple A-weighted approximation
            # This is not true LUFS but gives relative loudness measure
            
            # Calculate power in overlapping windows
            window_size = self.sample_rate  # 1 second windows
            hop_size = window_size // 2
            
            power_values = []
            for i in range(0, len(y) - window_size, hop_size):
                window = y[i:i + window_size]
                power = np.mean(window ** 2)
                if power > 0:
                    # Convert to pseudo-LUFS (approximate)
                    pseudo_lufs = 10 * np.log10(power) - 10  # Rough calibration
                    power_values.append(pseudo_lufs)
            
            if not power_values:
                return {"error": "Could not calculate loudness"}
            
            power_values = np.array(power_values)
            
            return {
                "integrated_loudness_lufs": float(np.mean(power_values)),
                "block_loudness": power_values.tolist(),
                "mean_loudness": float(np.mean(power_values)),
                "std_loudness": float(np.std(power_values)),
                "min_loudness": float(np.min(power_values)),
                "max_loudness": float(np.max(power_values)),
                "loudness_range": float(np.max(power_values) - np.min(power_values)),
                "method": "fallback_estimation"
            }
            
        except Exception as e:
            logger.error(f"Error in fallback loudness analysis: {e}")
            return {"error": str(e)}
    
    async def _analyze_volume_variation(self, rms_analysis: Dict, loudness_analysis: Dict) -> Dict[str, Any]:
        """Analyze volume variation patterns"""
        try:
            variation_metrics = {}
            
            # RMS variation
            if rms_analysis:
                std_rms = rms_analysis.get("std_rms_db", 0)
                dynamic_range = rms_analysis.get("dynamic_range_db", 0)
                
                # Coefficient of variation for RMS (handle negative dB values properly)
                mean_rms = rms_analysis.get("mean_rms_db", -20)  # Default to reasonable dB value
                cv_rms = abs(std_rms / mean_rms) if mean_rms != 0 else 1.0  # Default to high variation if no mean
                
                variation_metrics.update({
                    "rms_coefficient_of_variation": float(cv_rms),
                    "rms_dynamic_range": float(dynamic_range),
                    "rms_consistency": "high" if std_rms < 3 else "medium" if std_rms < 6 else "low"
                })
            
            # Loudness variation
            if loudness_analysis and "std_loudness" in loudness_analysis:
                std_loudness = loudness_analysis.get("std_loudness", 0)
                loudness_range = loudness_analysis.get("loudness_range", 0)
                
                variation_metrics.update({
                    "loudness_standard_deviation": float(std_loudness),
                    "loudness_range_lufs": float(loudness_range),
                    "loudness_consistency": "high" if std_loudness < 2 else "medium" if std_loudness < 4 else "low"
                })
            
            # Overall consistency score (0-10, higher is more consistent)
            consistency_score = 10
            
            if "rms_consistency" in variation_metrics:
                if variation_metrics["rms_consistency"] == "low":
                    consistency_score -= 3
                elif variation_metrics["rms_consistency"] == "medium":
                    consistency_score -= 1
            
            if "loudness_consistency" in variation_metrics:
                if variation_metrics["loudness_consistency"] == "low":
                    consistency_score -= 3
                elif variation_metrics["loudness_consistency"] == "medium":
                    consistency_score -= 1
            
            consistency_score = max(0, consistency_score)
            
            variation_metrics.update({
                "overall_consistency_score": float(consistency_score),
                "consistency_level": "excellent" if consistency_score >= 8 else 
                                  "good" if consistency_score >= 6 else
                                  "fair" if consistency_score >= 4 else "poor"
            })
            
            return variation_metrics
            
        except Exception as e:
            logger.error(f"Error analyzing volume variation: {e}")
            return {"overall_consistency_score": 5.0, "consistency_level": "unknown"}
    
    async def _detect_volume_issues(self, rms_analysis: Dict, loudness_analysis: Dict) -> List[Dict[str, Any]]:
        """Detect specific volume issues"""
        issues = []
        
        try:
            # Check for clipping (high RMS values)
            if rms_analysis:
                max_rms = rms_analysis.get("max_rms_db", -100)
                if max_rms > -1:  # Very close to 0 dB
                    issues.append({
                        "type": "potential_clipping",
                        "severity": "high",
                        "description": "Audio may be clipping (too loud)",
                        "value": max_rms
                    })
            
            # Check for very low volume
            if loudness_analysis:
                mean_loudness = loudness_analysis.get("mean_loudness", -50)
                if mean_loudness < -35:
                    issues.append({
                        "type": "low_volume",
                        "severity": "medium",
                        "description": "Overall volume is quite low",
                        "value": mean_loudness
                    })
            
            # Check for high variation
            if rms_analysis:
                std_rms = rms_analysis.get("std_rms_db", 0)
                if std_rms > 8:
                    issues.append({
                        "type": "high_variation",
                        "severity": "medium", 
                        "description": "Volume varies significantly throughout",
                        "value": std_rms
                    })
            
            # Check loudness standard compliance
            if loudness_analysis:
                integrated_loudness = loudness_analysis.get("integrated_loudness_lufs")
                if integrated_loudness is not None:
                    if integrated_loudness < -30:
                        issues.append({
                            "type": "below_broadcast_standard",
                            "severity": "low",
                            "description": "Volume below broadcast standards",
                            "value": integrated_loudness
                        })
                    elif integrated_loudness > -16:
                        issues.append({
                            "type": "above_broadcast_standard", 
                            "severity": "medium",
                            "description": "Volume above recommended broadcast standards",
                            "value": integrated_loudness
                        })
            
            return issues
            
        except Exception as e:
            logger.error(f"Error detecting volume issues: {e}")
            return []
    
    async def _generate_assessment(self, variation_analysis: Dict, issues: List[Dict]) -> Dict[str, Any]:
        """Generate overall volume assessment"""
        try:
            consistency_score = variation_analysis.get("overall_consistency_score", 5)
            consistency_level = variation_analysis.get("consistency_level", "unknown")
            
            # Count severe issues
            high_severity_issues = len([i for i in issues if i.get("severity") == "high"])
            medium_severity_issues = len([i for i in issues if i.get("severity") == "medium"])
            
            # Calculate overall volume quality score
            quality_score = consistency_score
            quality_score -= high_severity_issues * 3
            quality_score -= medium_severity_issues * 1
            quality_score = max(0, min(10, quality_score))
            
            # Determine quality level
            if quality_score >= 8:
                quality_level = "excellent"
            elif quality_score >= 6:
                quality_level = "good"
            elif quality_score >= 4:
                quality_level = "acceptable"
            else:
                quality_level = "needs_improvement"
            
            return {
                "volume_quality_score": float(quality_score),
                "quality_level": quality_level,
                "consistency_assessment": consistency_level,
                "total_issues": len(issues),
                "high_priority_issues": high_severity_issues,
                "professional_quality": quality_score >= 7
            }
            
        except Exception as e:
            logger.error(f"Error generating assessment: {e}")
            return {
                "volume_quality_score": 5.0,
                "quality_level": "unknown"
            }
    
    async def _generate_recommendations(self, variation_analysis: Dict, issues: List[Dict]) -> List[str]:
        """Generate recommendations for volume improvement"""
        recommendations = []
        
        try:
            consistency_level = variation_analysis.get("consistency_level", "unknown")
            
            # Address specific issues
            for issue in issues:
                issue_type = issue.get("type", "")
                
                if issue_type == "potential_clipping":
                    recommendations.append("Reduce microphone gain to avoid clipping")
                elif issue_type == "low_volume":
                    recommendations.append("Increase microphone gain or speak closer to the microphone")
                elif issue_type == "high_variation":
                    recommendations.append("Maintain consistent distance from microphone")
                    recommendations.append("Use compression or automatic gain control")
                elif issue_type == "below_broadcast_standard":
                    recommendations.append("Increase overall recording level")
                elif issue_type == "above_broadcast_standard":
                    recommendations.append("Reduce recording level to meet broadcast standards")
            
            # General consistency recommendations
            if consistency_level in ["fair", "poor"]:
                recommendations.append("Practice maintaining consistent volume throughout your presentation")
                recommendations.append("Consider using audio processing to normalize levels")
            
            if not recommendations:
                recommendations.append("Excellent volume consistency! Your audio levels are well-controlled")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return ["Unable to generate volume recommendations"]
