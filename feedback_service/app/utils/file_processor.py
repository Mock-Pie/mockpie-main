import aiofiles
import os
import tempfile
import shutil
import logging
from pathlib import Path
from typing import Tuple, Optional
from fastapi import UploadFile
import subprocess

logger = logging.getLogger(__name__)

class FileProcessor:
    """
    File processing utilities for handling uploaded files
    and extracting audio/video components
    """
    
    def __init__(self):
        self.temp_dir = Path("temp")
        self.temp_dir.mkdir(exist_ok=True)
        
        # Supported file formats
        self.video_formats = {'.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.3gp'}
        self.audio_formats = {'.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma', '.opus'}
        
    async def save_uploaded_file(self, upload_file: UploadFile) -> str:
        """
        Save uploaded file to temporary directory
        
        Args:
            upload_file: FastAPI UploadFile object
            
        Returns:
            Path to saved file
        """
        try:
            # Generate unique filename
            file_extension = Path(upload_file.filename).suffix.lower()
            temp_filename = f"upload_{hash(upload_file.filename)}_{upload_file.filename}"
            temp_path = self.temp_dir / temp_filename
            
            # Save file
            async with aiofiles.open(temp_path, 'wb') as temp_file:
                content = await upload_file.read()
                await temp_file.write(content)
            
            logger.info(f"File saved: {temp_path}")
            return str(temp_path)
            
        except Exception as e:
            logger.error(f"Error saving uploaded file: {e}")
            raise Exception(f"Failed to save uploaded file: {e}")
    
    async def extract_components(self, file_path: str) -> Tuple[Optional[str], Optional[str], bool]:
        """
        Extract audio and video components from uploaded file
        
        Args:
            file_path: Path to the uploaded file
            
        Returns:
            Tuple of (audio_path, video_path, has_video)
        """
        try:
            file_extension = Path(file_path).suffix.lower()
            base_name = Path(file_path).stem
            
            # Check if file is video or audio
            if file_extension in self.video_formats:
                # Extract audio from video
                audio_path = await self._extract_audio_from_video(file_path)
                return audio_path, file_path, True
                
            elif file_extension in self.audio_formats:
                # Audio file - no video component
                return file_path, None, False
                
            else:
                supported_formats = list(self.video_formats | self.audio_formats)
                raise Exception(f"Unsupported file format: {file_extension}. Supported formats: {', '.join(supported_formats)}")
                
        except Exception as e:
            logger.error(f"Error extracting components: {e}")
            raise Exception(f"Failed to extract file components: {e}")
    
    async def _extract_audio_from_video(self, video_path: str) -> str:
        """
        Extract audio track from video file using FFmpeg
        
        Args:
            video_path: Path to video file
            
        Returns:
            Path to extracted audio file
        """
        try:
            base_name = Path(video_path).stem
            audio_path = self.temp_dir / f"{base_name}_audio.wav"
            
            # Check if FFmpeg is available
            if not await self._check_ffmpeg():
                logger.warning("FFmpeg not available, attempting fallback audio extraction")
                return await self._fallback_audio_extraction(video_path)
            
            # Use FFmpeg to extract audio
            cmd = [
                'ffmpeg', '-i', video_path,
                '-vn',  # No video
                '-acodec', 'pcm_s16le',  # PCM 16-bit
                '-ar', '22050',  # Sample rate
                '-ac', '1',  # Mono
                '-y',  # Overwrite output
                str(audio_path)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"FFmpeg error: {result.stderr}")
                return await self._fallback_audio_extraction(video_path)
            
            logger.info(f"Audio extracted: {audio_path}")
            return str(audio_path)
            
        except Exception as e:
            logger.error(f"Error extracting audio: {e}")
            return await self._fallback_audio_extraction(video_path)
    
    async def _check_ffmpeg(self) -> bool:
        """Check if FFmpeg is available"""
        try:
            result = subprocess.run(['ffmpeg', '-version'], capture_output=True)
            return result.returncode == 0
        except Exception:
            return False
    
    async def _fallback_audio_extraction(self, video_path: str) -> str:
        """
        Fallback audio extraction without FFmpeg
        This is a placeholder - in practice, you might use other tools
        """
        try:
            # For now, just return the original file path
            # In a real implementation, you might use moviepy or other libraries
            logger.warning("Using fallback audio extraction (returning original file)")
            return video_path
            
        except Exception as e:
            logger.error(f"Error in fallback audio extraction: {e}")
            raise Exception(f"Audio extraction failed: {e}")
    
    async def cleanup_temp_files(self, file_paths: list) -> None:
        """
        Clean up temporary files
        
        Args:
            file_paths: List of file paths to delete
        """
        try:
            for file_path in file_paths:
                if file_path and os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                        logger.info(f"Cleaned up: {file_path}")
                    except Exception as e:
                        logger.warning(f"Could not delete {file_path}: {e}")
                        
        except Exception as e:
            logger.error(f"Error in cleanup: {e}")
    
    def get_file_info(self, file_path: str) -> dict:
        """
        Get basic file information
        
        Args:
            file_path: Path to file
            
        Returns:
            Dictionary containing file information
        """
        try:
            path = Path(file_path)
            stat = path.stat()
            
            return {
                "filename": path.name,
                "size_bytes": stat.st_size,
                "size_mb": round(stat.st_size / (1024 * 1024), 2),
                "extension": path.suffix.lower(),
                "is_video": path.suffix.lower() in self.video_formats,
                "is_audio": path.suffix.lower() in self.audio_formats
            }
            
        except Exception as e:
            logger.error(f"Error getting file info: {e}")
            return {
                "filename": "unknown",
                "size_bytes": 0,
                "extension": "",
                "is_video": False,
                "is_audio": False
            }
