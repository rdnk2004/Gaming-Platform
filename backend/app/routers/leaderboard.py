from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel
from typing import List

from app.database import get_db
from app.models import Score, User, Game
from app.routers.auth import get_current_user

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


# Schemas
class ScoreSubmit(BaseModel):
    game_slug: str
    score: int
    duration_seconds: int = None


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    avatar_url: str
    score: int
    level: int
    
    class Config:
        from_attributes = True


# Routes
@router.post("/submit")
async def submit_score(
    score_data: ScoreSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find game
    result = await db.execute(select(Game).where(Game.slug == score_data.game_slug))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Create score
    score = Score(
        user_id=current_user.id,
        game_id=game.id,
        score=score_data.score,
        duration_seconds=score_data.duration_seconds
    )
    db.add(score)
    
    # Award XP (10 XP per 100 points)
    xp_earned = score_data.score // 10
    current_user.xp += xp_earned
    
    # Level up check (every 1000 XP)
    new_level = (current_user.xp // 1000) + 1
    if new_level > current_user.level:
        current_user.level = new_level
    
    await db.commit()
    
    return {
        "message": "Score submitted",
        "xp_earned": xp_earned,
        "total_xp": current_user.xp,
        "level": current_user.level
    }


@router.get("/{game_slug}", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    game_slug: str,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    # Find game
    result = await db.execute(select(Game).where(Game.slug == game_slug))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Get top scores (best score per user)
    subquery = (
        select(
            Score.user_id,
            func.max(Score.score).label("best_score")
        )
        .where(Score.game_id == game.id)
        .group_by(Score.user_id)
        .subquery()
    )
    
    result = await db.execute(
        select(User, subquery.c.best_score)
        .join(subquery, User.id == subquery.c.user_id)
        .order_by(desc(subquery.c.best_score))
        .limit(limit)
    )
    
    leaderboard = []
    for rank, (user, best_score) in enumerate(result.all(), 1):
        leaderboard.append(LeaderboardEntry(
            rank=rank,
            username=user.username,
            avatar_url=user.avatar_url,
            score=best_score,
            level=user.level
        ))
    
    return leaderboard


@router.get("/{game_slug}/me")
async def get_my_rank(
    game_slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find game
    result = await db.execute(select(Game).where(Game.slug == game_slug))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Get user's best score
    result = await db.execute(
        select(func.max(Score.score))
        .where(Score.user_id == current_user.id, Score.game_id == game.id)
    )
    best_score = result.scalar()
    
    if not best_score:
        return {"rank": None, "best_score": 0, "message": "No scores yet"}
    
    # Count how many users have higher scores
    result = await db.execute(
        select(func.count())
        .select_from(
            select(Score.user_id, func.max(Score.score).label("best"))
            .where(Score.game_id == game.id)
            .group_by(Score.user_id)
            .having(func.max(Score.score) > best_score)
            .subquery()
        )
    )
    rank = result.scalar() + 1
    
    return {"rank": rank, "best_score": best_score}
