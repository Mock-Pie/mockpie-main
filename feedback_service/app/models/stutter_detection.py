import torch
import torchaudio
import numpy as np
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification, pipeline
import librosa
import asyncio
import logging
from typing import Dict, List, Any
import os

logger = logging.getLogger(__name__)

class StutterDetectionAnalyzer:
    def __init__(self, segment_duration: float = 5.0):
        self.model_name = "HareemFatima/distilhubert-finetuned-stutterdetection"
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.sample_rate = 16000
        self.segment_duration = segment_duration
        self.segment_samples = int(self.segment_duration * self.sample_rate)
        self.model = None
        self.feature_extractor = None
        self.pipeline = None

        try:
            self.pipeline = pipeline(
                "audio-classification",
                model=self.model_name,
                device=0 if torch.cuda.is_available() else -1
            )
            logger.info(f"Stutter detection pipeline loaded on {self.device}")

        except Exception as e:
            logger.warning(f"Failed to load pipeline, trying manual model loading: {e}")
            try:
                self.feature_extractor = AutoFeatureExtractor.from_pretrained(self.model_name)
                self.model = AutoModelForAudioClassification.from_pretrained(self.model_name)
                self.model.to(self.device)
                self.model.eval()
                logger.info(f"Stutter detection model loaded manually on {self.device}")
            except Exception as e2:
                logger.error(f"Error loading stutter detection model: {e2}")

    async def analyze(self, audio_path: str) -> Dict[str, Any]:
        """
        Analyze speech fluency and detect stuttering patterns
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dictionary containing stutter analysis results
        """
        print(f"🎭 DEBUG: Starting Stutter Detection Analysis for {audio_path}")
        
        try:
            audio_data = await self._load_audio(audio_path)

            if self.pipeline is None and self.model is None:
                return await self._fallback_analysis(audio_data, audio_path)

            segments = await self._segment_audio(audio_data)
            logger.info(f"Processing {len(segments)} segments of {self.segment_duration}s each")

            segment_results = []
            total_duration = len(audio_data) / self.sample_rate

            for i, segment in enumerate(segments):
                segment_start_time = i * self.segment_duration
                segment_end_time = min((i + 1) * self.segment_duration, total_duration)

                if self.pipeline is not None:
                    segment_result = await self._analyze_segment_with_pipeline(segment)
                else:
                    segment_result = await self._analyze_segment_with_model(segment)

                segment_result.update({
                    "segment_id": i + 1,
                    "start_time": segment_start_time,
                    "end_time": segment_end_time,
                    "duration": segment_end_time - segment_start_time
                })

                segment_results.append(segment_result)

            return await self._aggregate_segment_results(segment_results, audio_data, audio_path)

        except Exception as e:
            logger.error(f"Error in stutter detection analysis: {e}")
            return {
                "error": str(e),
                "stutter_detected": False,
                "confidence": 0.0,
                "stutter_probability": 0.0,
                "fluency_score": 5.0,
                "overall_score": 5.0,
                "analysis_method": "error",
                "segments": []
            }

    async def _load_audio(self, audio_path: str) -> np.ndarray:
        try:
            audio, sr = librosa.load(audio_path, sr=self.sample_rate, mono=True)
            audio = librosa.util.normalize(audio)
            return audio
        except Exception as e:
            logger.error(f"Error loading audio: {e}")
            raise

    async def _segment_audio(self, audio_data: np.ndarray) -> List[np.ndarray]:
        segments = []
        total_samples = len(audio_data)
        for start_sample in range(0, total_samples, self.segment_samples):
            end_sample = min(start_sample + self.segment_samples, total_samples)
            segment = audio_data[start_sample:end_sample]
            if len(segment) < self.segment_samples:
                padding = np.zeros(self.segment_samples - len(segment))
                segment = np.concatenate([segment, padding])
            segments.append(segment)
        return segments

    async def _analyze_segment_with_pipeline(self, segment: np.ndarray) -> Dict[str, Any]:
        try:
            result = self.pipeline(segment, sampling_rate=self.sample_rate)
            if isinstance(result, list) and len(result) > 0:
                stutter_result = next((pred for pred in result if 'stutter' in pred['label'].lower() or pred['label'].lower() == '1'), None)
                if stutter_result is None:
                    stutter_result = max(result, key=lambda x: x['score'])
                stutter_probability = stutter_result['score']
                stutter_detected = stutter_probability > 0.7
                return {
                    "stutter_detected": stutter_detected,
                    "stutter_probability": float(stutter_probability),
                    "confidence": float(stutter_probability),
                    "model_output": result,
                    "analysis_method": "huggingface_pipeline"
                }
            else:
                return {
                    "stutter_detected": False,
                    "stutter_probability": 0.0,
                    "confidence": 0.0,
                    "model_output": result,
                    "analysis_method": "huggingface_pipeline"
                }
        except Exception as e:
            logger.error(f"Error in segment pipeline analysis: {e}")
            return {
                "stutter_detected": False,
                "stutter_probability": 0.0,
                "confidence": 0.0,
                "analysis_method": "pipeline_error"
            }

    async def _analyze_segment_with_model(self, segment: np.ndarray) -> Dict[str, Any]:
        try:
            inputs = self.feature_extractor(segment, sampling_rate=self.sample_rate, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            probs = predictions.cpu().numpy()[0]
            stutter_probability = float(probs[1]) if len(probs) >= 2 else float(probs[0])
            stutter_detected = stutter_probability > 0.8
            return {
                "stutter_detected": stutter_detected,
                "stutter_probability": stutter_probability,
                "confidence": stutter_probability,
                "model_probabilities": probs.tolist(),
                "analysis_method": "direct_model_inference"
            }
        except Exception as e:
            logger.error(f"Error in segment model analysis: {e}")
            return {
                "stutter_detected": False,
                "stutter_probability": 0.0,
                "confidence": 0.0,
                "analysis_method": "model_error"
            }

    async def _aggregate_segment_results(self, segment_results: List[Dict[str, Any]], audio_data: np.ndarray, audio_path: str) -> Dict[str, Any]:
        try:
            stutter_segments = [seg for seg in segment_results if seg.get("stutter_detected", False)]
            total_segments = len(segment_results)
            stutter_segments_count = len(stutter_segments)
            overall_stutter_probability = np.mean([seg.get("stutter_probability", 0.0) for seg in segment_results])
            fluency_score = (1.0 - overall_stutter_probability) * 10.0
            stutter_timeline = sorted([{
                "start_time": seg["start_time"],
                "end_time": seg["end_time"],
                "duration": seg["duration"],
                "stutter_probability": seg["stutter_probability"],
                "confidence": seg["confidence"],
                "segment_id": seg["segment_id"]
            } for seg in stutter_segments], key=lambda x: x["start_time"])

            total_duration_minutes = (len(audio_data) / self.sample_rate) / 60.0
            stutter_frequency = stutter_segments_count / total_duration_minutes if total_duration_minutes > 0 else 0

            assessment = await self._generate_assessment(overall_stutter_probability, fluency_score)
            recommendations = await self._generate_recommendations({
                "stutter_probability": overall_stutter_probability,
                "fluency_score": fluency_score,
                "stutter_segments_count": stutter_segments_count,
                "total_segments": total_segments
            }, {})

            return {
                "stutter_detected": stutter_segments_count > 0,
                "stutter_probability": float(overall_stutter_probability),
                "confidence": float(np.mean([seg.get("confidence", 0.0) for seg in segment_results])),
                "fluency_score": float(fluency_score),
                "overall_score": float(fluency_score),
                "analysis_method": segment_results[0].get("analysis_method", "unknown"),
                "total_segments": total_segments,
                "stutter_segments_count": stutter_segments_count,
                "stutter_frequency_per_minute": float(stutter_frequency),
                "stutter_percentage": (stutter_segments_count / total_segments * 100) if total_segments > 0 else 0,
                "stutter_timeline": stutter_timeline,
                "all_segments": segment_results,
                "assessment": assessment,
                "recommendations": recommendations,
                "segment_duration": self.segment_duration,
                "total_audio_duration": float(len(audio_data) / self.sample_rate)
            }
        except Exception as e:
            logger.error(f"Error aggregating segment results: {e}")
            return {
                "error": str(e),
                "stutter_detected": False,
                "segments": segment_results
            }

    async def _generate_recommendations(self, analysis_result: Dict[str, Any], acoustic_features: Dict[str, Any]) -> List[str]:
        recommendations = []
        stutter_prob = analysis_result.get("stutter_probability", 0.0)
        fluency_score = analysis_result.get("fluency_score", 5.0)
        stutter_segments_count = analysis_result.get("stutter_segments_count", 0)

        if stutter_prob > 0.7:
            recommendations.extend([
                "Consider working with a speech therapist for targeted stutter reduction techniques",
                "Practice slow, deliberate speech with frequent pauses",
                "Use breathing exercises to maintain steady speech rhythm",
                "Record yourself speaking and identify specific trigger words or situations"
            ])
        elif stutter_prob > 0.4:
            recommendations.extend([
                "Practice speaking at a slower pace, especially during presentations",
                "Use relaxation techniques before speaking engagements",
                "Consider joining a speech improvement group or workshop",
                "Focus on maintaining steady breathing while speaking"
            ])
        elif stutter_prob > 0.2:
            recommendations.extend([
                "Continue practicing clear articulation and pacing",
                "Consider recording presentations to identify improvement areas",
                "Practice speaking in front of a mirror to build confidence"
            ])
        else:
            recommendations.append("Excellent speech fluency! Continue maintaining your current speaking practices")

        if stutter_segments_count > 0:
            recommendations.append(f"Focus on the {stutter_segments_count} segments where stuttering was detected")

        return recommendations

    async def _generate_assessment(self, stutter_prob: float, fluency_score: float) -> str:
        if fluency_score >= 9.0:
            return "Excellent speech fluency with minimal stuttering detected"
        elif fluency_score >= 7.0:
            return "Good speech fluency with occasional stuttering"
        elif fluency_score >= 5.0:
            return "Moderate speech fluency with noticeable stuttering patterns"
        elif fluency_score >= 3.0:
            return "Significant stuttering detected, speech therapy recommended"
        else:
            return "Severe stuttering detected, professional speech therapy strongly recommended"

    def _get_severity_level(self, stutter_prob: float) -> str:
        if stutter_prob < 0.2:
            return "Minimal"
        elif stutter_prob < 0.4:
            return "Mild"
        elif stutter_prob < 0.6:
            return "Moderate"
        elif stutter_prob < 0.8:
            return "Significant"
        else:
            return "Severe"

    def _get_current_timestamp(self) -> float:
        import time
        return time.time()

    async def _fallback_analysis(self, audio_data: np.ndarray, audio_path: str) -> Dict[str, Any]:
        try:
            logger.warning("Using fallback acoustic analysis for stutter detection")
            acoustic_features = await self._extract_acoustic_features(audio_data)
            speech_rate_variation = acoustic_features.get("speech_rate_variation", 0.0)
            stutter_probability = min(1.0, speech_rate_variation * 0.5)
            stutter_detected = stutter_probability > 0.3
            fluency_score = (1.0 - stutter_probability) * 10.0
            return {
                "stutter_detected": stutter_detected,
                "stutter_probability": float(stutter_probability),
                "confidence": 0.3,
                "fluency_score": float(fluency_score),
                "overall_score": float(fluency_score),
                "analysis_method": "acoustic_fallback",
                "acoustic_features": acoustic_features,
                "assessment": await self._generate_assessment(stutter_probability, fluency_score),
                "recommendations": await self._generate_recommendations({
                    "stutter_probability": stutter_probability,
                    "fluency_score": fluency_score
                }, acoustic_features),
                "note": "Analysis performed using acoustic features only. ML model unavailable."
            }
        except Exception as e:
            logger.error(f"Error in fallback analysis: {e}")
            return {
                "error": str(e),
                "stutter_detected": False,
                "stutter_probability": 0.0,
                "confidence": 0.0,
                "fluency_score": 5.0,
                "overall_score": 5.0,
                "analysis_method": "fallback_error"
            }

    async def _extract_acoustic_features(self, audio_data: np.ndarray) -> Dict[str, Any]:
        try:
            duration = len(audio_data) / self.sample_rate
            energy = np.sum(audio_data ** 2)
            energy_variation = np.std(audio_data ** 2)
            spectral_centroid = librosa.feature.spectral_centroid(y=audio_data, sr=self.sample_rate).mean()
            spectral_rolloff = librosa.feature.spectral_rolloff(y=audio_data, sr=self.sample_rate).mean()
            zcr = librosa.feature.zero_crossing_rate(audio_data).mean()
            speech_rate_variation = energy_variation / (energy + 1e-8)
            return {
                "duration": float(duration),
                "energy": float(energy),
                "energy_variation": float(energy_variation),
                "spectral_centroid": float(spectral_centroid),
                "spectral_rolloff": float(spectral_rolloff),
                "zero_crossing_rate": float(zcr),
                "speech_rate_variation": float(speech_rate_variation)
            }
        except Exception as e:
            logger.error(f"Error extracting acoustic features: {e}")
            return {
                "duration": 0.0,
                "energy": 0.0,
                "energy_variation": 0.0,
                "spectral_centroid": 0.0,
                "spectral_rolloff": 0.0,
                "zero_crossing_rate": 0.0,
                "speech_rate_variation": 0.0
            }
