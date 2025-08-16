import os
import logging
import time
import asyncio
import traceback
from pathlib import Path
from typing import Dict, List, Any
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import aiofiles
from dotenv import load_dotenv
from app.utils.wit_transcriber import transcribe_with_wit
import shutil
import tempfile
import requests

# Load environment variables from .env file
load_dotenv()

# Import all analyzers
from app.models.speech_emotion import SpeechEmotionAnalyzer
from app.models.pitch_analysis import PitchAnalyzer
from app.models.volume_consistency import VolumeConsistencyAnalyzer
from app.models.filler_detection import FillerWordDetector
from app.models.stutter_detection import StutterDetectionAnalyzer
from app.models.lexical_richness import LexicalRichnessAnalyzer
from app.models.keyword_relevance import KeywordRelevanceAnalyzer
from app.models.facial_emotion import FacialEmotionAnalyzer
from app.models.eye_contact import EyeContactAnalyzer
from app.models.hand_gesture import HandGestureDetector
from app.models.posture_analysis import PostureAnalyzer
from app.models.wpm_calculator import WPMCalculator
from app.utils.composite_scorer import CompositeScorer
from app.utils.enhanced_feedback_generator import EnhancedFeedbackGenerator
from app.utils.file_processor import FileProcessor
from app.utils.transcription_service import TranscriptionService
from app.utils.config import config

# Import the API router for model endpoints
from app.api import endpoints as api_endpoints

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Suppress common model loading warnings
import warnings
warnings.filterwarnings("ignore", message="Some weights of.*were not used when initializing.*")
warnings.filterwarnings("ignore", message="Some weights of.*were not initialized from.*")
warnings.filterwarnings("ignore", message="You should probably TRAIN this model.*")

# Initialize FastAPI app
app = FastAPI(title="Presentation Analysis API", version="1.0.0")

# Mount static files and templates
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Create upload directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("temp", exist_ok=True)
os.makedirs("logs", exist_ok=True)

# Global analyzers dictionary
analyzers = {}

