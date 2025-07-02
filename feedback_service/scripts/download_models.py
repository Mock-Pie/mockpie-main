#!/usr/bin/env python3
"""
Model Pre-download Script for Docker Build
Downloads all required models to cache them in the Docker image
"""

import os
import logging
import sys
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Set cache directories
os.environ['HF_HOME'] = '/app/.cache/huggingface'
os.environ['TRANSFORMERS_CACHE'] = '/app/.cache/huggingface/transformers'
os.environ['HF_DATASETS_CACHE'] = '/app/.cache/huggingface/datasets'
os.environ['SENTENCE_TRANSFORMERS_HOME'] = '/app/.cache/sentence_transformers'
os.environ['TORCH_HOME'] = '/app/.cache/torch'

def download_transformers_models():
    """Download HuggingFace transformers models"""
    logger.info("Downloading HuggingFace transformers models...")
    
    models = [
        "HareemFatima/distilhubert-finetuned-stutterdetection",
        "facebook/wav2vec2-large-xlsr-53", 
        "superb/wav2vec2-base-superb-er",
        "j-hartmann/emotion-english-distilroberta-base"
    ]
    
    try:
        from transformers import AutoFeatureExtractor, AutoModelForAudioClassification, pipeline
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        
        for model_name in models:
            try:
                logger.info(f"Downloading model: {model_name}")
                
                # Try downloading as audio classification model first
                try:
                    feature_extractor = AutoFeatureExtractor.from_pretrained(
                        model_name, 
                        cache_dir=os.environ['TRANSFORMERS_CACHE']
                    )
                    model = AutoModelForAudioClassification.from_pretrained(
                        model_name, 
                        cache_dir=os.environ['TRANSFORMERS_CACHE']
                    )
                    logger.info(f"✓ Downloaded audio model: {model_name}")
                    continue
                except:
                    pass
                
                # Try as text classification model
                try:
                    tokenizer = AutoTokenizer.from_pretrained(
                        model_name, 
                        cache_dir=os.environ['TRANSFORMERS_CACHE']
                    )
                    model = AutoModelForSequenceClassification.from_pretrained(
                        model_name, 
                        cache_dir=os.environ['TRANSFORMERS_CACHE']
                    )
                    logger.info(f"✓ Downloaded text model: {model_name}")
                    continue
                except:
                    pass
                
                # Try with pipeline
                try:
                    if "stutter" in model_name.lower():
                        pipe = pipeline("audio-classification", model=model_name, 
                                      cache_dir=os.environ['TRANSFORMERS_CACHE'])
                    else:
                        pipe = pipeline("text-classification", model=model_name,
                                      cache_dir=os.environ['TRANSFORMERS_CACHE'])
                    logger.info(f"✓ Downloaded pipeline model: {model_name}")
                except Exception as e:
                    logger.warning(f"✗ Failed to download {model_name}: {e}")
                    
            except Exception as e:
                logger.error(f"✗ Error downloading {model_name}: {e}")
                continue
                
    except ImportError as e:
        logger.error(f"Failed to import transformers: {e}")
        return False
    
    return True

def download_sentence_transformers():
    """Download sentence transformer models"""
    logger.info("Downloading sentence transformer models...")
    
    models = [
        "all-MiniLM-L6-v2",
        "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    ]
    
    try:
        from sentence_transformers import SentenceTransformer
        
        for model_name in models:
            try:
                logger.info(f"Downloading sentence transformer: {model_name}")
                model = SentenceTransformer(
                    model_name, 
                    cache_folder=os.environ['SENTENCE_TRANSFORMERS_HOME']
                )
                logger.info(f"✓ Downloaded: {model_name}")
            except Exception as e:
                logger.error(f"✗ Error downloading {model_name}: {e}")
                continue
                
    except ImportError as e:
        logger.error(f"Failed to import sentence_transformers: {e}")
        return False
    
    return True

def download_other_models():
    """Download other models (KeyBERT, etc.)"""
    logger.info("Downloading other models...")
    
    try:
        # Download KeyBERT (uses sentence transformers internally)
        from keybert import KeyBERT
        keybert = KeyBERT()
        logger.info("✓ Downloaded KeyBERT model")
    except Exception as e:
        logger.warning(f"✗ Failed to download KeyBERT: {e}")
    
    return True

def verify_downloads():
    """Verify that models were downloaded successfully"""
    logger.info("Verifying model downloads...")
    
    cache_dirs = [
        '/app/.cache/huggingface/transformers',
        '/app/.cache/sentence_transformers',
        '/app/.cache/torch'
    ]
    
    total_size = 0
    for cache_dir in cache_dirs:
        if Path(cache_dir).exists():
            size = sum(f.stat().st_size for f in Path(cache_dir).rglob('*') if f.is_file())
            total_size += size
            logger.info(f"Cache directory {cache_dir}: {size / (1024*1024):.1f} MB")
    
    logger.info(f"Total cache size: {total_size / (1024*1024):.1f} MB")
    
    if total_size > 10 * 1024 * 1024:  # More than 10 MB
        logger.info("✓ Models appear to be downloaded successfully")
        return True
    else:
        logger.warning("✗ Cache size seems too small, downloads may have failed")
        return False

def main():
    """Main function to download all models"""
    logger.info("Starting model pre-download process...")
    
    # Create cache directories
    os.makedirs('/app/.cache/huggingface/transformers', exist_ok=True)
    os.makedirs('/app/.cache/sentence_transformers', exist_ok=True)
    os.makedirs('/app/.cache/torch', exist_ok=True)
    
    success = True
    
    # Download models
    success &= download_transformers_models()
    success &= download_sentence_transformers()
    success &= download_other_models()
    
    # Verify downloads
    success &= verify_downloads()
    
    if success:
        logger.info("✓ Model pre-download completed successfully!")
        sys.exit(0)
    else:
        logger.error("✗ Some models failed to download")
        sys.exit(1)

if __name__ == "__main__":
    main() 