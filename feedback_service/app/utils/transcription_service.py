import os
import asyncio
import logging
from typing import Optional, Dict, Any
from pathlib import Path
import tempfile

logger = logging.getLogger(__name__)

class TranscriptionService:
    """
    Centralized transcription service that handles audio transcription once
    and provides the result to all models that need it.
    """
    
    def __init__(self, whisper_transcriber=None):
        self._transcription_cache = {}  # Cache transcriptions by audio path
        self._transcription_config = {
            "method": "wit",
            "language": "english"
        }
        self._whisper_transcriber = whisper_transcriber
    
    def set_config(self, method: str = "wit", language: str = "english"):
        """Set transcription configuration"""
        self._transcription_config = {
            "method": method,
            "language": language
        }
        logger.info(f"Transcription service configured: method={method}, language={language}")
    
    async def get_transcription(self, audio_path: str, language: str, force_refresh: bool = False) -> Optional[str]:
        """
        Get transcription for audio file, always perform a fresh transcription (no cache)
        """
        try:
            # Always perform transcription (no cache)
            logger.info(f"Transcribing audio: {audio_path} (lang: {language}) [no cache]")
            transcription = await self._perform_transcription(audio_path, language)
            return transcription
        except Exception as e:
            logger.error(f"Error getting transcription for {audio_path}: {e}")
            return None
    
    async def _perform_transcription(self, audio_path: str, language: str) -> Optional[str]:
        """Perform the actual transcription with automatic language-based routing"""
        print("--------------------------------")
        print(f"Performing transcription for {audio_path} with language: {language}")
        try:
            # Route to appropriate transcription service based on language
            if language.lower() in ["arabic", "ar"]:
                logger.info("Using Wit.ai for Arabic transcription")
                return await self._transcribe_with_wit(audio_path, language)
            else:
                logger.info("Using Whisper for English/other language transcription")
                return await self._transcribe_with_whisper(audio_path, language)
                
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            # Fallback to configured method
            if self._transcription_config["method"] == "wit":
                return await self._transcribe_with_wit(audio_path, language)
            elif self._transcription_config["method"] == "whisper":
                return await self._transcribe_with_whisper(audio_path, language)
            else:
                logger.warning(f"Unknown transcription method: {self._transcription_config['method']}")
                return None
    
    async def _transcribe_with_wit(self, audio_path: str, language: str = "arabic") -> Optional[str]:
        """Transcribe using Wit.ai"""
        try:
            from app.utils.wit_transcriber import transcribe_with_wit
            
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            transcription = await loop.run_in_executor(
                None, 
                transcribe_with_wit, 
                audio_path, 
                language
            )
            
            return transcription
            
        except Exception as e:
            logger.error(f"Wit.ai transcription failed: {e}")
            return None
    
    async def _transcribe_with_whisper(self, audio_path: str, language: str = "english") -> Optional[str]:
        """Transcribe using Whisper"""
        try:
            # Use the configured Whisper transcriber if available
            if self._whisper_transcriber:
                whisper_transcriber = self._whisper_transcriber
                logger.info(f"Using configured Whisper transcriber with model: {whisper_transcriber.model_size}")
            else:
                # Fallback to creating a new instance with current config
                from app.utils.whisper_transcriber import WhisperTranscriber
                from app.utils.config import config
                whisper_config = config.get_whisper_config()
                whisper_transcriber = WhisperTranscriber(whisper_config["model_size"])
                await whisper_transcriber.load_model()
                logger.info(f"Created new Whisper transcriber with model: {whisper_config['model_size']}")
            
            # Map language codes
            language_map = {
                "english": "en",
                "arabic": "ar",
                "auto": "auto"
            }
            
            whisper_language = language_map.get(language.lower(), "en")
            
            # Use Whisper transcriber
            transcription = await whisper_transcriber.transcribe(
                audio_path, 
                whisper_language
            )
            
            return transcription
            
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            # Fallback to Wit.ai if Whisper fails
            logger.info("Falling back to Wit.ai transcription")
            return await self._transcribe_with_wit(audio_path, language)
    
    async def _detect_language_with_whisper(self, audio_path: str) -> str:
        """Detect language using Whisper"""
        try:
            if self._whisper_transcriber:
                language = await self._whisper_transcriber.detect_language(audio_path)
                return language or "english"  # Default to English if detection fails
            else:
                # Fallback: create a temporary Whisper instance for detection
                from app.utils.whisper_transcriber import WhisperTranscriber
                from app.utils.config import config
                whisper_config = config.get_whisper_config()
                temp_whisper = WhisperTranscriber(whisper_config["model_size"])
                await temp_whisper.load_model()
                language = await temp_whisper.detect_language(audio_path)
                return language or "english"
        except Exception as e:
            logger.error(f"Language detection failed: {e}")
            return "english"  # Default to English
    
    def get_cached_transcription(self, audio_path: str) -> Optional[str]:
        """Get cached transcription without performing new transcription"""
        return self._transcription_cache.get(audio_path)
    
    def clear_cache(self, audio_path: Optional[str] = None):
        """Clear transcription cache"""
        if audio_path:
            if audio_path in self._transcription_cache:
                del self._transcription_cache[audio_path]
                logger.info(f"Cleared cache for: {audio_path}")
        else:
            self._transcription_cache.clear()
            logger.info("Cleared all transcription cache")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "cached_transcriptions": len(self._transcription_cache),
            "cache_keys": list(self._transcription_cache.keys()),
            "config": self._transcription_config
        }
    
    async def batch_transcribe(self, audio_paths: list, language: str) -> Dict[str, Optional[str]]:
        """
        Transcribe multiple audio files in batch
        
        Args:
            audio_paths: List of audio file paths
            
        Returns:
            Dictionary mapping audio paths to transcriptions
        """
        results = {}
        
        for audio_path in audio_paths:
            try:
                print(f"Transcribing audio: {audio_path} with language: {language}")
                transcription = await self.get_transcription(audio_path, language)
                results[audio_path] = transcription
            except Exception as e:
                logger.error(f"Batch transcription failed for {audio_path}: {e}")
                results[audio_path] = None
        
        return results


# Global transcription service instance
transcription_service = TranscriptionService() 