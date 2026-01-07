from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import auth, games, leaderboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    await init_db()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="Cyberpunk Game Center",
    description="Retro games with a cyberpunk twist",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(games.router)
app.include_router(leaderboard.router)


@app.get("/")
async def root():
    return {"message": "Welcome to Cyberpunk Game Center", "status": "online"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
