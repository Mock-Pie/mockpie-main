import whisper
import numpy as np
import librosa
import re
import asyncio
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class FillerWordDetector:
    """
    Filler Word Detection using centralized transcription service
    Detects common filler words like "um", "uh", "er", etc.
    """
    
    def __init__(self, transcription_service=None):
        self.transcription_service = transcription_service
        self.model = None
        
        # Initialize Whisper model for fallback
        try:
            self.model = whisper.load_model("base")
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load Whisper model: {e}")
            self.model = None
        
        # Common filler words to detect
        self.filler_words = {
            "um", "uh", "er", "ah", "eh", "oh", "uhm", "hmm",
            "like", "you know", "so", "well", "actually", "basically",
            "literally", "right", "okay", "ok", "yeah", "yes", "no"
        }
        
        # Pause detection parameters
        self.min_pause_duration = 0.3  # seconds
        self.energy_threshold = 0.01
    
    async def analyze(self, audio_path: str) -> Dict[str, Any]:
        """
        Analyze filler words and pauses in audio
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dictionary containing filler word analysis results
        """
        print(f"🚫 DEBUG: Starting Filler Detection Analysis for {audio_path}")
        
        try:
            # Get transcript with timestamps
            transcript_result = await self._transcribe_audio(audio_path)
            
            if not transcript_result or "error" in transcript_result:
                return {
                    "error": "Transcription failed",
                    "filler_analysis": {},
                    "pause_analysis": {},
                    "overall_score": 5.0
                }
            
            # Analyze filler words in transcript
            filler_analysis = await self._analyze_filler_words(transcript_result)
            
            # Analyze pauses in audio
            pause_analysis = await self._analyze_pauses(audio_path)
            
            # Calculate overall disfluency metrics
            disfluency_metrics = await self._calculate_disfluency_metrics(filler_analysis, pause_analysis)
            
            # Extract overall score from disfluency metrics
            overall_score = disfluency_metrics.get("fluency_score", 5.0)
            
            return {
                "transcript": transcript_result.get("text", ""),
                "filler_analysis": filler_analysis,
                "pause_analysis": pause_analysis,
                "disfluency_metrics": disfluency_metrics,
                "overall_score": float(overall_score),
                "recommendations": await self._generate_recommendations(filler_analysis, pause_analysis, disfluency_metrics)
            }
            
        except Exception as e:
            logger.error(f"Error in filler word analysis: {e}")
            return {
                "error": str(e),
                "filler_analysis": {},
                "pause_analysis": {},
                "overall_score": 5.0
            }
    
    async def _transcribe_audio(self, audio_path: str) -> Dict[str, Any]:
        """Transcribe audio using centralized service or Whisper with minimal normalization"""
        try:
            # Try centralized transcription service first
            if self.transcription_service:
                try:
                    transcription = await self.transcription_service.get_transcription(audio_path)
                    
                    if transcription:
                        return {
                            "text": transcription,
                            "segments": [{"text": transcription, "start": 0, "end": 0}],
                            "word_timestamps": []
                        }
                    else:
                        logger.warning("Centralized transcription failed, falling back to Whisper")
                except Exception as e:
                    logger.warning(f"Centralized transcription error: {e}, falling back to Whisper")
            
            # Fallback to Whisper
            if self.model is None:
                return await self._fallback_transcription(audio_path)
            
            # Transcribe with word-level timestamps
            result = self.model.transcribe(
                audio_path,
                word_timestamps=True,
                no_speech_threshold=0.6,
                logprob_threshold=-1.0,
                compression_ratio_threshold=2.4
            )
            
            return {
                "text": result.get("text", ""),
                "segments": result.get("segments", []),
                "word_timestamps": self._extract_word_timestamps(result)
            }
            
        except Exception as e:
            logger.error(f"Error in transcription: {e}")
            return {"error": str(e)}
    
    def _extract_word_timestamps(self, whisper_result: Dict) -> List[Dict]:
        """Extract word-level timestamps from Whisper result"""
        word_timestamps = []
        
        try:
            for segment in whisper_result.get("segments", []):
                for word_info in segment.get("words", []):
                    word_timestamps.append({
                        "word": word_info.get("word", "").strip(),
                        "start": word_info.get("start", 0),
                        "end": word_info.get("end", 0),
                        "confidence": word_info.get("probability", 0)
                    })
        except Exception as e:
            logger.error(f"Error extracting word timestamps: {e}")
        
        return word_timestamps
    
    async def _analyze_filler_words(self, transcript_result: Dict) -> Dict[str, Any]:
        """Analyze filler words in the transcript"""
        try:
            text = transcript_result.get("text", "").lower()
            word_timestamps = transcript_result.get("word_timestamps", [])
            
            # Count filler words
            filler_counts = {}
            filler_positions = []
            
            # Analyze from word timestamps if available
            if word_timestamps:
                for word_info in word_timestamps:
                    word = word_info["word"].lower().strip()
                    
                    # Check for exact matches
                    if word in self.filler_words:
                        filler_counts[word] = filler_counts.get(word, 0) + 1
                        filler_positions.append({
                            "word": word,
                            "start_time": word_info["start"],
                            "end_time": word_info["end"],
                            "confidence": word_info["confidence"]
                        })
                    
                    # Check for partial matches in common phrases
                    for filler in ["you know", "i mean"]:
                        if filler in word_info["word"].lower():
                            filler_counts[filler] = filler_counts.get(filler, 0) + 1
                            filler_positions.append({
                                "word": filler,
                                "start_time": word_info["start"],
                                "end_time": word_info["end"],
                                "confidence": word_info["confidence"]
                            })
            
            # Fallback: analyze full text
            else:
                words = re.findall(r'\b\w+\b', text)
                for word in words:
                    if word in self.filler_words:
                        filler_counts[word] = filler_counts.get(word, 0) + 1
            
            # Calculate statistics
            total_words = len(re.findall(r'\b\w+\b', text))
            total_fillers = sum(filler_counts.values())
            filler_rate = (total_fillers / total_words) * 100 if total_words > 0 else 0
            
            return {
                "filler_counts": filler_counts,
                "filler_positions": filler_positions,
                "total_fillers": total_fillers,
                "total_words": total_words,
                "filler_rate_percentage": float(filler_rate),
                "most_common_filler": max(filler_counts.items(), key=lambda x: x[1])[0] if filler_counts else None
            }
            
        except Exception as e:
            logger.error(f"Error analyzing filler words: {e}")
            return {
                "filler_counts": {},
                "total_fillers": 0,
                "filler_rate_percentage": 0.0
            }
    
    async def _analyze_pauses(self, audio_path: str) -> Dict[str, Any]:
        """Analyze pauses and silence in audio"""
        try:
            # Load audio
            y, sr = librosa.load(audio_path, sr=22050)
            
            # Calculate frame-wise energy
            frame_length = int(0.025 * sr)  # 25ms frames
            hop_length = int(0.010 * sr)    # 10ms hop
            
            # Calculate RMS energy
            rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
            
            # Convert to time axis
            times = librosa.frames_to_time(range(len(rms)), sr=sr, hop_length=hop_length)
            
            # Detect pauses (low energy regions)
            pause_mask = rms < self.energy_threshold
            
            # Find continuous pause regions
            pauses = []
            in_pause = False
            pause_start = 0
            
            for i, is_pause in enumerate(pause_mask):
                if is_pause and not in_pause:
                    # Start of pause
                    pause_start = times[i]
                    in_pause = True
                elif not is_pause and in_pause:
                    # End of pause
                    pause_duration = times[i] - pause_start
                    if pause_duration >= self.min_pause_duration:
                        pauses.append({
                            "start_time": float(pause_start),
                            "end_time": float(times[i]),
                            "duration": float(pause_duration)
                        })
                    in_pause = False
            
            # Handle final pause
            if in_pause and len(times) > 0:
                pause_duration = times[-1] - pause_start
                if pause_duration >= self.min_pause_duration:
                    pauses.append({
                        "start_time": float(pause_start),
                        "end_time": float(times[-1]),
                        "duration": float(pause_duration)
                    })
            
            # Calculate pause statistics
            total_pause_time = sum(pause["duration"] for pause in pauses)
            total_audio_time = len(y) / sr
            pause_percentage = (total_pause_time / total_audio_time) * 100 if total_audio_time > 0 else 0
            
            avg_pause_duration = np.mean([p["duration"] for p in pauses]) if pauses else 0
            max_pause_duration = max([p["duration"] for p in pauses]) if pauses else 0
            
            return {
                "pauses": pauses,
                "total_pauses": len(pauses),
                "total_pause_time": float(total_pause_time),
                "pause_percentage": float(pause_percentage),
                "average_pause_duration": float(avg_pause_duration),
                "max_pause_duration": float(max_pause_duration),
                "pause_frequency": len(pauses) / (total_audio_time / 60) if total_audio_time > 0 else 0  # pauses per minute
            }
            
        except Exception as e:
            logger.error(f"Error analyzing pauses: {e}")
            return {
                "pauses": [],
                "total_pauses": 0,
                "pause_percentage": 0.0
            }
    
    async def _calculate_disfluency_metrics(self, filler_analysis: Dict, pause_analysis: Dict) -> Dict[str, Any]:
        """Calculate overall disfluency metrics"""
        try:
            filler_rate = filler_analysis.get("filler_rate_percentage", 0)
            pause_percentage = pause_analysis.get("pause_percentage", 0)
            avg_pause_duration = pause_analysis.get("average_pause_duration", 0)
            
            # Calculate overall fluency score (0-10, higher is better)
            fluency_score = 10
            
            # Penalize high filler rates
            if filler_rate > 5:
                fluency_score -= 3
            elif filler_rate > 2:
                fluency_score -= 1
            
            # Penalize excessive pauses
            if pause_percentage > 20:
                fluency_score -= 2
            elif pause_percentage > 10:
                fluency_score -= 1
            
            # Penalize very long pauses
            if avg_pause_duration > 2:
                fluency_score -= 2
            elif avg_pause_duration > 1:
                fluency_score -= 1
            
            fluency_score = max(0, fluency_score)
            
            # Classify fluency level
            if fluency_score >= 8:
                fluency_level = "excellent"
            elif fluency_score >= 6:
                fluency_level = "good"
            elif fluency_score >= 4:
                fluency_level = "fair"
            else:
                fluency_level = "needs_improvement"
            
            return {
                "fluency_score": float(fluency_score),
                "fluency_level": fluency_level,
                "overall_disfluency_rate": float(filler_rate + (pause_percentage / 2)),
                "speech_rhythm": "smooth" if fluency_score >= 7 else "choppy"
            }
            
        except Exception as e:
            logger.error(f"Error calculating disfluency metrics: {e}")
            return {
                "fluency_score": 5.0,
                "fluency_level": "unknown"
            }
    
    async def _generate_recommendations(self, filler_analysis: Dict, pause_analysis: Dict, disfluency_metrics: Dict) -> List[str]:
        """Generate recommendations based on filler and pause analysis"""
        recommendations = []
        
        try:
            filler_rate = filler_analysis.get("filler_rate_percentage", 0)
            pause_percentage = pause_analysis.get("pause_percentage", 0)
            fluency_level = disfluency_metrics.get("fluency_level", "unknown")
            
            if filler_rate > 3:
                recommendations.append("Reduce filler words - practice pausing instead of saying 'um' or 'uh'")
                most_common = filler_analysis.get("most_common_filler")
                if most_common:
                    recommendations.append(f"Pay special attention to your use of '{most_common}'")
            
            if pause_percentage > 15:
                recommendations.append("Work on reducing excessive pauses - practice smooth transitions")
            
            avg_pause = pause_analysis.get("average_pause_duration", 0)
            if avg_pause > 2:
                recommendations.append("Shorten your pauses - aim for brief, purposeful pauses")
            
            if fluency_level in ["fair", "needs_improvement"]:
                recommendations.append("Practice speaking with a steady rhythm and pace")
            
            if not recommendations:
                recommendations.append("Good speech fluency! Maintain your natural speaking rhythm")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return ["Unable to generate fluency recommendations"]
    
    async def _fallback_transcription(self, audio_path: str) -> Dict[str, Any]:
        """Fallback transcription method if Whisper is not available"""
        try:
            # Simple audio analysis without transcription
            y, sr = librosa.load(audio_path, sr=22050)
            
            return {
                "text": "Transcription not available - Whisper model not loaded",
                "segments": [],
                "word_timestamps": [],
                "fallback": True
            }
            
        except Exception as e:
            logger.error(f"Error in fallback transcription: {e}")
            return {"error": str(e)}
