"""
Lazy loading utility for ML models to reduce memory usage and startup time
"""

import os
import logging
from typing import Dict, Any, Optional
from functools import lru_cache

logger = logging.getLogger(__name__)

class LazyModelLoader:
    """Lazy loading manager for ML models"""
    
    def __init__(self):
        self._models = {}
        self._cache_dir = os.environ.get("TRANSFORMERS_CACHE", "/app/.cache/huggingface")
        self._lazy_loading = os.environ.get("LAZY_LOAD_MODELS", "true").lower() == "true"
    
    def get_model(self, model_name: str, model_type: str = "transformers") -> Any:
        """Get a model, loading it lazily if not already loaded"""
        cache_key = f"{model_type}_{model_name}"
        
        if cache_key not in self._models:
            if self._lazy_loading:
                logger.info(f"Lazy loading model: {model_name}")
                self._models[cache_key] = self._load_model(model_name, model_type)
            else:
                logger.info(f"Loading model immediately: {model_name}")
                self._models[cache_key] = self._load_model(model_name, model_type)
        
        return self._models[cache_key]
    
    def _load_model(self, model_name: str, model_type: str) -> Any:
        """Load a specific model"""
        try:
            if model_type == "transformers":
                return self._load_transformers_model(model_name)
            elif model_type == "sentence_transformers":
                return self._load_sentence_transformer(model_name)
            else:
                raise ValueError(f"Unknown model type: {model_type}")
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {e}")
            return None
    
    def _load_transformers_model(self, model_name: str) -> Any:
        """Load a transformers model"""
        from transformers import pipeline, AutoFeatureExtractor, AutoModelForAudioClassification
        
        # Determine model type based on name
        if "stutter" in model_name.lower():
            return pipeline("audio-classification", model_name, cache_dir=self._cache_dir)
        elif "wav2vec" in model_name.lower() or "emotion" in model_name.lower():
            feature_extractor = AutoFeatureExtractor.from_pretrained(model_name, cache_dir=self._cache_dir)
            model = AutoModelForAudioClassification.from_pretrained(model_name, cache_dir=self._cache_dir)
            return {"feature_extractor": feature_extractor, "model": model}
        else:
            # Default to pipeline
            return pipeline("text-generation", model_name, cache_dir=self._cache_dir)
    
    def _load_sentence_transformer(self, model_name: str) -> Any:
        """Load a sentence transformer model"""
        from sentence_transformers import SentenceTransformer
        return SentenceTransformer(model_name, cache_folder=self._cache_dir)
    
    def preload_essential_models(self):
        """Preload essential models that are commonly used"""
        if not self._lazy_loading:
            logger.info("Preloading essential models...")
            essential_models = [
                ("HareemFatima/distilhubert-finetuned-stutterdetection", "transformers"),
                ("sentence-transformers/all-MiniLM-L6-v2", "sentence_transformers"),
            ]
            
            for model_name, model_type in essential_models:
                try:
                    self.get_model(model_name, model_type)
                    logger.info(f"Preloaded: {model_name}")
                except Exception as e:
                    logger.warning(f"Failed to preload {model_name}: {e}")
    
    def clear_cache(self):
        """Clear model cache to free memory"""
        self._models.clear()
        logger.info("Model cache cleared")

# Global lazy loader instance
lazy_loader = LazyModelLoader() 