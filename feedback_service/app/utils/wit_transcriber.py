import os
from typing import Optional, List
import tempfile
from pydub import AudioSegment
from wit import Wit

WIT_AI_TOKEN_ENGLISH = "4VBDMJSP5MG3FUJSZMQEFQYSN5CTV4UM"
WIT_AI_TOKEN_ARABIC = "3R5F2QD664A4VLETBF2VM3CCBNKVKP27"

# Configurable limits - you can adjust these values
MAX_AUDIO_DURATION_SECONDS = 300  # 5 minutes (increased from 30 seconds)
MAX_FILE_SIZE_MB = 50  # 50MB file size limit
SEGMENT_DURATION_SECONDS = 18  # 18 seconds per segment


def convert_audio_for_wit(audio_path: str) -> str:
    """Convert audio to Wit.ai compatible format (16kHz, 16-bit, mono WAV) with size optimization"""
    try:
        print(f"Converting audio: {audio_path}")
        
        # Load audio file
        audio = AudioSegment.from_file(audio_path)
        
        # Get original duration
        original_duration = len(audio) / 1000.0
        print(f"Original duration: {original_duration:.2f} seconds")
        
        # Limit audio to 30 seconds to avoid timeouts
        max_duration = 30000  # 30 seconds in milliseconds
        if len(audio) > max_duration:
            audio = audio[:max_duration]
            print(f"Truncated to 30 seconds to avoid timeout")
        
        # Convert to mono if stereo
        if audio.channels > 1:
            audio = audio.set_channels(1)
            print("Converted to mono")
        
        # Set sample rate to 16kHz
        if audio.frame_rate != 16000:
            audio = audio.set_frame_rate(16000)
            print(f"Set sample rate to 16kHz")
        
        # Set bit depth to 16-bit
        audio = audio.set_sample_width(2)
        print("Set bit depth to 16-bit")
        
        # Normalize audio volume to improve recognition
        audio = audio.normalize()
        print("Normalized audio volume")
        
        # Create temp file for converted audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            converted_path = tmp.name
        
        # Export as WAV with compression
        audio.export(converted_path, format="wav", parameters=["-q:a", "0"])
        print(f"Audio converted and saved to: {converted_path}")
        
        # Check final file size
        final_size = os.path.getsize(converted_path)
        print(f"Final file size: {final_size} bytes")
        
        return converted_path
        
    except Exception as e:
        print(f"ERROR: Audio conversion failed: {e}")
        return audio_path  # Return original if conversion fails


def split_audio_into_segments(audio_path: str, segment_duration: int = SEGMENT_DURATION_SECONDS) -> List[str]:
    """
    Split audio file into segments of specified duration
    
    Args:
        audio_path: Path to the audio file
        segment_duration: Duration of each segment in seconds
        
    Returns:
        List of paths to segment files
    """
    try:
        print(f"Splitting audio into {segment_duration}-second segments...")
        
        # Load audio file
        audio = AudioSegment.from_file(audio_path)
        total_duration = len(audio) / 1000.0
        print(f"Total audio duration: {total_duration:.2f} seconds")
        
        # Convert to mono if stereo
        if audio.channels > 1:
            audio = audio.set_channels(1)
            print("Converted to mono")
        
        # Set sample rate to 16kHz
        if audio.frame_rate != 16000:
            audio = audio.set_frame_rate(16000)
            print(f"Set sample rate to 16kHz")
        
        # Set bit depth to 16-bit
        audio = audio.set_sample_width(2)
        print("Set bit depth to 16-bit")
        
        # Normalize audio volume
        audio = audio.normalize()
        print("Normalized audio volume")
        
        # Calculate segment duration in milliseconds
        segment_duration_ms = segment_duration * 1000
        
        # Split audio into segments
        segments = []
        segment_paths = []
        
        for i in range(0, len(audio), segment_duration_ms):
            segment = audio[i:i + segment_duration_ms]
            segments.append(segment)
            
            # Create temp file for segment
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                segment_path = tmp.name
            
            # Export segment as WAV
            segment.export(segment_path, format="wav", parameters=["-q:a", "0"])
            segment_paths.append(segment_path)
            
            segment_start = i / 1000.0
            segment_end = min((i + segment_duration_ms) / 1000.0, total_duration)
            print(f"Created segment {len(segments)}: {segment_start:.1f}s - {segment_end:.1f}s")
        
        print(f"Successfully split audio into {len(segments)} segments")
        return segment_paths
        
    except Exception as e:
        print(f"ERROR: Audio splitting failed: {e}")
        return [audio_path]  # Return original file if splitting fails


