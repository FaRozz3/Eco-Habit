"""Streak calculation for habits."""

from datetime import date, timedelta

from sqlalchemy import and_
from sqlalchemy.orm import Session

from backend.models.models import DailyLog


def calculate_streak(db: Session, habit_id: int, reference_date: date) -> int:
    """Calculate the consecutive-day streak for a habit.

    Counts backwards from *reference_date* the number of consecutive days
    that have a DailyLog with ``completed=True``.

    Returns 0 when neither *reference_date* nor the day before it has a
    completed log (Requirement 6.2).

    Args:
        db: Active SQLAlchemy session.
        habit_id: The habit whose streak is being calculated.
        reference_date: The date to start counting backwards from.

    Returns:
        The streak length (>= 0).
    """

    logs = (
        db.query(DailyLog)
        .filter(
            and_(
                DailyLog.habit_id == habit_id,
                DailyLog.date <= reference_date,
                DailyLog.completed == True,  # noqa: E712
            )
        )
        .order_by(DailyLog.date.desc())
        .all()
    )

    if not logs:
        return 0

    completed_dates = {log.date for log in logs}

    # Requirement 6.2: if neither today nor yesterday is completed → 0
    today = reference_date
    yesterday = reference_date - timedelta(days=1)
    if today not in completed_dates and yesterday not in completed_dates:
        return 0

    # Determine the starting point for counting.
    # If today is completed, start from today; otherwise start from yesterday.
    if today in completed_dates:
        current = today
    else:
        current = yesterday

    streak = 0
    while current in completed_dates:
        streak += 1
        current -= timedelta(days=1)

    return streak
