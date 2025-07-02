import numpy as np
import asyncio
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class CompositeScorer:
    """Composite scoring system with weighted model contributions"""
    
    def __init__(self):
        # Enhanced weights for presentation analysis with improved models
        # Weights optimized for comprehensive presentation evaluation
        self.model_weights = {
            # Core Speech Analysis (35% total - most important for presentations)
            "speech_emotion": 0.12,      # Enhanced emotional analysis with confidence detection
            "wpm_analysis": 0.08,        # Speaking pace and rhythm 
            "pitch_analysis": 0.08,      # Vocal variety and control
            "volume_consistency": 0.07,  # Audio stability and projection
            
            # Speech Quality & Fluency (20% total)
            "filler_detection": 0.08,    # Professional speech quality
            "stutter_detection": 0.07,   # Speech fluency
            "lexical_richness": 0.05,    # Vocabulary sophistication
            
            # Visual Presence & Engagement (35% total)
            "eye_contact": 0.13,         # Enhanced audience engagement analysis
            "hand_gesture": 0.08,        # Enhanced gesture effectiveness analysis
            "posture_analysis": 0.09,    # Professional posture and body language
            "facial_emotion": 0.05,      # Facial expression analysis
            
            # Content & Context (10% total)
            "keyword_relevance": 0.05,   # Content relevance and focus
            "confidence_detector": 0.05, # Overall confidence assessment
            
            # Legacy/fallback weights
            "default": 0.03
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
        if abs(total_weight - 1.0) > 0.01:
            logger.warning(f"Model weights sum to {total_weight}, not 1.0. Normalizing...")
            # Normalize weights
            for key in self.model_weights:
                self.model_weights[key] /= total_weight
    
    async def calculate_score(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate weighted composite score with maximum safety"""
        try:
            logger.info(f"Composite scorer received: {type(analysis_results)}")
            
            if not isinstance(analysis_results, dict):
                logger.error(f"Invalid input type: {type(analysis_results)}")
                return self._get_default_score("Invalid input")
            
            logger.info(f"Analysis results keys: {list(analysis_results.keys())}")
            
            # Extract scores with weights
            weighted_scores = []
            component_info = {}
            total_weight_used = 0.0
            
            for key, value in analysis_results.items():
                try:
                    logger.info(f"Processing component: {key}, type: {type(value)}")
                    
                    if not isinstance(value, dict):
                        logger.warning(f"Skipping {key}: not a dictionary")
                        continue
                    
                    if "error" in value:
                        logger.warning(f"Skipping {key}: contains error")
                        component_info[key] = {"status": "error", "weight": 0.0}
                        continue
                    
                    # Look for common score fields
                    score = None
                    score_fields = ["overall_score", "score", "confidence_score", "attention_score", 
                                  "engagement_score", "fluency_score", "consistency_score"]
                    
                    for field in score_fields:
                        if field in value:
                            try:
                                score = float(value[field])
                                break
                            except (ValueError, TypeError):
                                continue
                    
                    if score is not None:
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
                        component_info[key] = {"status": "no_score", "weight": 0.0}
                        
                except Exception as e:
                    logger.error(f"Error processing {key}: {e}")
                    component_info[key] = {"status": f"error: {str(e)}", "weight": 0.0}
            
            # Calculate weighted overall score
            if weighted_scores and total_weight_used > 0:
                weighted_sum = sum(score * weight for score, weight in weighted_scores)
                overall_score = weighted_sum / total_weight_used
                logger.info(f"Calculated weighted overall score: {overall_score} from {len(weighted_scores)} components")
            else:
                overall_score = 5.0
                logger.warning("No scores extracted, using default")
            
            # Calculate category-specific scores
            speech_models = ["speech_emotion", "wpm_analysis", "pitch_analysis", "volume_consistency", 
                           "filler_detection", "stutter_detection", "lexical_richness"]
            visual_models = ["facial_emotion", "eye_contact", "hand_gesture", "posture_analysis"]
            content_models = ["keyword_relevance"]
            
            speech_score = self._calculate_category_score(component_info, speech_models)
            visual_score = self._calculate_category_score(component_info, visual_models)
            content_score = self._calculate_category_score(component_info, content_models)
            
            result = {
                "composite_score": {
                    "engagement": float(visual_score),      # Visual engagement
                    "confidence": float(speech_score),      # Speech confidence
                    "professionalism": float(overall_score), # Overall professionalism
                    "overall": float(overall_score)
                },
                "engagement_score": float(visual_score),
                "confidence_score": float(speech_score),
                "professionalism_score": float(overall_score),
                "component_info": component_info,
                "scores_used": len(weighted_scores),
                "total_weight_used": total_weight_used,
                "category_scores": {
                    "speech": speech_score,
                    "visual": visual_score,
                    "content": content_score
                },
                "overall_assessment": self._generate_assessment(overall_score)
            }
            
            logger.info("Composite score calculation completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Error in composite scorer: {e}")
            import traceback
            logger.error(f"Composite scorer traceback: {traceback.format_exc()}")
            return self._get_default_score(f"Calculation error: {str(e)}")
    
    def _calculate_category_score(self, component_info: Dict[str, Any], model_names: list) -> float:
        """Calculate weighted score for a specific category of models"""
        try:
            category_scores = []
            category_weights = []
            
            for model_name in model_names:
                if model_name in component_info:
                    info = component_info[model_name]
                    if isinstance(info, dict) and "score" in info and "weight" in info:
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