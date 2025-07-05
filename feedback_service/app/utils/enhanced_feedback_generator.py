import logging
from typing import Dict, Any, List, Tuple
import asyncio
import math

logger = logging.getLogger(__name__)

class EnhancedFeedbackGenerator:
    """
    Enhanced feedback generator that provides detailed scores for each model
    and comprehensive overall feedback combining all models.
    """
    
    def __init__(self):
        # Enhanced model categories with improved analysis
        self.model_categories = {
            "speech": {
                "models": ["speech_emotion", "wpm_analysis", "pitch_analysis", "volume_consistency", "filler_detection", "stutter_detection", "lexical_richness"],
                "weight": 0.45,
                "description": "Speech quality and delivery"
            },
            "visual": {
                "models": ["facial_emotion", "eye_contact", "hand_gesture", "posture_analysis"],
                "weight": 0.35,
                "description": "Visual presentation and body language"
            },
            "content": {
                "models": ["keyword_relevance", "confidence_detector"],
                "weight": 0.20,
                "description": "Content relevance and overall confidence"
            }
        }
        
        # Model-specific scoring configurations - Fixed weights to sum to 1.0
        self.model_scoring = {
            "speech_emotion": {
                "score_field": "emotional_intensity",
                "fallback_fields": ["neutrality_score", "overall_score"],
                "description": "Emotional expression and engagement",
                "max_score": 1.0,
                "weight": 0.10
            },
            "wpm_analysis": {
                "score_field": "overall_score",
                "fallback_fields": ["pace_consistency.score", "overall_wpm"],
                "description": "Speaking pace and consistency",
                "max_score": 10.0,  # overall_score is 0-10
                "weight": 0.08
            },
            "pitch_analysis": {
                "score_field": "pitch_variety",
                "fallback_fields": ["pitch_consistency", "overall_score"],
                "description": "Vocal variety and emphasis",
                "max_score": 10.0,
                "weight": 0.08
            },
            "volume_consistency": {
                "score_field": "consistency_score",
                "fallback_fields": ["volume_stability", "overall_score"],
                "description": "Volume control and projection",
                "max_score": 10.0,
                "weight": 0.07
            },
            "filler_detection": {
                "score_field": "filler_frequency_score",
                "fallback_fields": ["overall_score"],
                "description": "Speech clarity and professionalism",
                "max_score": 10.0,
                "weight": 0.07
            },
            "stutter_detection": {
                "score_field": "fluency_score",
                "fallback_fields": ["overall_score"],
                "description": "Speech fluency and confidence",
                "max_score": 10.0,
                "weight": 0.10
            },
            "lexical_richness": {
                "score_field": "lexical_diversity",
                "fallback_fields": ["vocabulary_score", "overall_score"],
                "description": "Vocabulary sophistication",
                "max_score": 1.0,
                "weight": 0.07
            },
            "facial_emotion": {
                "score_field": "engagement_metrics.engagement_score",
                "fallback_fields": ["engagement_metrics.confidence_score", "overall_score"],
                "description": "Facial expression and emotional connection",
                "max_score": 10.0,
                "weight": 0.10
            },
            "eye_contact": {
                "score_field": "attention_score",
                "fallback_fields": ["eye_contact_percentage", "overall_score"],
                "description": "Audience engagement through eye contact",
                "max_score": 10.0,
                "weight": 0.12
            },
            "hand_gesture": {
                "score_field": "overall_score",
                "fallback_fields": ["gesture_effectiveness", "engagement_metrics.gesture_engagement_score"],
                "description": "Non-verbal communication effectiveness",
                "max_score": 10.0,
                "weight": 0.06
            },
            "posture_analysis": {
                "score_field": "posture_score",
                "fallback_fields": ["confidence_score", "overall_score"],
                "description": "Professional appearance and confidence",
                "max_score": 10.0,
                "weight": 0.12
            },
            "keyword_relevance": {
                "score_field": "overall_score",
                "fallback_fields": ["relevance_score", "keyword_coverage"],
                "description": "Content relevance and focus",
                "max_score": 10.0,
                "weight": 0.05
            },
            "confidence_detector": {
                "score_field": "overall_confidence_score",
                "fallback_fields": ["confidence_breakdown", "overall_score"],
                "description": "Overall presenter confidence",
                "max_score": 10.0,
                "weight": 0.15
            }
        }
        
        # Validate that weights sum to 1.0
        total_weight = sum(config["weight"] for config in self.model_scoring.values())
        if abs(total_weight - 1.0) > 0.001:
            logger.warning(f"Model weights sum to {total_weight}, not 1.0. Normalizing...")
            # Normalize weights to sum to 1.0
            for config in self.model_scoring.values():
                config["weight"] /= total_weight
    
    async def generate_comprehensive_feedback(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate comprehensive feedback with individual model scores and overall assessment.
        
        Args:
            analysis_results: Dictionary containing results from all models
            
        Returns:
            Dictionary with detailed feedback including individual scores and overall assessment
        """
        try:
            logger.info("Generating comprehensive feedback...")
            
            # Extract individual model scores
            individual_scores = await self._extract_individual_scores(analysis_results)
            
            # Calculate category scores
            category_scores = await self._calculate_category_scores(individual_scores)
            
            # Calculate overall score
            overall_score = await self._calculate_overall_score(category_scores)
            
            # Generate detailed feedback
            detailed_feedback = await self._generate_detailed_feedback(individual_scores, category_scores)
            
            # Generate recommendations
            recommendations = await self._generate_recommendations(individual_scores, category_scores)
            
            # Create comprehensive result
            result = {
                "individual_model_scores": individual_scores,
                "category_scores": category_scores,
                "overall_score": overall_score,
                "detailed_feedback": detailed_feedback,
                "recommendations": recommendations,
                "summary": await self._generate_summary(overall_score, category_scores),
                "score_breakdown": await self._generate_score_breakdown(individual_scores, category_scores, overall_score)
            }
            
            logger.info("Comprehensive feedback generation completed")
            return result
            
        except Exception as e:
            logger.error(f"Error generating comprehensive feedback: {e}")
            return self._get_error_result(str(e))
    
    async def _extract_individual_scores(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and normalize scores from individual models."""
        individual_scores = {}
        
        for model_name, config in self.model_scoring.items():
            if model_name in analysis_results:
                model_result = analysis_results[model_name]
                
                if isinstance(model_result, dict) and "error" not in model_result:
                    # Try to extract score
                    score = self._extract_score_from_model(model_result, config)
                    
                    if score is not None and score != -1.0:
                        individual_scores[model_name] = {
                            "score": score,
                            "normalized_score": self._normalize_score(score, config["max_score"]),
                            "description": config["description"],
                            "weight": config["weight"],
                            "category": self._get_model_category(model_name),
                            "details": self._extract_model_details(model_result, model_name),
                            "status": "valid"
                        }
                    else:
                        individual_scores[model_name] = {
                            "score": -1.0,
                            "normalized_score": -1.0,
                            "description": config["description"],
                            "weight": config["weight"],
                            "category": self._get_model_category(model_name),
                            "status": "no_score_available",
                            "details": model_result
                        }
                else:
                    individual_scores[model_name] = {
                        "score": -1.0,
                        "normalized_score": -1.0,
                        "description": config["description"],
                        "weight": config["weight"],
                        "category": self._get_model_category(model_name),
                        "status": "error" if isinstance(model_result, dict) and "error" in model_result else "not_available",
                        "details": model_result
                    }
        
        return individual_scores
    
    def _extract_score_from_model(self, model_result: Dict[str, Any], config: Dict[str, Any]) -> float:
        """Extract score from model result using configured fields."""
        # Try primary score field (handle nested paths)
        if config["score_field"] in model_result:
            try:
                score_value = model_result[config["score_field"]]
                if score_value is None:
                    return -1.0
                score = float(score_value)
                # Validate score is not NaN or infinite
                if math.isnan(score) or math.isinf(score):
                    return -1.0
                return score
            except (ValueError, TypeError):
                pass
        elif "." in config["score_field"]:
            # Handle nested field paths like "pace_consistency.score"
            try:
                field_parts = config["score_field"].split(".")
                current_value = model_result
                for part in field_parts:
                    if isinstance(current_value, dict) and part in current_value:
                        current_value = current_value[part]
                    else:
                        current_value = None
                        break
                if current_value is not None:
                    if current_value is None:
                        return -1.0
                    score = float(current_value)
                    # Validate score is not NaN or infinite
                    if math.isnan(score) or math.isinf(score):
                        return -1.0
                    return score
            except (ValueError, TypeError, KeyError):
                pass
        
        # Try fallback fields
        for fallback_field in config["fallback_fields"]:
            if fallback_field in model_result:
                try:
                    score_value = model_result[fallback_field]
                    if score_value is None:
                        continue
                    score = float(score_value)
                    # Validate score is not NaN or infinite
                    if math.isnan(score) or math.isinf(score):
                        continue
                    return score
                except (ValueError, TypeError):
                    continue
        
        # Try common score fields
        common_score_fields = ["overall_score", "score", "confidence_score", "attention_score", 
                              "engagement_score", "fluency_score", "consistency_score"]
        
        for field in common_score_fields:
            if field in model_result:
                try:
                    score_value = model_result[field]
                    if score_value is None:
                        continue
                    score = float(score_value)
                    # Validate score is not NaN or infinite
                    if math.isnan(score) or math.isinf(score):
                        continue
                    return score
                except (ValueError, TypeError):
                    continue
        
        return -1.0
    
    def _normalize_score(self, score: float, max_score: float) -> float:
        """Normalize score to 0-10 range."""
        if score is None or score == -1.0:
            return -1.0
        
        # Validate inputs
        if math.isnan(score) or math.isinf(score):
            return -1.0
        
        if max_score <= 0:
            return -1.0
        
        try:
        if max_score <= 1.0:
            # Score is already in 0-1 range, scale to 0-10
                normalized = score * 10
        elif max_score <= 10.0:
            # Score is already in 0-10 range
                normalized = score
        else:
            # Score is in larger range, normalize to 0-10
                normalized = (score / max_score) * 10
            
            # Ensure result is within 0-10 range
            return max(0.0, min(10.0, normalized))
        except (ValueError, TypeError, ZeroDivisionError):
            return -1.0
    
    def _get_model_category(self, model_name: str) -> str:
        """Get the category for a given model."""
        for category, config in self.model_categories.items():
            if model_name in config["models"]:
                return category
        return "other"
    
    def _extract_model_details(self, model_result: Dict[str, Any], model_name: str) -> Dict[str, Any]:
        """Extract relevant details from model result."""
        details = {}
        
        # Extract key metrics based on model type
        if model_name == "speech_emotion":
            details.update({
                "dominant_emotion": model_result.get("dominant_emotion", {}),
                "emotional_variance": model_result.get("metrics", {}).get("emotional_variance", 0),
                "emotions": model_result.get("emotions", {})
            })
        elif model_name == "wpm_analysis":
            details.update({
                "wpm": model_result.get("overall_wpm", 0),
                "word_count": model_result.get("word_count", 0),
                "pace_consistency": model_result.get("pace_consistency", {}),
                "assessment": model_result.get("assessment", {})
            })
        elif model_name == "filler_detection":
            details.update({
                "filler_count": model_result.get("filler_count", 0),
                "filler_words": model_result.get("detected_fillers", []),
                "filler_frequency": model_result.get("filler_frequency", 0)
            })
        elif model_name == "stutter_detection":
            details.update({
                "stutter_count": model_result.get("stutter_count", 0),
                "stutter_frequency": model_result.get("stutter_frequency", 0),
                "fluency_issues": model_result.get("detected_issues", [])
            })
        elif model_name == "eye_contact":
            details.update({
                "eye_contact_percentage": model_result.get("eye_contact_percentage", 0),
                "attention_score": model_result.get("attention_score", 0),
                "gaze_patterns": model_result.get("gaze_analysis", {})
            })
        elif model_name == "posture_analysis":
            details.update({
                "posture_score": model_result.get("posture_score", 0),
                "confidence_score": model_result.get("confidence_score", 0),
                "posture_issues": model_result.get("detected_issues", [])
            })
        elif model_name == "facial_emotion":
            details.update({
                "engagement_score": model_result.get("engagement_metrics", {}).get("engagement_score", 0),
                "confidence_score": model_result.get("engagement_metrics", {}).get("confidence_score", 0),
                "face_detection_rate": model_result.get("face_detection_rate", 0),
                "dominant_emotion": model_result.get("emotion_statistics", {}).get("dominant_emotion", {}),
                "positivity_score": model_result.get("emotion_statistics", {}).get("positivity_score", 0),
                "analysis_method": model_result.get("analysis_method", "unknown")
            })
        elif model_name == "keyword_relevance":
            details.update({
                "relevance_score": model_result.get("relevance_score", 0),
                "keyword_coverage": model_result.get("keyword_coverage", 0),
                "score_breakdown": model_result.get("relevance_assessment", {}).get("score_breakdown", {}),
                "topic_focus": model_result.get("topic_coherence", {}).get("topic_focus", "unknown"),
                "semantic_coherence": model_result.get("topic_coherence", {}).get("semantic_coherence", 0),
                "diversity_score": model_result.get("keyword_diversity", {}).get("diversity_score", 0)
            })
        
        return details
    
    async def _calculate_category_scores(self, individual_scores: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate weighted scores for each category."""
        category_scores = {}
        
        for category, config in self.model_categories.items():
            category_models = config["models"]
            scores = []
            weights = []
            
            for model_name in category_models:
                if model_name in individual_scores:
                    score_info = individual_scores[model_name]
                    # Only include valid scores (not -1.0)
                    if score_info["normalized_score"] is not None and score_info["normalized_score"] != -1.0:
                        scores.append(score_info["normalized_score"])
                        weights.append(score_info["weight"])
            
            if scores and weights:
                # Calculate weighted average
                weighted_sum = sum(score * weight for score, weight in zip(scores, weights))
                total_weight = sum(weights)
                category_score = weighted_sum / total_weight if total_weight > 0 else 5.0
            else:
                category_score = 5.0
            
            category_scores[category] = {
                "score": round(category_score, 2),
                "description": config["description"],
                "weight": config["weight"],
                "models_used": len(scores),
                "total_models": len(category_models),
                "valid_models": len([m for m in category_models if m in individual_scores and 
                                   individual_scores[m]["normalized_score"] != -1.0])
            }
        
        return category_scores
    
    async def _calculate_overall_score(self, category_scores: Dict[str, Any]) -> float:
        """Calculate overall weighted score from category scores."""
        weighted_sum = 0
        total_weight = 0
        
        for category, score_info in category_scores.items():
            weight = score_info["weight"]
            score = score_info["score"]
            weighted_sum += score * weight
            total_weight += weight
        
        overall_score = weighted_sum / total_weight if total_weight > 0 else 5.0
        return round(overall_score, 2)
    
    async def _generate_detailed_feedback(self, individual_scores: Dict[str, Any], 
                                        category_scores: Dict[str, Any]) -> Dict[str, Any]:
        """Generate detailed feedback for each category and model."""
        detailed_feedback = {
            "speech_feedback": await self._generate_speech_feedback(individual_scores),
            "visual_feedback": await self._generate_visual_feedback(individual_scores),
            "content_feedback": await self._generate_content_feedback(individual_scores),
            "strengths": [],
            "areas_for_improvement": []
        }
        
        # Identify strengths and areas for improvement
        strengths, improvements = self._identify_strengths_and_improvements(individual_scores, category_scores)
        detailed_feedback["strengths"] = strengths
        detailed_feedback["areas_for_improvement"] = improvements
        
        return detailed_feedback
    
    async def _generate_speech_feedback(self, individual_scores: Dict[str, Any]) -> Dict[str, Any]:
        """Generate detailed speech feedback."""
        speech_feedback = {
            "overall_assessment": "",
            "key_metrics": {},
            "specific_feedback": {}
        }
        
        # Analyze speech components
        speech_components = ["speech_emotion", "wpm_analysis", "pitch_analysis", "volume_consistency", 
                           "filler_detection", "stutter_detection", "lexical_richness"]
        
        speech_scores = []
        speech_weights = []
        for component in speech_components:
            if component in individual_scores:
                score_info = individual_scores[component]
                # Only include valid scores (not -1.0)
                if score_info["normalized_score"] is not None and score_info["normalized_score"] != -1.0:
                speech_scores.append(score_info["normalized_score"])
                speech_weights.append(score_info["weight"])
                
                # Generate specific feedback for each component
                speech_feedback["specific_feedback"][component] = self._generate_component_feedback(
                    component, score_info
                )
        
        if speech_scores and speech_weights:
            # Calculate weighted average instead of simple average
            weighted_sum = sum(score * weight for score, weight in zip(speech_scores, speech_weights))
            total_weight = sum(speech_weights)
            avg_speech_score = weighted_sum / total_weight if total_weight > 0 else 5.0
            speech_feedback["overall_assessment"] = self._get_speech_assessment(avg_speech_score)
            speech_feedback["key_metrics"] = {
                "average_score": round(avg_speech_score, 2),
                "components_analyzed": len(speech_scores),
                "total_components": len(speech_components),
                "weighted_average": True
            }
        else:
            speech_feedback["overall_assessment"] = "Insufficient speech data for analysis"
            speech_feedback["key_metrics"] = {
                "average_score": 5.0,
                "components_analyzed": 0,
                "total_components": len(speech_components),
                "weighted_average": True
            }
        
        return speech_feedback
    
    async def _generate_visual_feedback(self, individual_scores: Dict[str, Any]) -> Dict[str, Any]:
        """Generate detailed visual feedback."""
        visual_feedback = {
            "overall_assessment": "",
            "key_metrics": {},
            "specific_feedback": {}
        }
        
        # Analyze visual components
        visual_components = ["facial_emotion", "eye_contact", "hand_gesture", "posture_analysis"]
        
        visual_scores = []
        visual_weights = []
        for component in visual_components:
            if component in individual_scores:
                score_info = individual_scores[component]
                # Only include valid scores (not -1.0)
                if score_info["normalized_score"] is not None and score_info["normalized_score"] != -1.0:
                visual_scores.append(score_info["normalized_score"])
                visual_weights.append(score_info["weight"])
                
                # Generate specific feedback for each component
                visual_feedback["specific_feedback"][component] = self._generate_component_feedback(
                    component, score_info
                )
        
        if visual_scores and visual_weights:
            # Calculate weighted average instead of simple average
            weighted_sum = sum(score * weight for score, weight in zip(visual_scores, visual_weights))
            total_weight = sum(visual_weights)
            avg_visual_score = weighted_sum / total_weight if total_weight > 0 else 5.0
            visual_feedback["overall_assessment"] = self._get_visual_assessment(avg_visual_score)
            visual_feedback["key_metrics"] = {
                "average_score": round(avg_visual_score, 2),
                "components_analyzed": len(visual_scores),
                "total_components": len(visual_components),
                "weighted_average": True
            }
        else:
            visual_feedback["overall_assessment"] = "Insufficient visual data for analysis"
            visual_feedback["key_metrics"] = {
                "average_score": 5.0,
                "components_analyzed": 0,
                "total_components": len(visual_components),
                "weighted_average": True
            }
        
        return visual_feedback
    
    async def _generate_content_feedback(self, individual_scores: Dict[str, Any]) -> Dict[str, Any]:
        """Generate detailed content feedback."""
        content_feedback = {
            "overall_assessment": "",
            "key_metrics": {},
            "specific_feedback": {}
        }
        
        if "keyword_relevance" in individual_scores:
            score_info = individual_scores["keyword_relevance"]
            content_feedback["specific_feedback"]["keyword_relevance"] = self._generate_component_feedback(
                "keyword_relevance", score_info
            )
            content_feedback["overall_assessment"] = self._get_content_assessment(score_info["normalized_score"])
            content_feedback["key_metrics"] = {
                "relevance_score": score_info["normalized_score"]
            }
        
        return content_feedback
    
    def _generate_component_feedback(self, component: str, score_info: Dict[str, Any]) -> Dict[str, Any]:
        """Generate specific feedback for a component."""
        score = score_info["normalized_score"]
        
        feedback = {
            "score": score,
            "assessment": self._get_score_assessment(score),
            "feedback": self._get_component_specific_feedback(component, score_info),
            "status": "excellent" if score >= 8 else "good" if score >= 6 else "needs_improvement" if score >= 4 else "poor"
        }
        
        return feedback
    
    def _get_score_assessment(self, score: float) -> str:
        """Get assessment based on score."""
        if score >= 8.5:
            return "Excellent"
        elif score >= 7.0:
            return "Very Good"
        elif score >= 6.0:
            return "Good"
        elif score >= 5.0:
            return "Average"
        elif score >= 4.0:
            return "Below Average"
        else:
            return "Needs Significant Improvement"
    
    def _get_component_specific_feedback(self, component: str, score_info: Dict[str, Any]) -> str:
        """Get component-specific feedback."""
        score = score_info["normalized_score"]
        details = score_info.get("details", {})
        
        if component == "speech_emotion":
            if score >= 8:
                return "Excellent emotional expression and engagement with the audience."
            elif score >= 6:
                return "Good emotional delivery. Consider varying tone more for better engagement."
            else:
                return "Work on expressing emotions more naturally and connecting with your audience."
        
        elif component == "wpm_analysis":
            wpm = details.get("wpm", 0)
            if 120 <= wpm <= 160:
                return f"Good speaking pace at {wpm} WPM. Maintains audience engagement."
            elif wpm > 160:
                return f"Speaking pace is fast ({wpm} WPM). Consider slowing down for better comprehension."
            else:
                return f"Speaking pace is slow ({wpm} WPM). Work on building confidence and fluency."
        
        elif component == "eye_contact":
            eye_contact_pct = details.get("eye_contact_percentage", 0)
            if eye_contact_pct >= 70:
                return f"Excellent eye contact ({eye_contact_pct}%). Maintains strong audience connection."
            elif eye_contact_pct >= 50:
                return f"Good eye contact ({eye_contact_pct}%). Continue working on audience engagement."
            else:
                return f"Limited eye contact ({eye_contact_pct}%). Practice looking at your audience more."
        
        elif component == "posture_analysis":
            if score >= 8:
                return "Excellent posture and professional appearance. Projects confidence."
            elif score >= 6:
                return "Good posture. Minor adjustments can enhance your professional presence."
            else:
                return "Work on maintaining confident posture. Stand tall and avoid slouching."
        
        elif component == "facial_emotion":
            face_detection_rate = details.get("face_detection_rate", 0)
            analysis_method = details.get("analysis_method", "unknown")
            if score >= 8:
                return f"Excellent facial expressions and emotional engagement. Face detection rate: {face_detection_rate:.1%}."
            elif score >= 6:
                return f"Good facial expressions. Consider showing more emotion to connect with your audience. Face detection rate: {face_detection_rate:.1%}."
            else:
                return f"Work on expressing emotions more naturally through facial expressions. Face detection rate: {face_detection_rate:.1%}."
        
        elif component == "keyword_relevance":
            relevance_score = details.get("relevance_score", 0)
            if score >= 8:
                return f"Excellent content relevance and focus on key topics (relevance score: {relevance_score:.1f}/10)."
            elif score >= 6:
                return f"Good content structure with appropriate topic coverage (relevance score: {relevance_score:.1f}/10)."
            else:
                return f"Content could be more focused and relevant to the main topic (relevance score: {relevance_score:.1f}/10)."
        
        else:
            if score >= 8:
                return f"Excellent {component.replace('_', ' ')} performance."
            elif score >= 6:
                return f"Good {component.replace('_', ' ')}. Room for improvement."
            else:
                return f"Needs improvement in {component.replace('_', ' ')}."
    
    def _get_speech_assessment(self, avg_score: float) -> str:
        """Get overall speech assessment."""
        if avg_score >= 8:
            return "Exceptional speech delivery with excellent vocal variety and clarity."
        elif avg_score >= 7:
            return "Strong speech skills with good vocal control and expression."
        elif avg_score >= 6:
            return "Good speech foundation with room for improvement in specific areas."
        else:
            return "Speech skills need development. Focus on clarity, pace, and vocal variety."
    
    def _get_visual_assessment(self, avg_score: float) -> str:
        """Get overall visual assessment."""
        if avg_score >= 8:
            return "Outstanding visual presentation with excellent body language and engagement."
        elif avg_score >= 7:
            return "Strong visual presence with good audience connection."
        elif avg_score >= 6:
            return "Good visual foundation with opportunities for enhancement."
        else:
            return "Visual presentation needs work. Focus on eye contact, posture, and gestures."
    
    def _get_content_assessment(self, score: float) -> str:
        """Get overall content assessment."""
        if score >= 8:
            return "Excellent content relevance and focus on key topics."
        elif score >= 6:
            return "Good content structure with appropriate topic coverage."
        else:
            return "Content could be more focused and relevant to the main topic."
    
    def _identify_strengths_and_improvements(self, individual_scores: Dict[str, Any], 
                                           category_scores: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        """Identify strengths and areas for improvement."""
        strengths = []
        improvements = []
        
        # Identify top performing models
        high_scores = []
        low_scores = []
        
        for model_name, score_info in individual_scores.items():
            if score_info["normalized_score"] is not None:
                if score_info["normalized_score"] >= 8:
                    high_scores.append((model_name, score_info))
                elif score_info["normalized_score"] <= 5:
                    low_scores.append((model_name, score_info))
        
        # Generate strengths
        if high_scores:
            for model_name, score_info in high_scores[:3]:  # Top 3 strengths
                strengths.append(f"Strong {score_info['description'].lower()}")
        
        # Generate improvements
        if low_scores:
            for model_name, score_info in low_scores[:3]:  # Top 3 areas for improvement
                improvements.append(f"Improve {score_info['description'].lower()}")
        
        # Add category-based feedback
        for category, score_info in category_scores.items():
            if score_info["score"] >= 7.5:
                strengths.append(f"Excellent {category} skills")
            elif score_info["score"] <= 5:
                improvements.append(f"Focus on {category} development")
        
        return strengths, improvements
    
    async def _generate_recommendations(self, individual_scores: Dict[str, Any], 
                                      category_scores: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = []
        
        # Generate recommendations based on low scores
        for model_name, score_info in individual_scores.items():
            if score_info["normalized_score"] is not None and score_info["normalized_score"] <= 6:
                recommendations.extend(self._get_model_recommendations(model_name, score_info))
        
        # Add general recommendations
        overall_score = await self._calculate_overall_score(category_scores)
        if overall_score <= 6:
            recommendations.append("Consider working with a presentation coach to improve overall skills.")
            recommendations.append("Practice regularly with video recording and self-review.")
        
        # Remove duplicates and limit to top recommendations
        unique_recommendations = list(dict.fromkeys(recommendations))
        return unique_recommendations[:10]  # Limit to top 10 recommendations
    
    def _get_model_recommendations(self, model_name: str, score_info: Dict[str, Any]) -> List[str]:
        """Get specific recommendations for a model."""
        recommendations = []
        
        if model_name == "speech_emotion":
            recommendations.extend([
                "Practice varying your tone and pitch to express different emotions",
                "Record yourself and listen for emotional engagement",
                "Work on connecting emotionally with your audience"
            ])
        elif model_name == "wpm_analysis":
            recommendations.extend([
                "Practice with a metronome to develop consistent pacing",
                "Use strategic pauses to emphasize key points",
                "Record and time your presentations to monitor pace"
            ])
        elif model_name == "eye_contact":
            recommendations.extend([
                "Practice making eye contact with different parts of the audience",
                "Use the 'triangle' technique: look at three points in the room",
                "Avoid looking at notes or slides for extended periods"
            ])
        elif model_name == "posture_analysis":
            recommendations.extend([
                "Practice standing with shoulders back and head held high",
                "Avoid crossing arms or putting hands in pockets",
                "Use confident, open body language"
            ])
        elif model_name == "filler_detection":
            recommendations.extend([
                "Practice pausing instead of using filler words",
                "Record yourself to identify filler word patterns",
                "Use breathing techniques to reduce nervous speech patterns"
            ])
        elif model_name == "facial_emotion":
            recommendations.extend([
                "Practice expressing emotions naturally through facial expressions",
                "Record yourself and watch for emotional engagement",
                "Work on connecting emotionally with your audience through facial cues"
            ])
        
        return recommendations
    
    async def _generate_summary(self, overall_score: float, category_scores: Dict[str, Any]) -> Dict[str, Any]:
        """Generate overall summary."""
        summary = {
            "overall_performance": self._get_overall_performance_level(overall_score),
            "key_highlights": [],
            "primary_focus_areas": []
        }
        
        # Identify highlights
        for category, score_info in category_scores.items():
            if score_info["score"] >= 7.5:
                summary["key_highlights"].append(f"Strong {category} performance")
            elif score_info["score"] <= 5:
                summary["primary_focus_areas"].append(f"{category} development")
        
        return summary
    
    def _get_overall_performance_level(self, score: float) -> str:
        """Get overall performance level."""
        if score >= 8.5:
            return "Exceptional"
        elif score >= 7.5:
            return "Excellent"
        elif score >= 6.5:
            return "Good"
        elif score >= 5.5:
            return "Average"
        elif score >= 4.5:
            return "Below Average"
        else:
            return "Needs Significant Improvement"
    
    async def _generate_score_breakdown(self, individual_scores: Dict[str, Any], 
                                      category_scores: Dict[str, Any], 
                                      overall_score: float) -> Dict[str, Any]:
        """Generate detailed score breakdown."""
        breakdown = {
            "overall_score": overall_score,
            "category_breakdown": {},
            "model_breakdown": {},
            "score_distribution": {
                "excellent": 0,
                "good": 0,
                "average": 0,
                "below_average": 0,
                "poor": 0
            }
        }
        
        # Category breakdown
        for category, score_info in category_scores.items():
            breakdown["category_breakdown"][category] = {
                "score": score_info["score"],
                "weight": score_info["weight"],
                "contribution": score_info["score"] * score_info["weight"]
            }
        
        # Model breakdown
        for model_name, score_info in individual_scores.items():
            if score_info["normalized_score"] is not None:
                breakdown["model_breakdown"][model_name] = {
                    "score": score_info["normalized_score"],
                    "weight": score_info["weight"],
                    "contribution": score_info["normalized_score"] * score_info["weight"]
                }
                
                # Update score distribution
                score = score_info["normalized_score"]
                if score >= 8:
                    breakdown["score_distribution"]["excellent"] += 1
                elif score >= 6:
                    breakdown["score_distribution"]["good"] += 1
                elif score >= 5:
                    breakdown["score_distribution"]["average"] += 1
                elif score >= 4:
                    breakdown["score_distribution"]["below_average"] += 1
                else:
                    breakdown["score_distribution"]["poor"] += 1
        
        return breakdown
    
    def _get_error_result(self, error_message: str) -> Dict[str, Any]:
        """Return error result."""
        return {
            "error": error_message,
            "individual_model_scores": {},
            "category_scores": {},
            "overall_score": 5.0,
            "detailed_feedback": {
                "speech_feedback": {"overall_assessment": "Analysis unavailable"},
                "visual_feedback": {"overall_assessment": "Analysis unavailable"},
                "content_feedback": {"overall_assessment": "Analysis unavailable"},
                "strengths": [],
                "areas_for_improvement": []
            },
            "recommendations": ["Unable to generate recommendations due to analysis error"],
            "summary": {
                "overall_performance": "Analysis Unavailable",
                "key_highlights": [],
                "primary_focus_areas": []
            },
            "score_breakdown": {
                "overall_score": 5.0,
                "category_breakdown": {},
                "model_breakdown": {},
                "score_distribution": {"excellent": 0, "good": 0, "average": 0, "below_average": 0, "poor": 0}
            }
        } 