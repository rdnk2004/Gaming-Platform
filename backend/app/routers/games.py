from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List

from app.database import get_db
from app.models import Game

router = APIRouter(prefix="/games", tags=["Games"])


class GameResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    thumbnail_url: str
    is_multiplayer: bool
    max_players: int
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[GameResponse])
async def list_games(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Game))
    return result.scalars().all()


@router.get("/{slug}", response_model=GameResponse)
async def get_game(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Game).where(Game.slug == slug))
    game = result.scalar_one_or_none()
    if not game:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Game not found")
    return game
