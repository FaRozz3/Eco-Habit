"""Habits module — CRUD endpoints for user habits."""

import math
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.habits.streak import calculate_streak
from backend.models.models import DailyLog, Habit, User
from backend.schemas.schemas import HabitCreateRequest, HabitUpdateRequest, HabitResponse, StatsResponse

router = APIRouter(prefix="/habits", tags=["habits"])


def _level_title(level: int) -> str:
    if level >= 50:
        return "Eco Master"
    if level >= 35:
        return "Eco Legend"
    if level >= 20:
        return "Eco Ranger"
    if level >= 10:
        return "Eco Guardian"
    if level >= 5:
        return "Eco Sprout"
    return "Eco Seedling"


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return aggregated statistics for the authenticated user."""
    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()
    today = date.today()

    if not habits:
        return StatsResponse(
            total_streak=0,
            eco_points=0,
            current_level=1,
            level_title="Eco Seedling",
            next_level_points=100,
            completed_today_count=0,
            total_habits_count=0,
            max_streak=0,
        )

    streaks = []
    completed_today_count = 0
    for habit in habits:
        streak = calculate_streak(db, habit.id, today)
        streaks.append(streak)
        is_done = (
            db.query(DailyLog)
            .filter(
                DailyLog.habit_id == habit.id,
                DailyLog.date == today,
                DailyLog.completed == True,  # noqa: E712
            )
            .first()
            is not None
        )
        if is_done:
            completed_today_count += 1

    total_streak = sum(streaks)
    max_streak = max(streaks)
    eco_points = (total_streak * 50) + (completed_today_count * 20)
    current_level = math.floor(eco_points / 100) + 1
    next_level_points = (current_level * 100) - eco_points

    return StatsResponse(
        total_streak=total_streak,
        eco_points=eco_points,
        current_level=current_level,
        level_title=_level_title(current_level),
        next_level_points=next_level_points,
        completed_today_count=completed_today_count,
        total_habits_count=len(habits),
        max_streak=max_streak,
    )


@router.get("", response_model=list[HabitResponse])
def list_habits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all habits for the authenticated user with streak, completed_today, and last_7_days."""
    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()
    today = date.today()

    result = []
    for habit in habits:
        streak = calculate_streak(db, habit.id, today)
        completed_today = (
            db.query(DailyLog)
            .filter(
                DailyLog.habit_id == habit.id,
                DailyLog.date == today,
                DailyLog.completed == True,  # noqa: E712
            )
            .first()
            is not None
        )

        # Build last 7 days: index 0 = today, index 6 = 6 days ago
        week_start = today - timedelta(days=6)
        logs = (
            db.query(DailyLog)
            .filter(
                DailyLog.habit_id == habit.id,
                DailyLog.date >= week_start,
                DailyLog.date <= today,
                DailyLog.completed == True,  # noqa: E712
            )
            .all()
        )
        completed_dates = {log.date for log in logs}
        last_7_days = [
            (today - timedelta(days=i)) in completed_dates for i in range(7)
        ]

        result.append(
            HabitResponse(
                id=habit.id,
                name=habit.name,
                icon=habit.icon,
                color=habit.color,
                created_at=habit.created_at,
                streak=streak,
                completed_today=completed_today,
                last_7_days=last_7_days,
            )
        )

    return result

@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(
    body: HabitCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new habit for the authenticated user."""
    habit = Habit(
        name=body.name,
        icon=body.icon,
        color=body.color,
        user_id=current_user.id,
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)

    return HabitResponse(
        id=habit.id,
        name=habit.name,
        icon=habit.icon,
        color=habit.color,
        created_at=habit.created_at,
        streak=0,
        completed_today=False,
        last_7_days=[False] * 7,
    )


@router.post("/{habit_id}/check")
def check_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a habit as completed for today."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found")
    if habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    today = date.today()
    daily_log = (
        db.query(DailyLog)
        .filter(DailyLog.habit_id == habit_id, DailyLog.date == today)
        .first()
    )
    if daily_log is not None:
        daily_log.completed = True
    else:
        daily_log = DailyLog(habit_id=habit_id, date=today, completed=True)
        db.add(daily_log)

    db.commit()
    return {"status": "ok"}

@router.post("/{habit_id}/uncheck")
def uncheck_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Uncheck a habit for today (mark as not completed)."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found")
    if habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    today = date.today()
    daily_log = (
        db.query(DailyLog)
        .filter(DailyLog.habit_id == habit_id, DailyLog.date == today)
        .first()
    )
    if daily_log is not None:
        daily_log.completed = False
        db.commit()

    return {"status": "ok"}


@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(
    habit_id: int,
    body: HabitUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the name, icon, and color of an existing habit."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found")
    if habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    habit.name = body.name
    habit.icon = body.icon
    habit.color = body.color
    db.commit()
    db.refresh(habit)

    today = date.today()
    streak = calculate_streak(db, habit.id, today)
    completed_today = (
        db.query(DailyLog)
        .filter(DailyLog.habit_id == habit.id, DailyLog.date == today, DailyLog.completed == True)  # noqa: E712
        .first()
    ) is not None

    week_start = today - timedelta(days=6)
    logs = (
        db.query(DailyLog)
        .filter(
            DailyLog.habit_id == habit.id,
            DailyLog.date >= week_start,
            DailyLog.date <= today,
            DailyLog.completed == True,  # noqa: E712
        )
        .all()
    )
    completed_dates = {log.date for log in logs}
    last_7_days = [
        (today - timedelta(days=i)) in completed_dates for i in range(7)
    ]

    return HabitResponse(
        id=habit.id,
        name=habit.name,
        icon=habit.icon,
        color=habit.color,
        created_at=habit.created_at,
        streak=streak,
        completed_today=completed_today,
        last_7_days=last_7_days,
    )


@router.delete("/{habit_id}", status_code=204)
def delete_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete a habit and all its daily logs."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found")
    if habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    db.delete(habit)
    db.commit()
