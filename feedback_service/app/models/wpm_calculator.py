import numpy as np
import librosa
import re
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class WPMCalculator:
    """
    Words Per Minute (WPM) calculator for speech analysis.
    Analyzes speaking rate, pace consistency, and provides recommendations.
    """
    def __init__(self, transcription_service_english=None, transcription_service_arabic=None):
        self.transcription_service_english = transcription_service_english
        self.transcription_service_arabic = transcription_service_arabic
        # Research-backed optimal WPM ranges
        self.wpm_ranges = {
            'presentation': {'min': 120, 'max': 160, 'optimal': 140},
            'conversation': {'min': 140, 'max': 180, 'optimal': 160},
            'audiobook': {'min': 150, 'max': 200, 'optimal': 175}
        }

    def analyze(self, audio_path: str, language: str, context: str = 'presentation') -> Dict[str, Any]:
        logger.info(f"Starting WPM Calculator Analysis for {audio_path}")
        try:
            audio_data, sample_rate = librosa.load(audio_path, sr=16000)
            duration = len(audio_data) / sample_rate

            transcription = self._get_transcription(audio_path, language)
            if not transcription:
                return self._create_error_result("Failed to transcribe audio")

            word_count = self._count_words(transcription)
            wpm = self._calculate_wpm(word_count, duration)

            speech_segments = self._detect_speech_segments(audio_data, sample_rate)
            segment_analysis = self._analyze_segments(speech_segments, transcription)
            pace_consistency = self._calculate_pace_consistency(segment_analysis)
            pause_analysis = self._analyze_pauses(speech_segments, duration)
            assessment = self._assess_wpm(wpm, context)
            recommendations = self._generate_recommendations(wpm, pace_consistency, pause_analysis, context)
            overall_score = self._calculate_overall_score(wpm, pace_consistency, assessment, context)

            return {
                'overall_wpm': round(wpm, 1),
                'word_count': word_count,
                'duration_minutes': round(duration / 60, 2),
                'context': context,
                'assessment': assessment,
                'overall_score': float(overall_score),
                'pace_consistency': {
                    'score': round(pace_consistency, 2),
                    'status': self._get_consistency_status(pace_consistency)
                },
                'segment_analysis': {
                    'segments': len(speech_segments),
                    'avg_segment_wpm': round(np.mean([seg['wpm'] for seg in segment_analysis]), 1) if segment_analysis else 0,
                    'wpm_variance': round(np.var([seg['wpm'] for seg in segment_analysis]), 1) if segment_analysis else 0
                },
                'pause_analysis': pause_analysis,
                'detailed_segments': segment_analysis[:10],
                'recommendations': recommendations,
                'success': True
            }
        except Exception as e:
            logger.error(f"Error in WPM analysis: {str(e)}")
            return self._create_error_result(f"Analysis failed: {str(e)}")

    def _get_transcription(self, audio_path: str, language: str = 'english') -> Optional[str]:
        try:
            if language == 'arabic' and self.transcription_service_arabic:
                return self.transcription_service_arabic.get_transcription(audio_path)
            elif self.transcription_service_english:
                return self.transcription_service_english.get_transcription(audio_path)
            else:
                return None
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return None

    def _count_words(self, text: str) -> int:
        if not text:
            return 0
        words = re.findall(r'\b\w+\b', text.lower())
        return len(words)

    def _calculate_wpm(self, word_count: int, duration_seconds: float) -> float:
        if duration_seconds <= 0:
            return 0
        return (word_count / duration_seconds) * 60

    def _detect_speech_segments(self, audio_data: np.ndarray, sample_rate: int) -> List[Dict]:
        frame_length = int(0.025 * sample_rate)
        hop_length = int(0.010 * sample_rate)
        energy = []
        for i in range(0, len(audio_data) - frame_length, hop_length):
            frame = audio_data[i:i + frame_length]
            frame_energy = np.sum(frame ** 2)
            energy.append(frame_energy)
        energy = np.array(energy)
        energy_threshold = np.percentile(energy, 30)
        is_speech = energy > energy_threshold
        segments = []
        start_time = None
        for i, speech in enumerate(is_speech):
            time_ms = i * 10
            if speech and start_time is None:
                start_time = time_ms
            elif not speech and start_time is not None:
                end_time = time_ms
                duration = (end_time - start_time) / 1000.0
                if duration > 0.1:
                    segments.append({
                        'start': start_time / 1000.0,
                        'end': end_time / 1000.0,
                        'duration': duration
                    })
                start_time = None
        if start_time is not None:
            end_time = len(is_speech) * 10
            duration = (end_time - start_time) / 1000.0
            if duration > 0.1:
                segments.append({
                    'start': start_time / 1000.0,
                    'end': end_time / 1000.0,
                    'duration': duration
                })
        return segments

    def _analyze_segments(self, segments: List[Dict], transcription: str) -> List[Dict]:
        if not segments or not transcription:
            return []
        total_words = self._count_words(transcription)
        words_per_segment = total_words / len(segments) if segments else 0
        analyzed_segments = []
        for i, segment in enumerate(segments):
            segment_words = words_per_segment
            segment_wpm = self._calculate_wpm(segment_words, segment['duration'])
            analyzed_segments.append({
                'segment_id': i + 1,
                'start_time': round(segment['start'], 2),
                'end_time': round(segment['end'], 2),
                'duration': round(segment['duration'], 2),
                'estimated_words': round(segment_words, 1),
                'wpm': round(segment_wpm, 1)
            })
        return analyzed_segments

    def _calculate_pace_consistency(self, segment_analysis: List[Dict]) -> float:
        if len(segment_analysis) < 2:
            return 1.0
        wpm_values = [seg['wpm'] for seg in segment_analysis if seg['wpm'] > 0]
        if not wpm_values:
            return 0.0
        mean_wpm = np.mean(wpm_values)
        std_wpm = np.std(wpm_values)
        cv = std_wpm / mean_wpm if mean_wpm > 0 else 1.0
        consistency_score = max(0, 1 - cv)
        return consistency_score

    def _analyze_pauses(self, segments: List[Dict], total_duration: float) -> Dict:
        if len(segments) < 2:
            return {
                'total_pause_time': 0,
                'pause_percentage': 0,
                'average_pause_duration': 0,
                'pause_count': 0
            }
        pauses = []
        for i in range(1, len(segments)):
            pause_start = segments[i-1]['end']
            pause_end = segments[i]['start']
            pause_duration = pause_end - pause_start
            if pause_duration > 0.1:
                pauses.append(pause_duration)
        total_pause_time = sum(pauses)
        pause_percentage = (total_pause_time / total_duration) * 100 if total_duration > 0 else 0
        avg_pause_duration = np.mean(pauses) if pauses else 0
        return {
            'total_pause_time': round(total_pause_time, 2),
            'pause_percentage': round(pause_percentage, 1),
            'average_pause_duration': round(avg_pause_duration, 2),
            'pause_count': len(pauses)
        }

    def _assess_wpm(self, wpm: float, context: str) -> Dict:
        ranges = self.wpm_ranges.get(context, self.wpm_ranges['presentation'])
        if wpm < ranges['min']:
            status = 'too_slow'
            message = f"Speaking pace is too slow for {context}"
        elif wpm > ranges['max']:
            status = 'too_fast'
            message = f"Speaking pace is too fast for {context}"
        else:
            optimal = ranges['optimal']
            deviation = abs(wpm - optimal) / optimal
            if deviation < 0.1:
                status = 'excellent'
                message = f"Speaking pace is excellent for {context}"
            elif deviation < 0.2:
                status = 'good'
                message = f"Speaking pace is good for {context}"
            else:
                status = 'acceptable'
                message = f"Speaking pace is acceptable for {context}"
        return {
            'status': status,
            'message': message,
            'optimal_range': f"{ranges['min']}-{ranges['max']} WPM",
            'optimal_target': f"{ranges['optimal']} WPM"
        }

    def _get_consistency_status(self, consistency_score: float) -> str:
        if consistency_score >= 0.8:
            return 'excellent'
        elif consistency_score >= 0.6:
            return 'good'
        elif consistency_score >= 0.4:
            return 'fair'
        else:
            return 'poor'

    def _generate_recommendations(self, wpm: float, consistency: float, pause_analysis: Dict, context: str) -> List[str]:
        recommendations = []
        ranges = self.wpm_ranges.get(context, self.wpm_ranges['presentation'])
        if wpm < ranges['min']:
            recommendations.append(f"Increase speaking pace. Target {ranges['optimal']} WPM for optimal {context} delivery.")
            recommendations.append("Practice speaking exercises to build confidence and fluency.")
        elif wpm > ranges['max']:
            recommendations.append(f"Slow down your speaking pace. Target {ranges['optimal']} WPM for better comprehension.")
            recommendations.append("Focus on clear articulation and allow listeners time to process information.")
        if consistency < 0.6:
            recommendations.append("Work on maintaining consistent speaking pace throughout your presentation.")
            recommendations.append("Practice with a metronome or pacing exercises to develop rhythm.")
        pause_percentage = pause_analysis.get('pause_percentage', 0)
        avg_pause = pause_analysis.get('average_pause_duration', 0)
        if pause_percentage < 10:
            recommendations.append("Include more strategic pauses to emphasize key points and improve comprehension.")
        elif pause_percentage > 25:
            recommendations.append("Reduce excessive pausing. Practice speaking with more confidence and fluency.")
        if avg_pause > 3.0:
            recommendations.append("Reduce the length of pauses between sentences for better flow.")
        elif avg_pause < 0.5:
            recommendations.append("Use longer strategic pauses to give audience time to process important information.")
        if context == 'presentation':
            if wpm > 140:
                recommendations.append("For presentations, slightly slower pace helps audience retention.")
            recommendations.append("Use pauses after key points to let information sink in.")
        if not recommendations:
            recommendations.append("Your speaking pace is well-balanced. Continue practicing to maintain consistency.")
        return recommendations

    def _calculate_overall_score(self, wpm: float, consistency: float, assessment: Dict, context: str) -> float:
        ranges = self.wpm_ranges.get(context, self.wpm_ranges['presentation'])
        if assessment['status'] == 'excellent':
            wpm_score = 10
        elif assessment['status'] == 'good':
            wpm_score = 7
        elif assessment['status'] == 'acceptable':
            wpm_score = 5
        else:
            wpm_score = 0
        consistency_score = 10 * consistency
        overall_score = (wpm_score + consistency_score) / 2
        return round(overall_score, 2)

    def _create_error_result(self, error_message: str) -> Dict:
        return {
            'overall_wpm': 0,
            'word_count': 0,
            'duration_minutes': 0,
            'overall_score': 5.0,
            'assessment': {
                'status': 'error',
                'message': error_message,
                'optimal_range': 'N/A',
                'optimal_target': 'N/A'
            },
            'pace_consistency': {'score': 0, 'status': 'error'},
            'segment_analysis': {'segments': 0, 'avg_segment_wpm': 0, 'wpm_variance': 0},
            'pause_analysis': {
                'total_pause_time': 0,
                'pause_percentage': 0,
                'average_pause_duration': 0,
                'pause_count': 0
            },
            'detailed_segments': [],
            'recommendations': [f"Error: {error_message}"],
            'success': False,
            'error': error_message
        }