def transcribe_segment_with_wit(audio_path: str, token: str, segment_number: int = 0) -> Optional[str]:
    """
    Transcribe a single audio segment using Wit.ai
    
    Args:
        audio_path: Path to the audio segment file
        token: Wit.ai API token
        segment_number: Segment number for logging
        
    Returns:
        Transcribed text if successful, else None
    """
    try:
        print(f"Transcribing segment {segment_number + 1}...")
        
        # Check if file exists and get its size
        if not os.path.exists(audio_path):
            print(f"ERROR: Segment file does not exist: {audio_path}")
            return None
            
        file_size = os.path.getsize(audio_path)
        print(f"Segment {segment_number + 1} file size: {file_size} bytes")
        
        if file_size == 0:
            print(f"ERROR: Segment {segment_number + 1} file is empty")
            return None

        # Use Wit.ai SDK
        client = Wit(token)
        
        # Try with timeout handling
        max_retries = 3
        for attempt in range(max_retries):
            try:
                with open(audio_path, 'rb') as f:
                    resp = client.speech(f, {'Content-Type': 'audio/wav'})
                
                print(f"Segment {segment_number + 1} Wit.ai response: {resp}")
                break  # Success, exit retry loop
                
            except Exception as e:
                error_msg = str(e)
                print(f"Segment {segment_number + 1} attempt {attempt + 1} failed: {error_msg}")
                
                if "timeout" in error_msg.lower() or "408" in error_msg:
                    if attempt < max_retries - 1:
                        print(f"Timeout detected for segment {segment_number + 1}, retrying... (attempt {attempt + 2}/{max_retries})")
                        continue
                    else:
                        print(f"All retry attempts failed for segment {segment_number + 1} due to timeout")
                        return None
                else:
                    # Non-timeout error, don't retry
                    print(f"Non-timeout error for segment {segment_number + 1}: {error_msg}")
                    return None
        
        # Extract transcription from response
        transcription = resp.get('_text')
        if not transcription:
            transcription = resp.get('text')
        
        if transcription:
            print(f"SUCCESS: Segment {segment_number + 1} transcription: {transcription}")
            return transcription
        else:
            print(f"WARNING: No transcription found in segment {segment_number + 1} response")
            return None
            
    except Exception as e:
        print(f"ERROR: Unexpected error in segment {segment_number + 1} transcription: {e}")
        return None


def transcribe_with_wit(audio_path: str, language: str = 'english') -> Optional[str]:
    """
    Transcribe audio using Wit.ai Speech API with segmentation for reliability.
    Splits long audio into 18-second segments and processes them sequentially.
    
    Args:
        audio_path: Path to the audio file (preferably .wav)
        language: Language for transcription ('english' or 'arabic')
    Returns:
        Transcribed text if successful, else None.
    """
    if language == 'english':
        token = WIT_AI_TOKEN_ENGLISH
    elif language == 'arabic':
        if not WIT_AI_TOKEN_ARABIC:
            print("WARNING: WIT_AI_TOKEN_ARABIC not set. Falling back to English transcription.")
            token = WIT_AI_TOKEN_ENGLISH
        else:
            token = WIT_AI_TOKEN_ARABIC
    else:
        raise ValueError("Language must be 'english' or 'arabic'")
    
    if not token:
        raise ValueError(f"WIT_AI_TOKEN_{language.upper()} environment variable not set.")

    print(f"Using token: {token[:10]}... for language: {language}")
    print(f"Original audio file path: {audio_path}")

    # Ensure audio is in .wav format for optimal Wit.ai performance
    if not audio_path.lower().endswith('.wav'):
        print(f"Converting {audio_path} to .wav format for Wit.ai...")
        try:
            audio = AudioSegment.from_file(audio_path)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                wav_path = tmp.name
            audio.export(wav_path, format="wav")
            audio_path = wav_path
            print(f"Converted to: {audio_path}")
        except Exception as e:
            print(f"WARNING: Could not convert to WAV: {e}")

    # Split audio into segments
    segment_paths = split_audio_into_segments(audio_path)
    
    if len(segment_paths) == 1 and segment_paths[0] == audio_path:
        print("Segmentation failed, falling back to single file processing")
        # Fall back to original method
        return transcribe_single_file_with_wit(audio_path, token)
    
    print(f"Processing {len(segment_paths)} segments...")
    
    # Process each segment
    transcriptions = []
    segment_files_to_cleanup = []
    
    try:
        for i, segment_path in enumerate(segment_paths):
            transcription = transcribe_segment_with_wit(segment_path, token, i)
            if transcription:
                transcriptions.append(transcription)
            else:
                print(f"WARNING: Segment {i + 1} failed to transcribe")
                transcriptions.append("")  # Add empty string to maintain segment order
            
            # Track segment files for cleanup
            if segment_path != audio_path:
                segment_files_to_cleanup.append(segment_path)
        
        # Combine all transcriptions
        if transcriptions:
            combined_transcription = " ".join(transcriptions).strip()
            print(f"SUCCESS: Combined transcription from {len(segment_paths)} segments")
            print(f"Final transcription: {combined_transcription}")
            return combined_transcription
        else:
            print("ERROR: No segments were successfully transcribed")
            return None
            
    except Exception as e:
        print(f"ERROR: Unexpected error in segmented transcription: {e}")
        return None
    finally:
        # Clean up segment files
        for segment_path in segment_files_to_cleanup:
            try:
                if os.path.exists(segment_path):
                    os.remove(segment_path)
                    print(f"Cleaned up segment file: {segment_path}")
            except Exception as e:
                print(f"WARNING: Could not remove segment file {segment_path}: {e}")


