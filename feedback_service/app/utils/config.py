import os
from typing import Dict, Any

class Config:
    """Configuration management for AI models and transcription settings"""
    
    def __init__(self):
        # Transcription settings
        self.transcription_method = os.getenv("TRANSCRIPTION_METHOD", "auto")  # 'auto', 'whisper', 'wit'
        self.transcription_language = os.getenv("TRANSCRIPTION_LANGUAGE", "auto")  # 'english', 'arabic', or 'auto'
        
        # Wit.ai tokens
        self.wit_ai_token_english = os.getenv("WIT_AI_TOKEN_ENGLISH", "4VBDMJSP5MG3FUJSZMQEFQYSN5CTV4UM")
        self.wit_ai_token_arabic = os.getenv("WIT_AI_TOKEN_ARABIC", "3R5F2QD664A4VLETBF2VM3CCBNKVKP27")
        
        # Model settings
        self.use_gpu = os.getenv("USE_GPU", "false").lower() == "true"
        self.debug_mode = os.getenv("DEBUG_MODE", "false").lower() == "true"
        
        # Audio processing settings
        self.max_audio_duration = int(os.getenv("MAX_AUDIO_DURATION", "30"))  # seconds
        self.audio_sample_rate = int(os.getenv("AUDIO_SAMPLE_RATE", "16000"))
        
        # Whisper settings
        self.whisper_model_size = os.getenv("WHISPER_MODEL_SIZE", "small")  # 'tiny', 'base', 'small', 'medium', 'large'
    
    def get_transcription_config(self) -> Dict[str, Any]:
        """Get transcription configuration for models"""
        return {
            "transcription_method": self.transcription_method,
            "language": self.transcription_language
        }
    
    def get_wit_config(self) -> Dict[str, str]:
        """Get Wit.ai configuration"""
        return {
            "english_token": self.wit_ai_token_english,
            "arabic_token": self.wit_ai_token_arabic
        }
    
    def get_whisper_config(self) -> Dict[str, Any]:
        """Get Whisper configuration"""
        return {
            "model_size": self.whisper_model_size,
            "supported_languages": ["ar", "en", "auto"],
            "supported_models": ["tiny", "base", "small", "medium", "large"]
        }

# Global configuration instance
config = Config() 