@app.on_event("startup")
async def startup_event():
    """Initialize all analyzers on startup"""
    try:
        logger.info("Initializing analyzers...")
        # Get transcription configuration
        transcription_config = config.get_transcription_config()
        # Initialize Whisper transcriber for English
        whisper_transcriber = None
        try:
            from app.utils.whisper_transcriber import WhisperTranscriber
            whisper_config = config.get_whisper_config()
            whisper_transcriber = WhisperTranscriber(whisper_config["model_size"])
            logger.info(f"Whisper transcriber initialized with model: {whisper_config['model_size']}")
        except Exception as e:
            logger.error(f"Failed to initialize Whisper transcriber: {e}")
        # Initialize Wit transcriber for Arabic
        from app.utils.transcription_service import TranscriptionService
        transcription_service_english = TranscriptionService(whisper_transcriber)
        transcription_service_english.set_config(method="whisper", language="english")
        transcription_service_arabic = TranscriptionService(None)
        transcription_service_arabic.set_config(method="wit", language="arabic")
        analyzers["transcription_service_english"] = transcription_service_english
        analyzers["transcription_service_arabic"] = transcription_service_arabic
        # Initialize analyzers with both transcription services where needed
        analyzers["speech_emotion"] = SpeechEmotionAnalyzer()
        analyzers["pitch_analysis"] = PitchAnalyzer()
        analyzers["volume_consistency"] = VolumeConsistencyAnalyzer()
        analyzers["filler_detection"] = FillerWordDetector(
            transcription_service_english=transcription_service_english,
            transcription_service_arabic=transcription_service_arabic
        )
        analyzers["stutter_detection"] = StutterDetectionAnalyzer()
        analyzers["lexical_richness"] = LexicalRichnessAnalyzer(
            transcription_service_english=transcription_service_english,
            transcription_service_arabic=transcription_service_arabic
        )
        analyzers["keyword_relevance"] = KeywordRelevanceAnalyzer(
            transcription_service_english=transcription_service_english,
            transcription_service_arabic=transcription_service_arabic
        )
        analyzers["facial_emotion"] = FacialEmotionAnalyzer()
        analyzers["eye_contact"] = EyeContactAnalyzer()
        analyzers["hand_gesture"] = HandGestureDetector()
        analyzers["posture_analysis"] = PostureAnalyzer()
        analyzers["wpm_calculator"] = WPMCalculator(
            transcription_service_english=transcription_service_english,
            transcription_service_arabic=transcription_service_arabic
        )
        analyzers["composite_scorer"] = CompositeScorer()
        analyzers["enhanced_feedback_generator"] = EnhancedFeedbackGenerator()
        analyzers["file_processor"] = FileProcessor()
        # Keep the default transcription_service for backward compatibility
        analyzers["transcription_service"] = transcription_service_english
        
        # Initialize async analyzers (only those that have initialize method)
        async_analyzers = []  # Only known async analyzers
        
        for name in async_analyzers:
            try:
                if hasattr(analyzers[name], 'initialize'):
                    await analyzers[name].initialize()
                    logger.info(f"Initialized {name}")
            except Exception as e:
                logger.warning(f"Failed to initialize {name}: {e}")
        
        logger.info("All analyzers loaded successfully")
        # Inject analyzers into the endpoints module
        api_endpoints.analyzers = analyzers
        app.include_router(api_endpoints.router)
        
    except Exception as e:
        logger.error(f"Error initializing analyzers: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Serve the main upload page"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    try:
        import mediapipe as mp
        return {
            "status": "healthy",
            "mediapipe_version": mp.__version__,
            "timestamp": time.time(),
            "analyzers_count": len(analyzers)
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.post("/analyze/full")
async def analyze_full(file: UploadFile = File(...)):
    """Full analysis endpoint - main functionality with overall feedback"""
    try:
        logger.info(f"Received file: {file.filename}")
        
        # Use file processor to save uploaded file
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        logger.info(f"File saved to: {file_path}")
        
        # Extract audio and video components using file processor
        audio_path, video_path, has_video = await analyzers["file_processor"].extract_components(file_path)
        logger.info(f"Audio path: {audio_path}, Video path: {video_path}, Has video: {has_video}")
        
        results = {}
        
        # Run analyses sequentially with error handling
        try:
            logger.info("Starting speech emotion analysis...")
            speech_result = await analyzers["speech_emotion"].analyze(audio_path)
            results["speech_emotion"] = speech_result if isinstance(speech_result, dict) else {"error": "Invalid result"}
            logger.info("Speech emotion analysis completed")
        except Exception as e:
            logger.error(f"Speech emotion error: {e}")
            results["speech_emotion"] = {"error": str(e)}
        
        try:
            logger.info("Starting WPM analysis...")
            wpm_result = await analyzers["wpm_calculator"].analyze(audio_path, language='english', context='presentation')
            results["wpm_analysis"] = wpm_result if isinstance(wpm_result, dict) else {"error": "Invalid result"}
            logger.info("WPM analysis completed")
        except Exception as e:
            logger.error(f"WPM analysis error: {e}")
            results["wpm_analysis"] = {"error": str(e)}
        
        try:
            logger.info("Starting pitch analysis...")
            pitch_result = await analyzers["pitch_analysis"].analyze(audio_path)
            results["pitch_analysis"] = pitch_result if isinstance(pitch_result, dict) else {"error": "Invalid result"}
            logger.info("Pitch analysis completed")
        except Exception as e:
            logger.error(f"Pitch analysis error: {e}")
            results["pitch_analysis"] = {"error": str(e)}
        
        try:
            logger.info("Starting volume consistency analysis...")
            volume_result = await analyzers["volume_consistency"].analyze(audio_path)
            results["volume_consistency"] = volume_result if isinstance(volume_result, dict) else {"error": "Invalid result"}
            logger.info("Volume consistency analysis completed")
        except Exception as e:
            logger.error(f"Volume consistency error: {e}")
            results["volume_consistency"] = {"error": str(e)}
        
        try:
            logger.info("Starting filler detection analysis...")
            filler_result = await analyzers["filler_detection"].analyze(audio_path)
            results["filler_detection"] = filler_result if isinstance(filler_result, dict) else {"error": "Invalid result"}
            logger.info("Filler detection analysis completed")
        except Exception as e:
            logger.error(f"Filler detection error: {e}")
            results["filler_detection"] = {"error": str(e)}
        
        try:
            logger.info("Starting stutter detection analysis...")
            stutter_result = await analyzers["stutter_detection"].analyze(audio_path)
            results["stutter_detection"] = stutter_result if isinstance(stutter_result, dict) else {"error": "Invalid result"}
            logger.info("Stutter detection analysis completed")
        except Exception as e:
            logger.error(f"Stutter detection error: {e}")
            results["stutter_detection"] = {"error": str(e)}
        
        try:
            logger.info("Starting lexical richness analysis...")
            lexical_result = await analyzers["lexical_richness"].analyze(audio_path)
            results["lexical_richness"] = lexical_result if isinstance(lexical_result, dict) else {"error": "Invalid result"}
            logger.info("Lexical richness analysis completed")
        except Exception as e:
            logger.error(f"Lexical richness error: {e}")
            results["lexical_richness"] = {"error": str(e)}
        
        # Add video analyses if video file
        if has_video and video_path:
            try:
                logger.info("Starting facial emotion analysis...")
                facial_result = await analyzers["facial_emotion"].analyze(video_path)
                results["facial_emotion"] = facial_result if isinstance(facial_result, dict) else {"error": "Invalid result"}
                logger.info("Facial emotion analysis completed")
            except Exception as e:
                logger.error(f"Facial emotion error: {e}")
                results["facial_emotion"] = {"error": str(e)}
            
            try:
                logger.info("Starting eye contact analysis...")
                eye_result = await analyzers["eye_contact"].analyze_eye_contact(video_path)
                results["eye_contact"] = eye_result if isinstance(eye_result, dict) else {"error": "Invalid result"}
                logger.info("Eye contact analysis completed")
            except Exception as e:
                logger.error(f"Eye contact error: {e}")
                results["eye_contact"] = {"error": str(e)}
            
            try:
                logger.info("Starting hand gesture analysis...")
                hand_result = await analyzers["hand_gesture"].analyze(video_path)
                results["hand_gesture"] = hand_result if isinstance(hand_result, dict) else {"error": "Invalid result"}
                logger.info("Hand gesture analysis completed")
            except Exception as e:
                logger.error(f"Hand gesture error: {e}")
                results["hand_gesture"] = {"error": str(e)}
            
            try:
                logger.info("Starting posture analysis...")
                posture_result = await analyzers["posture_analysis"].analyze(video_path)
                results["posture_analysis"] = posture_result if isinstance(posture_result, dict) else {"error": "Invalid result"}
                logger.info("Posture analysis completed")
            except Exception as e:
                logger.error(f"Posture analysis error: {e}")
                results["posture_analysis"] = {"error": str(e)}
        
        return JSONResponse(content=results, status_code=200)
        
    except Exception as e:
        logger.error(f"Error in full analysis: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/wit-test", response_class=HTMLResponse)
def wit_test_page(request: Request):
    return templates.TemplateResponse("wit_test.html", {"request": request})

@app.post("/api/transcribe")
async def transcribe_api(audio: UploadFile = File(...), language: str = Form("english")):
    try:
        # Save uploaded audio to a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            shutil.copyfileobj(audio.file, tmp)
            tmp_path = tmp.name
        # Transcribe using Wit.ai
        transcription = transcribe_with_wit(tmp_path, language)
        # Clean up temp file
        try:
            os.remove(tmp_path)
        except Exception:
            pass
        if transcription:
            return {"success": True, "transcription": transcription}
        else:
            return {"success": False, "error": "No transcription returned."}
    except Exception as e:
        return {"success": False, "error": str(e)} 