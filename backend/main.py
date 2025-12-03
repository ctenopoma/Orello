from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI()

# Allow CORS for local development with Electron
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World", "From": "Python Backend"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    # Use a specific port, e.g., 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)
