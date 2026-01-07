from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:rdnk@2004@localhost:5432/game_db"
    
    # JWT Auth
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Redis (for leaderboards)
    REDIS_URL: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
