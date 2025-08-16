import numpy as np
import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
import math

logger = logging.getLogger(__name__)

class ConfidenceDetector:
    """
    Advanced Confidence Detection for Presentation Analysis
    Combines insights from multiple models to assess overall presenter confidence
    Analyzes vocal patterns, visual cues, and behavioral indicators
    """
    
    def __init__(self):
        # Confidence indicators and their weights
        self.confidence_indicators = {
            'vocal_stability': {
                'weight': 0.25,
                'sources': ['speech_emotion', 'pitch_analysis', 'volume_consistency'],
                'description': 'Voice steadiness and control'
            },
            'speech_fluency': {
                'weight': 0.20,
                'sources': ['filler_detection', 'stutter_detection', 'wpm_analysis'],
                'description': 'Speech clarity and flow'
            },
            'visual_presence': {
                'weight': 0.25,
                'sources': ['eye_contact', 'posture_analysis', 'facial_emotion'],
                'description': 'Body language and visual engagement'
            },
            'gesture_confidence': {
                'weight': 0.15,
                'sources': ['hand_gesture'],
                'description': 'Hand gesture usage and effectiveness'
            },
            'emotional_state': {
                'weight': 0.15,
                'sources': ['speech_emotion', 'facial_emotion'],
                'description': 'Emotional control and expression'
            }
        }
        
        # Confidence levels and thresholds
        self.confidence_levels = {
            'very_high': {'min': 8.5, 'description': 'Exceptional confidence and presence'},
            'high': {'min': 7.0, 'description': 'Strong confidence with minor areas for improvement'},
            'moderate': {'min': 5.5, 'description': 'Good baseline confidence, some development needed'},
            'low': {'min': 4.0, 'description': 'Limited confidence, significant improvement opportunities'},
            'very_low': {'min': 0.0, 'description': 'Low confidence, substantial development required'}
        }
        
    async def analyze_confidence(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze overall presenter confidence from multiple model results
        
        Args:
            analysis_results: Dictionary containing results from all presentation analysis models
            
        Returns:
            Dictionary containing comprehensive confidence analysis
        """
        try:
            logger.info("Starting comprehensive confidence analysis")
            
            # Extract confidence indicators from each category
            vocal_confidence = await self._analyze_vocal_confidence(analysis_results)
            fluency_confidence = await self._analyze_speech_fluency(analysis_results)
            visual_confidence = await self._analyze_visual_presence(analysis_results)
            gesture_confidence = await self._analyze_gesture_confidence(analysis_results)
            emotional_confidence = await self._analyze_emotional_state(analysis_results)
            
            # Calculate weighted overall confidence
            confidence_scores = {
                'vocal_stability': vocal_confidence,
                'speech_fluency': fluency_confidence,
                'visual_presence': visual_confidence,
                'gesture_confidence': gesture_confidence,
                'emotional_state': emotional_confidence
            }
            
            overall_confidence = await self._calculate_overall_confidence(confidence_scores)
            
            # Analyze confidence patterns and trends
            confidence_patterns = await self._analyze_confidence_patterns(confidence_scores, analysis_results)
            
            # Generate insights and recommendations
            insights = await self._generate_confidence_insights(confidence_scores, overall_confidence)
            recommendations = await self._generate_confidence_recommendations(confidence_scores, insights)
            
            # Determine confidence level
            confidence_level = self._determine_confidence_level(overall_confidence)
            
            return {
                'overall_confidence_score': float(overall_confidence),
                'confidence_level': confidence_level,
                'confidence_breakdown': confidence_scores,
                'confidence_patterns': confidence_patterns,
                'strengths': insights.get('strengths', []),
                'improvement_areas': insights.get('improvement_areas', []),
                'recommendations': recommendations,
                'detailed_analysis': {
                    'vocal_analysis': await self._get_detailed_vocal_analysis(analysis_results),
                    'visual_analysis': await self._get_detailed_visual_analysis(analysis_results),
                    'behavioral_analysis': await self._get_detailed_behavioral_analysis(analysis_results)
                },
                'confidence_trajectory': await self._analyze_confidence_trajectory(analysis_results)
            }
            
        except Exception as e:
            logger.error(f"Error in confidence analysis: {e}")
            return self._get_error_result(str(e))
    
    async def _analyze_vocal_confidence(self, results: Dict[str, Any]) -> float:
        """Analyze vocal indicators of confidence"""
        try:
            vocal_score = 5.0  # Default neutral score
            
            # Speech emotion analysis
            speech_emotion = results.get('speech_emotion', {})
            if 'presentation_metrics' in speech_emotion:
                emotion_confidence = speech_emotion['presentation_metrics'].get('confidence_score', 5.0)
                vocal_score += (emotion_confidence - 5.0) * 0.4
            
            # Pitch analysis - consistent pitch suggests confidence
            pitch_analysis = results.get('pitch_analysis', {})
            if 'pitch_consistency' in pitch_analysis:
                pitch_consistency = pitch_analysis.get('pitch_consistency', 5.0)
                vocal_score += (pitch_consistency - 5.0) * 0.3
            
            # Volume consistency - stable volume indicates confidence
            volume_analysis = results.get('volume_consistency', {})
            if 'consistency_score' in volume_analysis:
                volume_consistency = volume_analysis.get('consistency_score', 5.0)
                vocal_score += (volume_consistency - 5.0) * 0.3
            
            return max(0.0, min(10.0, vocal_score))
            
        except Exception as e:
            logger.error(f"Error analyzing vocal confidence: {e}")
            return 5.0
    
    async def _analyze_speech_fluency(self, results: Dict[str, Any]) -> float:
        """Analyze speech fluency indicators of confidence"""
        try:
            fluency_score = 5.0
            
            # Filler detection - fewer fillers = higher confidence
            filler_detection = results.get('filler_detection', {})
            if 'disfluency_metrics' in filler_detection:
                fluency_score_from_filler = filler_detection['disfluency_metrics'].get('fluency_score', 5.0)
                fluency_score += (fluency_score_from_filler - 5.0) * 0.4
            
            # Stutter detection - less stuttering = higher confidence
            stutter_detection = results.get('stutter_detection', {})
            if 'fluency_score' in stutter_detection:
                stutter_fluency = stutter_detection.get('fluency_score', 5.0)
                fluency_score += (stutter_fluency - 5.0) * 0.4
            
            # WPM analysis - appropriate pace suggests confidence
            wpm_analysis = results.get('wpm_analysis', {})
            if 'pace_consistency' in wpm_analysis:
                pace_score = wpm_analysis['pace_consistency'].get('score', 5.0) * 10  # Convert 0-1 to 0-10
                fluency_score += (pace_score - 5.0) * 0.2
            
            return max(0.0, min(10.0, fluency_score))
            
        except Exception as e:
            logger.error(f"Error analyzing speech fluency: {e}")
            return 5.0
    
    async def _analyze_visual_presence(self, results: Dict[str, Any]) -> float:
        """Analyze visual presence indicators of confidence"""
        try:
            visual_score = 5.0
            
            # Eye contact - good eye contact indicates confidence
            eye_contact = results.get('eye_contact', {})
            if 'confidence_metrics' in eye_contact:
                eye_confidence = eye_contact['confidence_metrics'].get('average_confidence', 5.0)
                visual_score += (eye_confidence - 5.0) * 0.4
            elif 'attention_score' in eye_contact:
                # Fallback to attention score if confidence metrics not available
                attention_score = eye_contact.get('attention_score', 5.0)
                visual_score += (attention_score - 5.0) * 0.3
            
            # Posture analysis - good posture indicates confidence
            posture_analysis = results.get('posture_analysis', {})
            if 'posture_metrics' in posture_analysis:
                posture_confidence = posture_analysis['posture_metrics'].get('overall_posture_score', 5.0)
                visual_score += (posture_confidence - 5.0) * 0.4
            
            # Facial emotion - confident facial expressions
            facial_emotion = results.get('facial_emotion', {})
            if 'engagement_score' in facial_emotion:
                facial_engagement = facial_emotion.get('engagement_score', 5.0)
                visual_score += (facial_engagement - 5.0) * 0.2
            
            return max(0.0, min(10.0, visual_score))
            
        except Exception as e:
            logger.error(f"Error analyzing visual presence: {e}")
            return 5.0
    
    async def _analyze_gesture_confidence(self, results: Dict[str, Any]) -> float:
        """Analyze gesture-based indicators of confidence"""
        try:
            gesture_score = 5.0
            
            hand_gesture = results.get('hand_gesture', {})
            
            # Gesture effectiveness
            if 'effectiveness_analysis' in hand_gesture:
                effectiveness = hand_gesture['effectiveness_analysis'].get('average_effectiveness', 5.0)
                gesture_score += (effectiveness - 5.0) * 0.5
            
            # Gesture engagement
            if 'engagement_metrics' in hand_gesture:
                engagement = hand_gesture['engagement_metrics'].get('gesture_engagement_score', 5.0)
                gesture_score += (engagement - 5.0) * 0.3
            
            # Gesture variety (confident speakers use varied gestures)
            if 'gesture_statistics' in hand_gesture:
                variety = hand_gesture['gesture_statistics'].get('gesture_variety', 1)
                variety_score = min(10, variety * 2)  # Convert variety count to 0-10 scale
                gesture_score += (variety_score - 5.0) * 0.2
            
            return max(0.0, min(10.0, gesture_score))
            
        except Exception as e:
            logger.error(f"Error analyzing gesture confidence: {e}")
            return 5.0
    
    async def _analyze_emotional_state(self, results: Dict[str, Any]) -> float:
        """Analyze emotional indicators of confidence"""
        try:
            emotional_score = 5.0
            
            # Speech emotion confidence
            speech_emotion = results.get('speech_emotion', {})
            if 'presentation_metrics' in speech_emotion:
                speech_confidence = speech_emotion['presentation_metrics'].get('confidence_score', 5.0)
                emotional_score += (speech_confidence - 5.0) * 0.6
            
            # Facial emotion confidence
            facial_emotion = results.get('facial_emotion', {})
            if 'confidence_score' in facial_emotion:
                facial_confidence = facial_emotion.get('confidence_score', 5.0)
                emotional_score += (facial_confidence - 5.0) * 0.4
            
            return max(0.0, min(10.0, emotional_score))
            
        except Exception as e:
            logger.error(f"Error analyzing emotional state: {e}")
            return 5.0
    
    async def _calculate_overall_confidence(self, confidence_scores: Dict[str, float]) -> float:
        """Calculate weighted overall confidence score"""
        try:
            total_weighted_score = 0.0
            total_weight = 0.0
            
            for category, score in confidence_scores.items():
                if category in self.confidence_indicators:
                    weight = self.confidence_indicators[category]['weight']
                    total_weighted_score += score * weight
                    total_weight += weight
            
            overall_confidence = total_weighted_score / total_weight if total_weight > 0 else 5.0
            return max(0.0, min(10.0, overall_confidence))
            
        except Exception as e:
            logger.error(f"Error calculating overall confidence: {e}")
            return 5.0
    
    async def _analyze_confidence_patterns(self, confidence_scores: Dict[str, float], 
                                         analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze patterns in confidence indicators"""
        try:
            patterns = {}
            
            # Identify strongest and weakest areas
            sorted_scores = sorted(confidence_scores.items(), key=lambda x: x[1], reverse=True)
            patterns['strongest_area'] = {
                'category': sorted_scores[0][0],
                'score': sorted_scores[0][1],
                'description': self.confidence_indicators[sorted_scores[0][0]]['description']
            }
            patterns['weakest_area'] = {
                'category': sorted_scores[-1][0],
                'score': sorted_scores[-1][1],
                'description': self.confidence_indicators[sorted_scores[-1][0]]['description']
            }
            
            # Calculate confidence consistency
            score_values = list(confidence_scores.values())
            confidence_consistency = 10.0 - min(np.std(score_values) * 2, 10.0)
            patterns['consistency'] = float(confidence_consistency)
            
            # Analyze balance across categories
            high_confidence_areas = sum(1 for score in score_values if score >= 7.0)
            patterns['confidence_balance'] = {
                'high_confidence_areas': high_confidence_areas,
                'total_areas': len(score_values),
                'balance_rating': 'excellent' if high_confidence_areas >= 4 else 
                               'good' if high_confidence_areas >= 3 else
                               'moderate' if high_confidence_areas >= 2 else 'needs_improvement'
            }
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error analyzing confidence patterns: {e}")
            return {}
    
    async def _generate_confidence_insights(self, confidence_scores: Dict[str, float], 
                                          overall_confidence: float) -> Dict[str, List[str]]:
        """Generate insights about confidence strengths and areas for improvement"""
        try:
            insights = {'strengths': [], 'improvement_areas': []}
            
            for category, score in confidence_scores.items():
                category_info = self.confidence_indicators.get(category, {})
                description = category_info.get('description', category)
                
                if score >= 7.5:
                    insights['strengths'].append(f"Excellent {description.lower()} demonstrates strong confidence")
                elif score >= 6.5:
                    insights['strengths'].append(f"Good {description.lower()} shows developing confidence")
                elif score <= 4.5:
                    insights['improvement_areas'].append(f"{description} needs significant improvement for confidence building")
                elif score <= 5.5:
                    insights['improvement_areas'].append(f"{description} could be enhanced to boost overall confidence")
            
            # Overall confidence insights
            if overall_confidence >= 8.0:
                insights['strengths'].append("Overall presentation demonstrates exceptional confidence and presence")
            elif overall_confidence >= 7.0:
                insights['strengths'].append("Strong overall confidence with good presentation skills")
            elif overall_confidence <= 4.5:
                insights['improvement_areas'].append("Overall confidence needs substantial development")
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating confidence insights: {e}")
            return {'strengths': [], 'improvement_areas': []}
    
    async def _generate_confidence_recommendations(self, confidence_scores: Dict[str, float], 
                                                 insights: Dict[str, List[str]]) -> List[str]:
        """Generate specific recommendations for building confidence"""
        try:
            recommendations = []
            
            # Category-specific recommendations
            for category, score in confidence_scores.items():
                if score < 6.0:  # Areas needing improvement
                    if category == 'vocal_stability':
                        recommendations.append(
                            "Practice vocal exercises and breathing techniques to improve voice stability and control."
                        )
                    elif category == 'speech_fluency':
                        recommendations.append(
                            "Work on speech fluency through practice presentations and mindfulness techniques to reduce fillers."
                        )
                    elif category == 'visual_presence':
                        recommendations.append(
                            "Improve visual presence through posture practice, eye contact exercises, and body language awareness."
                        )
                    elif category == 'gesture_confidence':
                        recommendations.append(
                            "Practice purposeful hand gestures and body movements to enhance presentation delivery."
                        )
                    elif category == 'emotional_state':
                        recommendations.append(
                            "Develop emotional regulation techniques and practice positive visualization before presentations."
                        )
            
            # General confidence-building recommendations
            overall_score = np.mean(list(confidence_scores.values()))
            if overall_score < 6.0:
                recommendations.extend([
                    "Consider joining a public speaking group like Toastmasters to build overall confidence.",
                    "Practice presentations regularly in low-stakes environments to build comfort and experience.",
                    "Work with a speaking coach or mentor to develop personalized confidence-building strategies."
                ])
            elif overall_score < 7.5:
                recommendations.extend([
                    "Continue practicing to maintain and build upon your developing confidence.",
                    "Record yourself presenting to identify specific areas for refinement.",
                    "Seek opportunities to present to different audiences to broaden your experience."
                ])
            
            # If no specific recommendations, provide encouragement
            if not recommendations:
                recommendations.append(
                    "Excellent confidence levels! Continue practicing to maintain this strong presentation presence."
                )
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating confidence recommendations: {e}")
            return ["Continue practicing presentation skills to build confidence."]
    
    def _determine_confidence_level(self, overall_confidence: float) -> Dict[str, str]:
        """Determine confidence level based on overall score"""
        try:
            for level, info in self.confidence_levels.items():
                if overall_confidence >= info['min']:
                    return {
                        'level': level,
                        'description': info['description'],
                        'score_range': f"{info['min']:.1f}+"
                    }
            
            # Fallback
            return {
                'level': 'very_low',
                'description': self.confidence_levels['very_low']['description'],
                'score_range': "0.0-4.0"
            }
            
        except Exception as e:
            logger.error(f"Error determining confidence level: {e}")
            return {
                'level': 'unknown',
                'description': 'Unable to determine confidence level',
                'score_range': 'unknown'
            }
    
    async def _get_detailed_vocal_analysis(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed vocal confidence analysis"""
        try:
            vocal_details = {}
            
            # Speech emotion details
            speech_emotion = results.get('speech_emotion', {})
            if 'presentation_metrics' in speech_emotion:
                vocal_details['emotional_control'] = speech_emotion['presentation_metrics'].get('confidence_score', 5.0)
                vocal_details['emotional_consistency'] = speech_emotion['presentation_metrics'].get('emotion_consistency', 5.0)
            
            # Pitch analysis details
            pitch_analysis = results.get('pitch_analysis', {})
            vocal_details['pitch_control'] = pitch_analysis.get('pitch_consistency', 5.0)
            vocal_details['pitch_variety'] = pitch_analysis.get('pitch_variety', 5.0)
            
            # Volume analysis
            volume_analysis = results.get('volume_consistency', {})
            vocal_details['volume_control'] = volume_analysis.get('consistency_score', 5.0)
            
            return vocal_details
            
        except Exception as e:
            logger.error(f"Error getting detailed vocal analysis: {e}")
            return {}
    
    async def _get_detailed_visual_analysis(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed visual confidence analysis"""
        try:
            visual_details = {}
            
            # Eye contact details
            eye_contact = results.get('eye_contact', {})
            if 'confidence_metrics' in eye_contact:
                visual_details['eye_contact_confidence'] = eye_contact['confidence_metrics'].get('average_confidence', 5.0)
            visual_details['audience_engagement'] = eye_contact.get('attention_score', 5.0)
            
            # Posture details
            posture_analysis = results.get('posture_analysis', {})
            if 'posture_metrics' in posture_analysis:
                visual_details['posture_confidence'] = posture_analysis['posture_metrics'].get('overall_posture_score', 5.0)
            
            # Facial expression details
            facial_emotion = results.get('facial_emotion', {})
            visual_details['facial_engagement'] = facial_emotion.get('engagement_score', 5.0)
            
            return visual_details
            
        except Exception as e:
            logger.error(f"Error getting detailed visual analysis: {e}")
            return {}
    
    async def _get_detailed_behavioral_analysis(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed behavioral confidence analysis"""
        try:
            behavioral_details = {}
            
            # Gesture analysis
            hand_gesture = results.get('hand_gesture', {})
            if 'engagement_metrics' in hand_gesture:
                behavioral_details['gesture_engagement'] = hand_gesture['engagement_metrics'].get('gesture_engagement_score', 5.0)
            
            # Speech patterns
            filler_detection = results.get('filler_detection', {})
            if 'disfluency_metrics' in filler_detection:
                behavioral_details['speech_fluency'] = filler_detection['disfluency_metrics'].get('fluency_score', 5.0)
            
            # Speaking pace
            wpm_analysis = results.get('wpm_analysis', {})
            if 'pace_consistency' in wpm_analysis:
                behavioral_details['pace_control'] = wpm_analysis['pace_consistency'].get('score', 0.5) * 10
            
            return behavioral_details
            
        except Exception as e:
            logger.error(f"Error getting detailed behavioral analysis: {e}")
            return {}
    
    async def _analyze_confidence_trajectory(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze confidence trajectory throughout the presentation"""
        try:
            trajectory = {}
            
            # Look for temporal data in models that provide it
            speech_emotion = results.get('speech_emotion', {})
            if 'temporal_analysis' in speech_emotion:
                confidence_trend = speech_emotion['temporal_analysis'].get('confidence_trend', [])
                if confidence_trend:
                    trajectory['confidence_trend'] = 'improving' if confidence_trend[-1] > confidence_trend[0] else 'declining' if confidence_trend[-1] < confidence_trend[0] else 'stable'
                    trajectory['confidence_stability'] = float(10.0 - min(np.std(confidence_trend) * 2, 10.0))
            
            # Eye contact patterns
            eye_contact = results.get('eye_contact', {})
            if 'presentation_patterns' in eye_contact:
                pattern_quality = eye_contact['presentation_patterns'].get('pattern_quality_score', 5.0)
                trajectory['engagement_pattern_quality'] = float(pattern_quality)
            
            # Overall trajectory assessment
            if not trajectory:
                trajectory['assessment'] = "Insufficient temporal data for trajectory analysis"
            else:
                avg_stability = np.mean([v for v in trajectory.values() if isinstance(v, (int, float))])
                trajectory['overall_trajectory'] = 'strong' if avg_stability >= 7 else 'developing' if avg_stability >= 5 else 'needs_work'
            
            return trajectory
            
        except Exception as e:
            logger.error(f"Error analyzing confidence trajectory: {e}")
            return {'assessment': 'Unable to analyze confidence trajectory'}
    
    def _get_error_result(self, error_message: str) -> Dict[str, Any]:
        """Return standardized error result"""
        return {
            'error': error_message,
            'overall_confidence_score': 5.0,
            'confidence_level': {
                'level': 'unknown',
                'description': 'Unable to assess confidence due to error',
                'score_range': 'unknown'
            },
            'confidence_breakdown': {
                'vocal_stability': 5.0,
                'speech_fluency': 5.0,
                'visual_presence': 5.0,
                'gesture_confidence': 5.0,
                'emotional_state': 5.0
            },
            'recommendations': ['Unable to analyze confidence due to technical error']
        } 