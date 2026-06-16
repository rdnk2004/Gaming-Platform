from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.DATABASE_URL, echo=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed default games if table is empty
    from app.models import Game
    from sqlalchemy import select
    async with async_session() as session:
        async with session.begin():
            result = await session.execute(select(Game))
            if not result.scalars().first():
                initial_games = [
                    Game(
                        name="Snake",
                        slug="snake",
                        description="Classic snake with vector-based movement",
                        is_multiplayer=True,
                        max_players=2,
                        thumbnail_url="/images/snake.png"
                    ),
                    Game(
                        name="Tetris",
                        slug="tetris",
                        description="Stack blocks cyberpunk style",
                        is_multiplayer=False,
                        max_players=1,
                        thumbnail_url="/images/tetris.png"
                    ),
                    Game(
                        name="Pong",
                        slug="pong",
                        description="1v1 neon battles",
                        is_multiplayer=True,
                        max_players=2,
                        thumbnail_url="/images/pong.png"
                    )
                ]
                session.add_all(initial_games)
