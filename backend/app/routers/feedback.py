from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from fastapi.responses import JSONResponse
import httpx
from typing import Optional
import os
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.app.crud.feedback import create_feedback, get_feedback_by_presentation_id

router = APIRouter(prefix="/feedback", tags=["Feedback Service"])

FEEDBACK_SERVICE_URL = "http://host.docker.internal:8082/api"

async def proxy_to_feedback_service(endpoint: str, file: UploadFile, extra_form: Optional[dict] = None):
    url = f"{FEEDBACK_SERVICE_URL}/{endpoint}"
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            form_data = {}
            if extra_form:
                form_data.update(extra_form)
            files = {"file": (file.filename, await file.read(), file.content_type)}
            resp = await client.post(url, files=files, data=form_data)
            return JSONResponse(status_code=resp.status_code, content=resp.json())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to contact feedback service: {str(e)}")

@router.post("/speech-emotion")
async def speech_emotion(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("speech-emotion", file)

@router.post("/pitch-analysis")
async def pitch_analysis(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("pitch-analysis", file)

@router.post("/volume-consistency")
async def volume_consistency(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("volume-consistency", file)

@router.post("/filler-detection")
async def filler_detection(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("filler-detection", file)

@router.post("/stutter-detection")
async def stutter_detection(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("stutter-detection", file)

@router.post("/lexical-richness")
async def lexical_richness(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("lexical-richness", file)

@router.post("/keyword-relevance")
async def keyword_relevance(file: UploadFile = File(...), keywords: str = Form("")):
    return await proxy_to_feedback_service("keyword-relevance", file, {"keywords": keywords})

@router.post("/wpm-calculator")
async def wpm_calculator(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("wpm-calculator", file)

@router.post("/facial-emotion")
async def facial_emotion(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("facial-emotion", file)

@router.post("/eye-contact")
async def eye_contact(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("eye-contact", file)

@router.post("/hand-gesture")
async def hand_gesture(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("hand-gesture", file)

@router.post("/posture-analysis")
async def posture_analysis(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("posture-analysis", file)

@router.post("/enhanced-overall-feedback")
async def enhanced_overall_feedback(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("enhanced-overall-feedback", file)

@router.post("/overall-feedback")
async def overall_feedback(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("overall-feedback", file)

@router.post("/audio-only-feedback")
async def audio_only_feedback(file: UploadFile = File(...)):
    return await proxy_to_feedback_service("audio-only-feedback", file)

@router.post("/custom-feedback")
async def custom_feedback(
    file: UploadFile = File(...),
    services: str = Form(...),
    presentation_id: int = Form(...),
    db: Session = Depends(get_db)
):
    # Call feedback service
    url = f"{FEEDBACK_SERVICE_URL}/custom-feedback"
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            form_data = {"services": services, "presentation_id": str(presentation_id)}
            files = {"file": (file.filename, await file.read(), file.content_type)}
            resp = await client.post(url, files=files, data=form_data)
            feedback_data = resp.json()
            # Add used_criteria
            used_criteria = [s.strip() for s in services.split(",") if s.strip()]
            feedback_data["used_criteria"] = used_criteria
            # Store feedback in DB
            create_feedback(db, presentation_id, feedback_data)
            return JSONResponse(status_code=resp.status_code, content=feedback_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to contact feedback service: {str(e)}")

@router.get("/presentation/{presentation_id}/feedback")
def get_presentation_feedback(presentation_id: int, db: Session = Depends(get_db)):
    feedback = get_feedback_by_presentation_id(db, presentation_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found for this presentation.")
    return feedback.data 