from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ..database.database import engine, Base
from .routers import users
import datetime

app = FastAPI()

# CORS settings
origins = [
    "http://localhost:3000",   # When accessing from browser
    "http://frontend:3000",    # When accessed from other containers
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# Include your routers
app.include_router(users.router)

@app.get("/")
def home():
    return {"message": "FastAPI with PostgreSQL"}

@app.get("/message/")
async def get_message():
    return {
        "message": "Hello from the FastAPI backend!",
        "timestamp": str(datetime.datetime.now())
    }

@app.get("/test-cors")
async def test_cors():
    return {"status": "CORS test successful"}
