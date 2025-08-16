import torch
import numpy as np
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification, pipeline
import librosa
import logging
from typing import Dict, List, Any

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

    def analyze(self, audio_path: str) -> Dict[str, Any]:
        """Analyze speech fluency and detect stuttering patterns."""
        logger.info(f"Starting Stutter Detection Analysis for {audio_path}")
        try:
            audio_data = self._load_audio(audio_path)

            if self.pipeline is None and self.model is None:
                return self._fallback_analysis(audio_data, audio_path)

            segments = self._segment_audio(audio_data)
            logger.info(f"Processing {len(segments)} segments of {self.segment_duration}s each")

            segment_results = []
            total_duration = len(audio_data) / self.sample_rate

            for i, segment in enumerate(segments):
                segment_start_time = i * self.segment_duration
                segment_end_time = min((i + 1) * self.segment_duration, total_duration)

                if self.pipeline is not None:
                    segment_result = self._analyze_segment_with_pipeline(segment)
                else:
                    segment_result = self._analyze_segment_with_model(segment)

                segment_result.update({
                    "segment_id": i + 1,
                    "start_time": segment_start_time,
                    "end_time": segment_end_time,
                    "duration": segment_end_time - segment_start_time
                })

                segment_results.append(segment_result)

            return self._aggregate_segment_results(segment_results, audio_data, audio_path)

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

    def _load_audio(self, audio_path: str) -> np.ndarray:
        try:
            audio, sr = librosa.load(audio_path, sr=self.sample_rate, mono=True)
            audio = librosa.util.normalize(audio)
            return audio
        except Exception as e:
            logger.error(f"Error loading audio: {e}")
            raise

    def _segment_audio(self, audio_data: np.ndarray) -> List[np.ndarray]:
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

    def _analyze_segment_with_pipeline(self, segment: np.ndarray) -> Dict[str, Any]:
        try:
            result = self.pipeline(segment, sampling_rate=self.sample_rate)
            stutter_labels = {"repetition", "prolongation", "blocks", "stutter", "1"}
            stutter_probs = [pred['score'] for pred in result if pred['label'].lower() in stutter_labels]
            stutter_probability = max(stutter_probs) if stutter_probs else 0.0
            stutter_detected = stutter_probability > 0.7
            return {
                "stutter_detected": stutter_detected,
                "stutter_probability": float(stutter_probability),
                "confidence": float(stutter_probability),
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

    def _analyze_segment_with_model(self, segment: np.ndarray) -> Dict[str, Any]:
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

    def _aggregate_segment_results(self, segment_results: List[Dict[str, Any]], audio_data: np.ndarray, audio_path: str) -> Dict[str, Any]:
        try:
            stutter_segments = [seg for seg in segment_results if seg.get("stutter_detected", False)]
            total_segments = len(segment_results)
            stutter_segments_count = len(stutter_segments)
            overall_stutter_probability = np.mean([seg.get("stutter_probability", 0.0) for seg in segment_results])
            fluency_score = max(0.0, min(10.0, (1.0 - overall_stutter_probability) * 10.0))
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

            assessment = self._generate_assessment(overall_stutter_probability, fluency_score)
            recommendations = self._generate_recommendations({
                "stutter_probability": overall_stutter_probability,
                "fluency_score": fluency_score,
                "stutter_segments_count": stutter_segments_count,
                "total_segments": total_segments
            })

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

    def _generate_recommendations(self, analysis_result: Dict[str, Any]) -> List[str]:
        recommendations = []
        stutter_prob = analysis_result.get("stutter_probability", 0.0)
        fluency_score = analysis_result.get("fluency_score", 5.0)
        stutter_segments_count = analysis_result.get("stutter_segments_count", 0)

        if stutter_prob > 0.7:
            recommendations.extend([
                "Consider working with a speech therapist for targeted stutter reduction techniques.",
                "Practice slow, deliberate speech with frequent pauses.",
                "Use breathing exercises to maintain steady speech rhythm.",
                "Record yourself speaking and identify specific trigger words or situations."
            ])
        elif stutter_prob > 0.4:
            recommendations.extend([
                "Practice speaking at a slower pace, especially during presentations.",
                "Use relaxation techniques before speaking engagements.",
                "Consider joining a speech improvement group or workshop.",
                "Focus on maintaining steady breathing while speaking."
            ])
        elif stutter_prob > 0.2:
            recommendations.extend([
                "Continue practicing clear articulation and pacing.",
                "Consider recording presentations to identify improvement areas.",
                "Practice speaking in front of a mirror to build confidence."
            ])
        else:
            recommendations.append("Excellent speech fluency! Continue maintaining your current speaking practices.")

        if stutter_segments_count > 0:
            recommendations.append(f"Focus on the {stutter_segments_count} segments where stuttering was detected.")

        return recommendations

    def _generate_assessment(self, stutter_prob: float, fluency_score: float) -> str:
        if fluency_score >= 9.0:
            return "Excellent speech fluency with minimal stuttering detected."
        elif fluency_score >= 7.0:
            return "Good speech fluency with occasional stuttering."
        elif fluency_score >= 5.0:
            return "Moderate speech fluency with noticeable stuttering patterns."
        elif fluency_score >= 3.0:
            return "Significant stuttering detected, speech therapy recommended."
        else:
            return "Severe stuttering detected, professional speech therapy strongly recommended."

    def _fallback_analysis(self, audio_data: np.ndarray, audio_path: str) -> Dict[str, Any]:
        """
        Fallback: Use acoustic heuristics for stutter detection (repetition, blocks, prolongation).
        Research: Stuttering often shows as increased energy variance, abnormal pauses, and high zero-crossing rate.
        """
        try:
            duration = len(audio_data) / self.sample_rate
            zcr = librosa.feature.zero_crossing_rate(audio_data)[0]
            zcr_mean = float(np.mean(zcr))
            energy = np.sum(audio_data ** 2)
            energy_var = np.std(audio_data ** 2)
            rms = librosa.feature.rms(y=audio_data)[0]
            rms_var = float(np.std(rms))
            
            # Heuristic scoring: higher ZCR and energy variance indicate possible stuttering
            stutter_probability = min(1.0, (zcr_mean * 10 + rms_var * 10))
            fluency_score = max(0.0, min(10.0, (1.0 - stutter_probability) * 10.0))
            assessment = self._generate_assessment(stutter_probability, fluency_score)
            recommendations = self._generate_recommendations({
                "stutter_probability": stutter_probability,
                "fluency_score": fluency_score,
                "stutter_segments_count": 0,
                "total_segments": 1
            })
            return {
                "stutter_detected": stutter_probability > 0.5,
                "stutter_probability": float(stutter_probability),
                "confidence": float(stutter_probability),
                "fluency_score": float(fluency_score),
                "overall_score": float(fluency_score),
                "analysis_method": "acoustic_fallback",
                "assessment": assessment,
                "recommendations": recommendations,
                "total_audio_duration": duration
            }
        except Exception as e:
            logger.error(f"Error in fallback analysis: {e}")
            return {
                "error": str(e),
                "stutter_detected": False,
                "fluency_score": 5.0,
                "overall_score": 5.0,
                "analysis_method": "fallback_error"
            }
