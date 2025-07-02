from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx
import os
from backend.database.database import get_db
from backend.app.utils.redis_dependency import get_redis_client
from backend.app.utils.redis_client import RedisClient

router = APIRouter(tags=["utilities"])


@router.get("/api/routes")
async def list_routes(request: Request):
    """List all registered routes in this FastAPI application"""
    app = request.app
    
    routes = []
    for route in app.routes:
        if hasattr(route, "methods"):
            methods = list(route.methods) if route.methods else ["GET"]
        else:
            methods = ["GET"]
            
        route_info = {
            "path": getattr(route, "path", str(route)),
            "name": getattr(route, "name", ""),
            "methods": methods
        }
        routes.append(route_info)
    return {"routes": routes}


@router.get("/", include_in_schema=False)
async def root():
    """Redirect root to API documentation"""
    return RedirectResponse(url="/docs")


# AI Service Router
ai_router = APIRouter(prefix="/ai", tags=["ai-service"])

@ai_router.post("/analyze")
async def analyze_with_ai(
    data: dict,
    db: Session = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client)
):
    """
    Send data to AI service for analysis
    """
    try:
        ai_service_url = os.getenv("AI_SERVICE_URL", "http://presentation-analyzer:8000")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ai_service_url}/analyze",
                json=data,
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"AI service error: {response.text}"
                )
                
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"AI service unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@ai_router.get("/health")
async def ai_service_health():
    """
    Check AI service health
    """
    try:
        ai_service_url = os.getenv("AI_SERVICE_URL", "http://presentation-analyzer:8000")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{ai_service_url}/health",
                timeout=5.0
            )
            
            return {
                "ai_service_status": "healthy" if response.status_code == 200 else "unhealthy",
                "ai_service_response": response.json() if response.status_code == 200 else None
            }
                
    except Exception as e:
        return {
            "ai_service_status": "unavailable",
            "error": str(e)
        }