def transcribe_single_file_with_wit(audio_path: str, token: str) -> Optional[str]:
    """
    Transcribe a single audio file using Wit.ai (fallback method)
    
    Args:
        audio_path: Path to the audio file
        token: Wit.ai API token
        
    Returns:
        Transcribed text if successful, else None
    """
    print("Using single file transcription method...")
    
    # Convert audio to Wit.ai compatible format
    converted_audio_path = convert_audio_for_wit(audio_path)
    
    try:
        # Check if file exists and get its size
        if not os.path.exists(converted_audio_path):
            print(f"ERROR: Converted audio file does not exist: {converted_audio_path}")
            return None
            
        file_size = os.path.getsize(converted_audio_path)
        print(f"Converted audio file size: {file_size} bytes")
        
        if file_size == 0:
            print("ERROR: Converted audio file is empty")
            return None

        # Use Wit.ai SDK
        print("Initializing Wit.ai client...")
        client = Wit(token)
        
        print("Sending audio to Wit.ai...")
        
        # Try with timeout handling
        max_retries = 3
        for attempt in range(max_retries):
            try:
                with open(converted_audio_path, 'rb') as f:
                    resp = client.speech(f, {'Content-Type': 'audio/wav'})
                
                print(f"Wit.ai response: {resp}")
                break  # Success, exit retry loop
                
            except Exception as e:
                error_msg = str(e)
                print(f"Attempt {attempt + 1} failed: {error_msg}")
                
                if "timeout" in error_msg.lower() or "408" in error_msg:
                    if attempt < max_retries - 1:
                        print(f"Timeout detected, retrying... (attempt {attempt + 2}/{max_retries})")
                        continue
                    else:
                        print("All retry attempts failed due to timeout")
                        return None
                else:
                    # Non-timeout error, don't retry
                    print(f"Non-timeout error: {error_msg}")
                    return None
        
        # Extract transcription from response
        transcription = resp.get('_text')
        if not transcription:
            transcription = resp.get('text')
        
        if transcription:
            print(f"SUCCESS: Transcription successful: {transcription}")
            return transcription
        else:
            print("WARNING: No transcription found in Wit.ai response")
            print(f"Available fields in response: {list(resp.keys())}")
            print(f"Full response: {resp}")
            return None
            
    except Exception as e:
        print(f"ERROR: Unexpected error in Wit.ai transcription: {e}")
        return None
    finally:
        # Clean up converted audio file if it's different from original
        if converted_audio_path != audio_path and os.path.exists(converted_audio_path):
            try:
                os.remove(converted_audio_path)
                print("Converted audio file cleaned up")
            except Exception as e:
                print(f"WARNING: Could not remove converted audio file: {e}") 


def get_wit_limits() -> dict:
    """
    Get current Wit.ai transcription limits
    
    Returns:
        Dictionary with current limit settings
    """
    return {
        "max_audio_duration_seconds": MAX_AUDIO_DURATION_SECONDS,
        "max_file_size_mb": MAX_FILE_SIZE_MB,
        "segment_duration_seconds": SEGMENT_DURATION_SECONDS,
        "max_audio_duration_minutes": MAX_AUDIO_DURATION_SECONDS / 60,
        "description": {
            "duration": f"Maximum audio duration: {MAX_AUDIO_DURATION_SECONDS} seconds ({MAX_AUDIO_DURATION_SECONDS/60:.1f} minutes)",
            "file_size": f"Maximum file size: {MAX_FILE_SIZE_MB}MB",
            "segment_duration": f"Segment duration: {SEGMENT_DURATION_SECONDS} seconds",
            "note": "These limits can be adjusted by modifying the constants at the top of this file"
        }
    }


def set_wit_limits(duration_seconds: int = None, file_size_mb: int = None, segment_duration_seconds: int = None) -> dict:
    """
    Set Wit.ai transcription limits
    
    Args:
        duration_seconds: New maximum audio duration in seconds
        file_size_mb: New maximum file size in MB
        segment_duration_seconds: New segment duration in seconds
        
    Returns:
        Dictionary with updated limit settings
    """
    global MAX_AUDIO_DURATION_SECONDS, MAX_FILE_SIZE_MB, SEGMENT_DURATION_SECONDS
    
    if duration_seconds is not None:
        if duration_seconds > 0:
            MAX_AUDIO_DURATION_SECONDS = duration_seconds
            print(f"Updated max audio duration to {duration_seconds} seconds ({duration_seconds/60:.1f} minutes)")
        else:
            print("ERROR: Duration must be greater than 0")
    
    if file_size_mb is not None:
        if file_size_mb > 0:
            MAX_FILE_SIZE_MB = file_size_mb
            print(f"Updated max file size to {file_size_mb}MB")
        else:
            print("ERROR: File size must be greater than 0")
    
    if segment_duration_seconds is not None:
        if 5 <= segment_duration_seconds <= 60:
            SEGMENT_DURATION_SECONDS = segment_duration_seconds
            print(f"Updated segment duration to {segment_duration_seconds} seconds")
        else:
            print("ERROR: Segment duration must be between 5 and 60 seconds")
    
    return get_wit_limits() 