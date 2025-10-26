import os

if __name__ == "__main__":
    from app.main import app
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on 0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
