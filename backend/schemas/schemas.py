from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- Auth schemas ---


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class DeviceLoginRequest(BaseModel):
    device_id: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Habit schemas ---


class HabitCreateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    icon: str
    color: str


class HabitUpdateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    icon: str
    color: str



class HabitResponse(BaseModel):
    id: int
    name: str
    icon: str
    color: str
    created_at: datetime
    streak: int
    completed_today: bool
    last_7_days: list[bool] = []

    model_config = ConfigDict(from_attributes=True)


class StatsResponse(BaseModel):
    total_streak: int
    eco_points: int
    current_level: int
    level_title: str
    next_level_points: int
    completed_today_count: int
    total_habits_count: int
    max_streak: int
