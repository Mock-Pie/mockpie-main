from fastapi import FastAPI
from .database import engine, Base
from .routers import users

app = FastAPI()

# Initialize the database tables
Base.metadata.create_all(bind=engine)

app.include_router(users.router)

@app.get("/")
def home():
    return {"message": "FastAPI with PostgreSQL"}