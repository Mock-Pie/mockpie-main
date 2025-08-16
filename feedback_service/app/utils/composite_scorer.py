import numpy as np
import asyncio
import logging
from typing import Dict, Any
import math

logger = logging.getLogger(__name__)

class CompositeScorer:
    """Composite scoring system with weighted model contributions"""
    
    def __init__(self):
        # Enhanced weights for presentation analysis with improved models
        # Weights optimized for comprehensive presentation evaluation
        
        # Individual model weights - Fixed to sum to 1.0
        self.model_weights = {
            "speech_emotion": 0.10,
            "wpm_analysis": 0.08,
            "pitch_analysis": 0.08,
            "volume_consistency": 0.07,
            "filler_detection": 0.07,
            "stutter_detection": 0.10,
            "lexical_richness": 0.07,
            "facial_emotion": 0.10,
            "eye_contact": 0.12,
            "hand_gesture": 0.06,
            "posture_analysis": 0.12,
            "keyword_relevance": 0.05,
            "confidence_detector": 0.15,
            "default": 0.05
        }
        
        # Enhanced scoring categories with presentation-specific focus
        self.scoring_categories = {
            "delivery": {
                "models": ["speech_emotion", "pitch_analysis", "volume_consistency", "confidence_detector"],
                "weight": 0.40,
                "description": "Vocal delivery and confidence"
            },
            "engagement": {
                "models": ["eye_contact", "hand_gesture", "facial_emotion"],
                "weight": 0.35,
                "description": "Audience engagement and visual presence"
            },
            "professionalism": {
                "models": ["filler_detection", "stutter_detection", "posture_analysis", "lexical_richness"],
                "weight": 0.20,
                "description": "Professional presentation skills"
            },
            "content": {
                "models": ["keyword_relevance", "wpm_analysis"],
                "weight": 0.05,
                "description": "Content delivery and pacing"
            }
        }
        
        # Validate weights sum to approximately 1.0
        total_weight = sum(self.model_weights.values())
        if abs(total_weight - 1.0) > 0.001:
            logger.warning(f"Model weights sum to {total_weight}, not 1.0. Normalizing...")
            # Normalize weights
            for key in self.model_weights:
                self.model_weights[key] /= total_weight
    
    async def calculate_score(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate comprehensive weighted score from all available models."""
        try:
            logger.info("Starting composite score calculation...")
            
            weighted_scores = []
            total_weight_used = 0.0
            component_info = {}
            
            for key, result in analysis_results.items():
                try:
                    if not isinstance(result, dict) or "error" in result:
                        logger.warning(f"Skipping {key} due to error or invalid format")
                        component_info[key] = {"status": "error", "weight": 0.0}
                        continue
                    
                    # Extract score using enhanced logic
                    score = self._extract_score_enhanced(key, result)
                    
                    if score is not None and score != -1.0:
                        # Normalize to 0-10 range
                        if score > 1.0:  # Already in 0-10 range
                            normalized_score = max(0, min(10, score))
                        else:  # In 0-1 range, scale to 0-10
                            normalized_score = score * 10
                        
                        # Get weight for this model
                        weight = self.model_weights.get(key, self.model_weights.get("default", 0.05))
                        
                        weighted_scores.append((normalized_score, weight))
                        total_weight_used += weight
                        component_info[key] = {
                            "score": normalized_score,
                            "weight": weight,
                            "weighted_contribution": normalized_score * weight
                        }
                        logger.info(f"Extracted score {normalized_score} with weight {weight} from {key}")
                    else:
                        logger.warning(f"No valid score found in {key}")
                        component_info[key] = {"status": "no_score", "weight": 0.0, "score": -1.0}
                        
                except Exception as e:
                    logger.error(f"Error processing {key}: {e}")
                    component_info[key] = {"status": f"error: {str(e)}", "weight": 0.0, "score": -1.0}
            
            # Calculate weighted overall score
            if weighted_scores and total_weight_used > 0:
                weighted_sum = sum(score * weight for score, weight in weighted_scores)
                overall_score = weighted_sum / total_weight_used
                logger.info(f"Calculated weighted overall score: {overall_score} from {len(weighted_scores)} components")
            else:
                overall_score = 5.0
                logger.warning("No scores extracted, using default")
            
            # Calculate category scores
            category_scores = {}
            for category_name, category_config in self.scoring_categories.items():
                category_score = self._calculate_category_score(component_info, category_config["models"])
                category_scores[category_name] = {
                    "score": category_score,
                    "description": category_config["description"],
                    "weight": category_config["weight"]
                }
            
            return {
                "overall_score": round(overall_score, 2),
                "category_scores": category_scores,
                "component_breakdown": component_info,
                "total_components": len(analysis_results),
                "valid_components": len(weighted_scores),
                "total_weight_used": round(total_weight_used, 3)
            }
            
        except Exception as e:
            logger.error(f"Error in composite scorer: {e}")
            import traceback
            logger.error(f"Composite scorer traceback: {traceback.format_exc()}")
            return self._get_default_score(f"Calculation error: {str(e)}")
    
    def _extract_score_enhanced(self, model_name: str, result: Dict[str, Any]) -> float:
        """Enhanced score extraction with better field mapping."""
        try:
            # Model-specific score field mappings
            score_mappings = {
                "speech_emotion": ["emotional_intensity", "overall_score"],
                "wpm_analysis": ["overall_score", "pace_consistency.score"],
                "pitch_analysis": ["pitch_variety", "overall_score"],
                "volume_consistency": ["consistency_score", "overall_score"],
                "filler_detection": ["filler_frequency_score", "overall_score"],
                "stutter_detection": ["fluency_score", "overall_score"],
                "lexical_richness": ["lexical_diversity", "overall_score"],
                "facial_emotion": ["engagement_metrics.engagement_score", "overall_score"],
                "eye_contact": ["attention_score", "overall_score"],
                "hand_gesture": ["overall_score", "gesture_effectiveness"],
                "posture_analysis": ["posture_score", "overall_score"],
                "keyword_relevance": ["overall_score", "relevance_score"],
                "confidence_detector": ["overall_confidence_score", "overall_score"]
            }
            
            fields_to_try = score_mappings.get(model_name, ["overall_score", "score"])
            
            for field in fields_to_try:
                score = self._extract_nested_field(result, field)
                if score is not None and score != -1.0:
                    return score
            
            return -1.0
            
        except Exception as e:
            logger.error(f"Error extracting score from {model_name}: {e}")
            return -1.0
    
    def _extract_nested_field(self, data: Dict[str, Any], field_path: str) -> float:
        """Extract value from nested field path like 'engagement_metrics.engagement_score'."""
        try:
            if "." in field_path:
                parts = field_path.split(".")
                current = data
                for part in parts:
                    if isinstance(current, dict) and part in current:
                        current = current[part]
                    else:
                        return -1.0
                value = current
            else:
                value = data.get(field_path)
            
            if value is None:
                return -1.0
            
            score = float(value)
            # Validate score is not NaN or infinite
            if math.isnan(score) or math.isinf(score):
                return -1.0
            
            return score
            
        except (ValueError, TypeError, KeyError):
            return -1.0
    
    def _calculate_category_score(self, component_info: Dict[str, Any], model_names: list) -> float:
        """Calculate weighted score for a specific category of models"""
        try:
            category_scores = []
            category_weights = []
            
            for model_name in model_names:
                if model_name in component_info:
                    info = component_info[model_name]
                    if isinstance(info, dict) and "score" in info and "weight" in info:
                        # Only include valid scores (not -1.0)
                        if info["score"] != -1.0:
                            category_scores.append(info["score"])
                            category_weights.append(info["weight"])
            
            if category_scores and sum(category_weights) > 0:
                weighted_sum = sum(score * weight for score, weight in zip(category_scores, category_weights))
                return weighted_sum / sum(category_weights)
            else:
                return 5.0  # Default score if no models in category
        except Exception as e:
            logger.error(f"Error calculating category score: {e}")
            return 5.0
    
    def _get_default_score(self, reason: str = "Unknown error") -> Dict[str, Any]:
        """Return safe default score"""
        return {
            "composite_score": {
                "engagement": 5.0,
                "confidence": 5.0,
                "professionalism": 5.0,
                "overall": 5.0
            },
            "engagement_score": 5.0,
            "confidence_score": 5.0,
            "professionalism_score": 5.0,
            "error": reason,
            "category_scores": {
                "speech": 5.0,
                "visual": 5.0,
                "content": 5.0
            },
            "overall_assessment": "Analysis incomplete due to technical issues"
        }
    
    def _generate_assessment(self, score: float) -> str:
        """Generate assessment text"""
        try:
            if score >= 8.0:
                return "Excellent presentation skills"
            elif score >= 6.5:
                return "Good presentation skills"
            elif score >= 5.0:
                return "Average presentation skills"
            else:
                return "Needs improvement"
        except:
            return "Assessment unavailable"