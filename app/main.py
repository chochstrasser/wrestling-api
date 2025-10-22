from fastapi import FastAPI
from app.routers import rankings, user

app = FastAPI(title="Wrestling Data API - Paid Version")

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Wrestling Data API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": "/api/v1"
    }

app.include_router(rankings.router, prefix="/api/v1")
app.include_router(user.router, prefix="/api/v1")
