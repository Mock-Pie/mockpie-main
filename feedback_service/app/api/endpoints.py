from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
import time
import asyncio
from typing import Dict, Any
import logging

# These will be injected from main.py
analyzers = None
logger = logging.getLogger("api.endpoints")

router = APIRouter()

# ============================================================================
# INDIVIDUAL MODEL API ENDPOINTS
# ============================================================================

@router.post("/api/speech-emotion")
async def api_speech_emotion(file: UploadFile = File(...)):
    try:
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        audio_path, _, _ = await analyzers["file_processor"].extract_components(file_path)
        result = await analyzers["speech_emotion"].analyze(audio_path)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        logger.error(f"Speech emotion API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

@router.post("/api/pitch-analysis")
async def api_pitch_analysis(file: UploadFile = File(...)):
    try:
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        audio_path, _, _ = await analyzers["file_processor"].extract_components(file_path)
        result = await analyzers["pitch_analysis"].analyze(audio_path)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        logger.error(f"Pitch analysis API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

@router.post("/api/volume-consistency")
async def api_volume_consistency(file: UploadFile = File(...)):
    try:
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        audio_path, _, _ = await analyzers["file_processor"].extract_components(file_path)
        result = await analyzers["volume_consistency"].analyze(audio_path)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        logger.error(f"Volume consistency API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

@router.post("/api/filler-detection")
async def api_filler_detection(file: UploadFile = File(...)):
    try:
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        audio_path, _, _ = await analyzers["file_processor"].extract_components(file_path)
        result = await analyzers["filler_detection"].analyze(audio_path)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        logger.error(f"Filler detection API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

@router.post("/api/stutter-detection")
async def api_stutter_detection(file: UploadFile = File(...)):
    try:
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        audio_path, _, _ = await analyzers["file_processor"].extract_components(file_path)
        result = await analyzers["stutter_detection"].analyze(audio_path)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        logger.error(f"Stutter detection API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

@router.post("/api/lexical-richness")
async def api_lexical_richness(file: UploadFile = File(...)):
    try:
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        audio_path, _, _ = await analyzers["file_processor"].extract_components(file_path)
        result = await analyzers["lexical_richness"].analyze(audio_path)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        logger.error(f"Lexical richness API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

@router.post("/api/keyword-relevance")
async def api_keyword_relevance(file: UploadFile = File(...), keywords: str = Form("")):
    try:
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        audio_path, _, _ = await analyzers["file_processor"].extract_components(file_path)
        result = await analyzers["keyword_relevance"].analyze(audio_path, keywords)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        logger.error(f"Keyword relevance API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

@router.post("/api/wpm-calculator")
async def api_wpm_calculator(file: UploadFile = File(...)):
    try:
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        audio_path, _, _ = await analyzers["file_processor"].extract_components(file_path)
        result = analyzers["wpm_calculator"].analyze(audio_path, context='presentation')
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        logger.error(f"WPM calculator API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

@router.post("/api/facial-emotion")
async def api_facial_emotion(file: UploadFile = File(...)):
    try:
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        _, video_path, has_video = await analyzers["file_processor"].extract_components(file_path)
        if not has_video or not video_path:
            return JSONResponse(content={"error": "No video content found in uploaded file"}, status_code=400)
        result = await analyzers["facial_emotion"].analyze(video_path)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        logger.error(f"Facial emotion API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

@router.post("/api/eye-contact")
async def api_eye_contact(file: UploadFile = File(...)):
    try:
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        _, video_path, has_video = await analyzers["file_processor"].extract_components(file_path)
        if not has_video or not video_path:
            return JSONResponse(content={"error": "No video content found in uploaded file"}, status_code=400)
        result = await analyzers["eye_contact"].analyze_eye_contact(video_path)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        logger.error(f"Eye contact API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

@router.post("/api/hand-gesture")
async def api_hand_gesture(file: UploadFile = File(...)):
    try:
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        _, video_path, has_video = await analyzers["file_processor"].extract_components(file_path)
        if not has_video or not video_path:
            return JSONResponse(content={"error": "No video content found in uploaded file"}, status_code=400)
        result = await analyzers["hand_gesture"].analyze(video_path)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        logger.error(f"Hand gesture API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

@router.post("/api/posture-analysis")
async def api_posture_analysis(file: UploadFile = File(...)):
    try:
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        _, video_path, has_video = await analyzers["file_processor"].extract_components(file_path)
        if not has_video or not video_path:
            return JSONResponse(content={"error": "No video content found in uploaded file"}, status_code=400)
        result = await analyzers["posture_analysis"].analyze(video_path)
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        logger.error(f"Posture analysis API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

# ============================================================================
# ENHANCED OVERALL FEEDBACK API ENDPOINTS
# ============================================================================

@router.post("/api/enhanced-overall-feedback")
async def api_enhanced_overall_feedback(file: UploadFile = File(...)):
    """
    Enhanced overall feedback endpoint that provides detailed individual model scores
    and comprehensive overall feedback combining all models.
    """
    try:
        logger.info(f"Enhanced overall feedback API called for file: {file.filename}")
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        audio_path, video_path, has_video = await analyzers["file_processor"].extract_components(file_path)
        
        # Pre-transcribe audio once for all models
        logger.info("Pre-transcribing audio for all models...")
        transcription = await analyzers["transcription_service"].get_transcription(audio_path)
        if transcription:
            logger.info(f"Transcription successful: {len(transcription)} characters")
        else:
            logger.warning("Transcription failed, models will use fallback methods")
        
        # Run all model analyses
        results = {}
        analysis_tasks = [
            ("speech_emotion", analyzers["speech_emotion"].analyze(audio_path)),
            ("wpm_analysis", asyncio.create_task(asyncio.to_thread(analyzers["wpm_calculator"].analyze, audio_path, 'presentation'))),
            ("pitch_analysis", analyzers["pitch_analysis"].analyze(audio_path)),
            ("volume_consistency", analyzers["volume_consistency"].analyze(audio_path)),
            ("filler_detection", analyzers["filler_detection"].analyze(audio_path)),
            ("stutter_detection", analyzers["stutter_detection"].analyze(audio_path)),
            ("lexical_richness", analyzers["lexical_richness"].analyze(audio_path)),
        ]
        
        if has_video and video_path:
            analysis_tasks.extend([
                ("facial_emotion", analyzers["facial_emotion"].analyze(video_path)),
                ("eye_contact", analyzers["eye_contact"].analyze_eye_contact(video_path)),
                ("hand_gesture", analyzers["hand_gesture"].analyze(video_path)),
                ("posture_analysis", analyzers["posture_analysis"].analyze(video_path)),
            ])
        
        # Execute all analyses
        for name, task in analysis_tasks:
            try:
                if asyncio.iscoroutine(task):
                    result = await task
                else:
                    result = await task
                results[name] = result if isinstance(result, dict) else {"error": "Invalid result"}
            except Exception as e:
                logger.error(f"{name} analysis error: {e}")
                results[name] = {"error": str(e)}
        
        # Generate enhanced comprehensive feedback
        try:
            enhanced_feedback = await analyzers["enhanced_feedback_generator"].generate_comprehensive_feedback(results)
            results["enhanced_feedback"] = enhanced_feedback
        except Exception as e:
            logger.error(f"Enhanced feedback generation error: {e}")
            results["enhanced_feedback"] = {"error": str(e)}
        
        # Add transcription info to results
        results["transcription_info"] = {
            "transcription_length": len(transcription) if transcription else 0,
            "transcription_preview": transcription[:200] + "..." if transcription and len(transcription) > 200 else transcription,
            "transcription_success": transcription is not None
        }
        
        return JSONResponse(content=results, status_code=200)
        
    except Exception as e:
        logger.error(f"Enhanced overall feedback API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)


# ============================================================================
# LEGACY OVERALL FEEDBACK API ENDPOINTS (for backward compatibility)
# ============================================================================

@router.post("/api/overall-feedback")
async def api_overall_feedback(file: UploadFile = File(...)):
    try:
        logger.info(f"Overall feedback API called for file: {file.filename}")
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        audio_path, video_path, has_video = await analyzers["file_processor"].extract_components(file_path)
        
        # Pre-transcribe audio once for all models
        logger.info("Pre-transcribing audio for all models...")
        transcription = await analyzers["transcription_service"].get_transcription(audio_path)
        if transcription:
            logger.info(f"Transcription successful: {len(transcription)} characters")
        else:
            logger.warning("Transcription failed, models will use fallback methods")
        
        results = {}
        analysis_tasks = [
            ("speech_emotion", analyzers["speech_emotion"].analyze(audio_path)),
            ("wpm_analysis", asyncio.create_task(asyncio.to_thread(analyzers["wpm_calculator"].analyze, audio_path, 'presentation'))),
            ("pitch_analysis", analyzers["pitch_analysis"].analyze(audio_path)),
            ("volume_consistency", analyzers["volume_consistency"].analyze(audio_path)),
            ("filler_detection", analyzers["filler_detection"].analyze(audio_path)),
            ("stutter_detection", analyzers["stutter_detection"].analyze(audio_path)),
            ("lexical_richness", analyzers["lexical_richness"].analyze(audio_path)),
        ]
        if has_video and video_path:
            analysis_tasks.extend([
                ("facial_emotion", analyzers["facial_emotion"].analyze(video_path)),
                ("eye_contact", analyzers["eye_contact"].analyze_eye_contact(video_path)),
                ("hand_gesture", analyzers["hand_gesture"].analyze(video_path)),
                ("posture_analysis", analyzers["posture_analysis"].analyze(video_path)),
            ])
        for name, task in analysis_tasks:
            try:
                if asyncio.iscoroutine(task):
                    result = await task
                else:
                    result = await task
                results[name] = result if isinstance(result, dict) else {"error": "Invalid result"}
            except Exception as e:
                logger.error(f"{name} analysis error: {e}")
                results[name] = {"error": str(e)}
        try:
            composite_result = await analyzers["composite_scorer"].calculate_score(results)
            results["composite_score"] = composite_result
        except Exception as e:
            logger.error(f"Composite score error: {e}")
            results["composite_score"] = {"error": str(e)}
        
        # Generate overall feedback summary
        try:
            feedback_summary = await _generate_overall_feedback_summary(results)
            results["feedback_summary"] = feedback_summary
        except Exception as e:
            logger.error(f"Feedback summary error: {e}")
            results["feedback_summary"] = {"error": str(e)}
        
        # Add transcription info to results
        results["transcription_info"] = {
            "transcription_length": len(transcription) if transcription else 0,
            "transcription_preview": transcription[:200] + "..." if transcription and len(transcription) > 200 else transcription,
            "transcription_success": transcription is not None
        }
        
        return JSONResponse(content=results, status_code=200)
        
    except Exception as e:
        logger.error(f"Overall feedback API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

@router.post("/api/audio-only-feedback")
async def api_audio_only_feedback(file: UploadFile = File(...)):
    try:
        logger.info(f"Audio-only feedback API called for file: {file.filename}")
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        audio_path, _, _ = await analyzers["file_processor"].extract_components(file_path)
        
        # Pre-transcribe audio once for all models
        logger.info("Pre-transcribing audio for all models...")
        transcription = await analyzers["transcription_service"].get_transcription(audio_path)
        if transcription:
            logger.info(f"Transcription successful: {len(transcription)} characters")
        else:
            logger.warning("Transcription failed, models will use fallback methods")
        
        results = {}
        analysis_tasks = [
            ("speech_emotion", analyzers["speech_emotion"].analyze(audio_path)),
            ("wpm_analysis", asyncio.create_task(asyncio.to_thread(analyzers["wpm_calculator"].analyze, audio_path, 'presentation'))),
            ("pitch_analysis", analyzers["pitch_analysis"].analyze(audio_path)),
            ("volume_consistency", analyzers["volume_consistency"].analyze(audio_path)),
            ("filler_detection", analyzers["filler_detection"].analyze(audio_path)),
            ("stutter_detection", analyzers["stutter_detection"].analyze(audio_path)),
            ("lexical_richness", analyzers["lexical_richness"].analyze(audio_path)),
        ]
        
        for name, task in analysis_tasks:
            try:
                if asyncio.iscoroutine(task):
                    result = await task
                else:
                    result = await task
                results[name] = result if isinstance(result, dict) else {"error": "Invalid result"}
            except Exception as e:
                logger.error(f"{name} analysis error: {e}")
                results[name] = {"error": str(e)}
        
        try:
            composite_result = await analyzers["composite_scorer"].calculate_score(results)
            results["composite_score"] = composite_result
        except Exception as e:
            logger.error(f"Composite score error: {e}")
            results["composite_score"] = {"error": str(e)}
        
        # Generate audio feedback summary
        try:
            feedback_summary = await _generate_audio_feedback_summary(results)
            results["feedback_summary"] = feedback_summary
        except Exception as e:
            logger.error(f"Feedback summary error: {e}")
            results["feedback_summary"] = {"error": str(e)}
        
        # Add transcription info to results
        results["transcription_info"] = {
            "transcription_length": len(transcription) if transcription else 0,
            "transcription_preview": transcription[:200] + "..." if transcription and len(transcription) > 200 else transcription,
            "transcription_success": transcription is not None
        }
        
        return JSONResponse(content=results, status_code=200)
        
    except Exception as e:
        logger.error(f"Audio-only feedback API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500)

# ============================================================================
# HELPER FUNCTIONS FOR FEEDBACK GENERATION
# ============================================================================

async def _generate_overall_feedback_summary(results: Dict[str, Any]) -> Dict[str, Any]:
    try:
        summary = {
            "overall_score": 5.0,
            "strengths": [],
            "areas_for_improvement": [],
            "recommendations": [],
            "detailed_feedback": {}
        }
        if "composite_score" in results and "composite_score" in results["composite_score"]:
            composite = results["composite_score"]["composite_score"]
            summary["overall_score"] = composite.get("overall", 5.0)
        feedback_components = {}
        if "speech_emotion" in results and "error" not in results["speech_emotion"]:
            emotion_data = results["speech_emotion"]
            emotion_score = emotion_data.get("overall_score", 5.0)
            feedback_components["speech_emotion"] = {
                "score": emotion_score,
                "feedback": "Good emotional expression" if emotion_score >= 7 else "Consider varying emotional tone"
            }
        if "wpm_analysis" in results and "error" not in results["wpm_analysis"]:
            wpm_data = results["wpm_analysis"]
            wpm_score = wpm_data.get("overall_score", 5.0)
            wpm_rate = wpm_data.get("wpm", 150)
            feedback_components["speaking_pace"] = {
                "score": wpm_score,
                "wpm_rate": wpm_rate,
                "feedback": f"Speaking pace is {'good' if 120 <= wpm_rate <= 180 else 'too fast' if wpm_rate > 180 else 'too slow'}"
            }
        if "volume_consistency" in results and "error" not in results["volume_consistency"]:
            volume_data = results["volume_consistency"]
            volume_score = volume_data.get("overall_score", 5.0)
            feedback_components["volume_control"] = {
                "score": volume_score,
                "feedback": "Good volume consistency" if volume_score >= 7 else "Work on maintaining consistent volume"
            }
        summary["detailed_feedback"] = feedback_components
        if summary["overall_score"] >= 8:
            summary["strengths"].append("Excellent overall presentation skills")
        elif summary["overall_score"] >= 6:
            summary["strengths"].append("Good presentation foundation")
            summary["areas_for_improvement"].append("Continue refining specific aspects")
        else:
            summary["areas_for_improvement"].append("Focus on fundamental presentation skills")
        return summary
    except Exception as e:
        logger.error(f"Error generating overall feedback: {e}")
        return {
            "overall_score": 5.0,
            "error": "Could not generate feedback summary",
            "strengths": [],
            "areas_for_improvement": [],
            "recommendations": []
        }

async def _generate_audio_feedback_summary(results: Dict[str, Any]) -> Dict[str, Any]:
    try:
        summary = {
            "overall_score": 5.0,
            "audio_quality_score": 5.0,
            "speaking_skills": [],
            "technical_issues": [],
            "recommendations": []
        }
        if "composite_score" in results and "composite_score" in results["composite_score"]:
            composite = results["composite_score"]["composite_score"]
            summary["overall_score"] = composite.get("overall", 5.0)
        audio_components = {}
        if "volume_consistency" in results and "error" not in results["volume_consistency"]:
            volume_data = results["volume_consistency"]
            audio_components["volume"] = {
                "score": volume_data.get("overall_score", 5.0),
                "issues": volume_data.get("detected_issues", [])
            }
        if "stutter_detection" in results and "error" not in results["stutter_detection"]:
            stutter_data = results["stutter_detection"]
            audio_components["clarity"] = {
                "score": stutter_data.get("overall_score", 5.0),
                "stutter_count": stutter_data.get("stutter_count", 0)
            }
        summary["audio_analysis"] = audio_components
        return summary
    except Exception as e:
        logger.error(f"Error generating audio feedback: {e}")
        return {
            "overall_score": 5.0,
            "error": "Could not generate audio feedback summary"
        }

# ============================================================================
# API DOCUMENTATION ENDPOINTS
# ============================================================================

@router.get("/api/endpoints")
async def get_api_endpoints():
    return {
        "individual_models": {
            "speech_emotion": "/api/speech-emotion",
            "pitch_analysis": "/api/pitch-analysis", 
            "volume_consistency": "/api/volume-consistency",
            "filler_detection": "/api/filler-detection",
            "stutter_detection": "/api/stutter-detection",
            "lexical_richness": "/api/lexical-richness",
            "keyword_relevance": "/api/keyword-relevance",
            "wpm_calculator": "/api/wpm-calculator",
            "facial_emotion": "/api/facial-emotion",
            "eye_contact": "/api/eye-contact",
            "hand_gesture": "/api/hand-gesture",
            "posture_analysis": "/api/posture-analysis"
        },
        "overall_feedback": {
            "enhanced_comprehensive": "/api/enhanced-overall-feedback",
            "enhanced_audio_only": "/api/enhanced-audio-feedback",
            "legacy_comprehensive": "/api/overall-feedback",
            "legacy_audio_only": "/api/audio-only-feedback"
        },
        "documentation": "/docs",
        "health_check": "/health"
    }

@router.post("/api/custom-feedback")
async def api_custom_feedback(
    file: UploadFile = File(...),
    services: str = Form(...)
):
    """
    Customizable feedback endpoint: upload a video/audio and specify which services to run.
    'services' should be a comma-separated list of service keys, e.g.:
    'speech_emotion,pitch_analysis,facial_emotion,eye_contact,hand_gesture,posture_analysis,volume_consistency,filler_detection,stutter_detection,lexical_richness,wpm_analysis,keyword_relevance'
    """
    try:
        if analyzers is None:
            logger.error("Analyzers not initialized. Make sure analyzers are injected from main.py.")
            return JSONResponse(content={"error": "Analyzers not initialized."}, status_code=500)
        logger.info(f"Custom feedback API called for file: {file.filename} with services: {services}")
        file_path = await analyzers["file_processor"].save_uploaded_file(file)
        audio_path, video_path, has_video = await analyzers["file_processor"].extract_components(file_path)

        # Parse requested services
        requested_services = [s.strip() for s in services.split(",") if s.strip()]
        results = {}

        # Map of service key to (analyzer key, input type, method, extra kwargs)
        service_map = {
            "speech_emotion": ("speech_emotion", "audio", "analyze", {}),
            "pitch_analysis": ("pitch_analysis", "audio", "analyze", {}),
            "volume_consistency": ("volume_consistency", "audio", "analyze", {}),
            "filler_detection": ("filler_detection", "audio", "analyze", {}),
            "stutter_detection": ("stutter_detection", "audio", "analyze", {}),
            "lexical_richness": ("lexical_richness", "audio", "analyze", {}),
            "wpm_analysis": ("wpm_calculator", "audio", "analyze", {"context": "presentation"}),
            "keyword_relevance": ("keyword_relevance", "audio", "analyze", {}),
            "facial_emotion": ("facial_emotion", "video", "analyze", {}),
            "eye_contact": ("eye_contact", "video", "analyze_eye_contact", {}),
            "hand_gesture": ("hand_gesture", "video", "analyze", {}),
            "posture_analysis": ("posture_analysis", "video", "analyze", {}),
        }

        # Run only requested analyses
        for service in requested_services:
            if service not in service_map:
                results[service] = {"error": f"Unknown service: {service}"}
                continue
            analyzer_key, input_type, method, extra_kwargs = service_map[service]
            analyzer = analyzers.get(analyzer_key)
            if analyzer is None:
                results[service] = {"error": f"Analyzer not available: {analyzer_key}"}
                continue
            # Choose input path
            if input_type == "audio":
                if not audio_path:
                    results[service] = {"error": "No audio found in file."}
                    continue
                input_path = audio_path
            elif input_type == "video":
                if not (has_video and video_path):
                    results[service] = {"error": "No video found in file."}
                    continue
                input_path = video_path
            else:
                results[service] = {"error": f"Unknown input type: {input_type}"}
                continue
            # Call the analyzer method
            try:
                analyze_method = getattr(analyzer, method)
                if extra_kwargs:
                    result = await analyze_method(input_path, **extra_kwargs)
                else:
                    result = await analyze_method(input_path)
                results[service] = result if isinstance(result, dict) else {"error": "Invalid result"}
            except Exception as e:
                logger.error(f"{service} analysis error: {e}")
                results[service] = {"error": str(e)}

        return JSONResponse(content=results, status_code=200)
    except Exception as e:
        logger.error(f"Custom feedback API error: {e}")
        return JSONResponse(content={"error": str(e), "status": "failed"}, status_code=500) 