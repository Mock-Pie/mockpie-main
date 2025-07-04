from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from fastapi.responses import JSONResponse
import httpx
from typing import Optional
import os
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.app.crud.feedback import create_feedback, get_feedback_by_presentation_id

router = APIRouter(prefix="/feedback", tags=["Feedback Service"])

FEEDBACK_SERVICE_URL = "http://presentation-analyzer:8082/api"

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

async def proxy_to_feedback_service_with_path(endpoint: str, file_path: str, extra_form: Optional[dict] = None):
    """Proxy to feedback service using file path instead of file content"""
    url = f"{FEEDBACK_SERVICE_URL}/{endpoint}"
    try:
        async with httpx.AsyncClient(timeout=300) as client:  # Increased timeout for large files
            form_data = {"file_path": file_path}
            if extra_form:
                form_data.update(extra_form)
            resp = await client.post(url, data=form_data)
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
    language: str = Form('english'),
    db: Session = Depends(get_db)
):
    # Save file to shared volume first
    from pathlib import Path
    import shutil
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("/app/backend/uploads/videos")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    import uuid
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    file_extension = Path(file.filename).suffix
    unique_filename = f"{timestamp}_{unique_id}{file_extension}"
    
    # Save file to shared volume
    file_path = upload_dir / unique_filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Verify file was saved successfully
    if not file_path.exists():
        raise HTTPException(status_code=500, detail="Failed to save file to shared volume")
    
    # Convert to path that feedback service can access
    feedback_service_path = f"/app/uploads/videos/{unique_filename}"
    
    print(f"Backend: Saved file to {file_path}")
    print(f"Backend: Sending path {feedback_service_path} to feedback service")
    
    # Call feedback service with file path
    url = f"{FEEDBACK_SERVICE_URL}/custom-feedback"
    try:
        async with httpx.AsyncClient(timeout=1000) as client:  # Increased timeout to 10 minutes for large files
            form_data = {
                "services": services, 
                "presentation_id": str(presentation_id), 
                "language": language,
                "file_path": feedback_service_path
            }
            resp = await client.post(url, data=form_data)
            
            # Check if response is successful
            if resp.status_code != 200:
                error_detail = f"Feedback service returned status {resp.status_code}"
                try:
                    error_data = resp.json()
                    if "error" in error_data:
                        error_detail = error_data["error"]
                except:
                    pass
                raise HTTPException(status_code=resp.status_code, detail=error_detail)
            
            feedback_data = resp.json()
            # Add used_criteria
            used_criteria = [s.strip() for s in services.split(",") if s.strip()]
            feedback_data["used_criteria"] = used_criteria
            # Store feedback in DB
            create_feedback(db, presentation_id, feedback_data)
            return JSONResponse(status_code=resp.status_code, content=feedback_data)
    except httpx.TimeoutException:
        # Clean up file if feedback service times out
        try:
            if file_path.exists():
                os.remove(file_path)
        except:
            pass
        raise HTTPException(status_code=408, detail="Feedback service request timed out. Please try again with a shorter video.")
    except Exception as e:
        # Clean up file if feedback service fails
        try:
            if file_path.exists():
                os.remove(file_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to contact feedback service: {str(e)}")


@router.get("/presentation/{presentation_id}/feedback")
def get_presentation_feedback(presentation_id: int, db: Session = Depends(get_db)):
    feedback = get_feedback_by_presentation_id(db, presentation_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found for this presentation.")
    return feedback.data 