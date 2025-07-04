import os
import tempfile
import logging
from typing import Optional, Dict, Any
import asyncio
from pathlib import Path

logger = logging.getLogger(__name__)

# Whisper model sizes (smaller = faster, larger = more accurate)
WHISPER_MODELS = {
    "tiny": "tiny",
    "base": "base", 
    "small": "small",
    "medium": "medium",
    "large": "large"
}

class WhisperTranscriber:
    """
    Whisper-based transcription service with support for multiple languages
    including Arabic and English
    """
    
    def __init__(self, model_size: str = "base"):
        """
        Initialize Whisper transcriber
        
        Args:
            model_size: Size of Whisper model to use ("tiny", "base", "small", "medium", "large")
        """
        self.model_size = model_size
        self.model = None
        self._model_loaded = False
        
    async def load_model(self):
        """Load Whisper model asynchronously"""
        if self._model_loaded:
            return
            
        try:
            logger.info(f"Loading Whisper model: {self.model_size}")
            
            # Import whisper in thread to avoid blocking
            loop = asyncio.get_event_loop()
            self.model = await loop.run_in_executor(None, self._load_whisper_model)
            
            self._model_loaded = True
            logger.info(f"Whisper model {self.model_size} loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise
    
    def _load_whisper_model(self):
        """Load Whisper model synchronously"""
        try:
            import whisper
            return whisper.load_model(self.model_size)
        except ImportError:
            raise ImportError("Whisper not installed. Run: pip install openai-whisper")
    
    async def transcribe(self, audio_path: str, language: str = "auto") -> Optional[str]:
        """
        Transcribe audio file using Whisper
        
        Args:
            audio_path: Path to audio file
            language: Language code ("ar" for Arabic, "en" for English, "auto" for auto-detect)
            
        Returns:
            Transcribed text or None if failed
        """
        try:
            # Ensure model is loaded
            if not self._model_loaded:
                await self.load_model()
            
            logger.info(f"Transcribing {audio_path} with Whisper (language: {language})")
            
            # Run transcription in thread pool
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, 
                self._transcribe_sync, 
                audio_path, 
                language
            )
            
            if result and "text" in result:
                transcription = result["text"].strip()
                logger.info(f"Transcription completed: {len(transcription)} characters")
                return transcription
            else:
                logger.warning("Whisper returned empty result")
                return None
                
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            return None
    
    def _transcribe_sync(self, audio_path: str, language: str) -> Optional[Dict[str, Any]]:
        """Synchronous transcription method"""
        try:
            if not os.path.exists(audio_path):
                logger.error(f"Audio file not found: {audio_path}")
                return None
            
            # Prepare transcription options
            options = {
                "task": "transcribe",
                "verbose": False,
                "fp16": False  # Disable for better compatibility
            }
            
            # Set language if specified
            if language != "auto":
                options["language"] = language
            
            # Perform transcription
            result = self.model.transcribe(audio_path, **options)
            return result
            
        except Exception as e:
            logger.error(f"Sync transcription failed: {e}")
            return None
    
    async def transcribe_with_timestamps(self, audio_path: str, language: str = "auto") -> Optional[Dict[str, Any]]:
        """
        Transcribe audio with word-level timestamps
        
        Args:
            audio_path: Path to audio file
            language: Language code
            
        Returns:
            Dictionary with transcription and timestamps
        """
        try:
            if not self._model_loaded:
                await self.load_model()
            
            logger.info(f"Transcribing with timestamps: {audio_path}")
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self._transcribe_with_timestamps_sync,
                audio_path,
                language
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Timestamp transcription failed: {e}")
            return None
    
    def _transcribe_with_timestamps_sync(self, audio_path: str, language: str) -> Optional[Dict[str, Any]]:
        """Synchronous transcription with timestamps"""
        try:
            if not os.path.exists(audio_path):
                return None
            
            options = {
                "task": "transcribe",
                "verbose": False,
                "fp16": False,
                "word_timestamps": True
            }
            
            if language != "auto":
                options["language"] = language
            
            result = self.model.transcribe(audio_path, **options)
            return result
            
        except Exception as e:
            logger.error(f"Timestamp sync transcription failed: {e}")
            return None
    
    async def detect_language(self, audio_path: str) -> Optional[str]:
        """
        Detect the language of audio file
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Language code or None if failed
        """
        try:
            if not self._model_loaded:
                await self.load_model()
            
            logger.info(f"Detecting language for: {audio_path}")
            
            loop = asyncio.get_event_loop()
            language = await loop.run_in_executor(
                None,
                self._detect_language_sync,
                audio_path
            )
            
            return language
            
        except Exception as e:
            logger.error(f"Language detection failed: {e}")
            return None
    
    def _detect_language_sync(self, audio_path: str) -> Optional[str]:
        """Synchronous language detection"""
        try:
            if not os.path.exists(audio_path):
                return None
            
            # Load audio and detect language
            result = self.model.transcribe(audio_path, task="transcribe", verbose=False)
            return result.get("language")
            
        except Exception as e:
            logger.error(f"Sync language detection failed: {e}")
            return None
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages"""
        return {
            "ar": "Arabic",
            "en": "English", 
            "fr": "French",
            "de": "German",
            "es": "Spanish",
            "it": "Italian",
            "pt": "Portuguese",
            "ru": "Russian",
            "ja": "Japanese",
            "ko": "Korean",
            "zh": "Chinese",
            "auto": "Auto-detect"
        }
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        return {
            "model_size": self.model_size,
            "model_loaded": self._model_loaded,
            "supported_languages": self.get_supported_languages()
        }


# Global Whisper transcriber instance - will be properly configured in main.py
whisper_transcriber = None


def transcribe_with_whisper(audio_path: str, language: str = "auto") -> Optional[str]:
    """
    Convenience function for transcribing with Whisper
    
    Args:
        audio_path: Path to audio file
        language: Language code ("ar", "en", "auto", etc.)
        
    Returns:
        Transcribed text or None if failed
    """
    try:
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                whisper_transcriber.transcribe(audio_path, language)
            )
            return result
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        return None


def detect_language_with_whisper(audio_path: str) -> Optional[str]:
    """
    Convenience function for language detection
    
    Args:
        audio_path: Path to audio file
        
    Returns:
        Language code or None if failed
    """
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                whisper_transcriber.detect_language(audio_path)
            )
            return result
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Language detection failed: {e}")
        return None 