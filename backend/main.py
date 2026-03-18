from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import backend.models  # noqa: F401 — register models with Base.metadata
from backend.auth import router as auth_router
from backend.database import init_db
from backend.habits import router as habits_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database on startup."""
    init_db()
    yield


app = FastAPI(title="EcoHabit API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(habits_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
