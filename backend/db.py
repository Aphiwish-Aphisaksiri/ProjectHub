import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

_pool = None

async def get_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(os.getenv("DATABASE_URL"))
    return _pool

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None