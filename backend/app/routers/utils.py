from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

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
