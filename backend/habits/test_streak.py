"""Unit tests for calculate_streak."""

from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base
from backend.models.models import DailyLog, Habit, User
from backend.habits.streak import calculate_streak


@pytest.fixture()
def db():
    """Create an in-memory SQLite database for each test."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture()
def habit(db):
    """Insert a user and habit, return the habit."""
    user = User(email="test@example.com", hashed_password="hashed")
    db.add(user)
    db.flush()
    h = Habit(name="Exercise", icon="🏃", color="#2ECC71", user_id=user.id)
    db.add(h)
    db.flush()
    return h


TODAY = date(2025, 7, 10)


class TestCalculateStreak:
    """Tests for calculate_streak covering requirements 6.1, 6.2, 6.3."""

    def test_no_logs_returns_zero(self, db, habit):
        """Req 6.2: No completed logs at all → streak 0."""
        assert calculate_streak(db, habit.id, TODAY) == 0

    def test_today_completed_only(self, db, habit):
        """Req 6.3: Only today completed → streak 1."""
        db.add(DailyLog(habit_id=habit.id, date=TODAY, completed=True))
        db.flush()
        assert calculate_streak(db, habit.id, TODAY) == 1

    def test_consecutive_days(self, db, habit):
        """Req 6.1/6.3: 5 consecutive days ending today → streak 5."""
        for i in range(5):
            db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=i), completed=True))
        db.flush()
        assert calculate_streak(db, habit.id, TODAY) == 5

    def test_gap_breaks_streak(self, db, habit):
        """Req 6.1: Gap in the middle breaks the streak."""
        # Today, yesterday completed; day before yesterday NOT; 3 days ago completed
        db.add(DailyLog(habit_id=habit.id, date=TODAY, completed=True))
        db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=1), completed=True))
        # skip day -2
        db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=3), completed=True))
        db.flush()
        assert calculate_streak(db, habit.id, TODAY) == 2

    def test_yesterday_completed_today_not(self, db, habit):
        """Req 6.2: Yesterday completed but today not → streak counts from yesterday."""
        for i in range(1, 4):  # yesterday, day before, day before that
            db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=i), completed=True))
        db.flush()
        assert calculate_streak(db, habit.id, TODAY) == 3

    def test_neither_today_nor_yesterday_returns_zero(self, db, habit):
        """Req 6.2: No log today or yesterday, even if older logs exist → streak 0."""
        db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=2), completed=True))
        db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=3), completed=True))
        db.flush()
        assert calculate_streak(db, habit.id, TODAY) == 0

    def test_completed_false_not_counted(self, db, habit):
        """Logs with completed=False should not count toward the streak."""
        db.add(DailyLog(habit_id=habit.id, date=TODAY, completed=False))
        db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=1), completed=True))
        db.flush()
        # Today is not completed, yesterday is → streak starts from yesterday = 1
        assert calculate_streak(db, habit.id, TODAY) == 1

    def test_multiple_segments_with_gap(self, db, habit):
        """Req 6.1: Two completed segments separated by a gap — only the recent segment counts."""
        # Recent segment: today and yesterday (2 days)
        db.add(DailyLog(habit_id=habit.id, date=TODAY, completed=True))
        db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=1), completed=True))
        # Gap at day -2
        # Older segment: days -3, -4, -5
        for i in range(3, 6):
            db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=i), completed=True))
        db.flush()
        assert calculate_streak(db, habit.id, TODAY) == 2

    def test_only_old_completed_logs(self, db, habit):
        """Req 6.2: Completed logs exist but none recent → streak 0."""
        db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=10), completed=True))
        db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=11), completed=True))
        db.flush()
        assert calculate_streak(db, habit.id, TODAY) == 0

    def test_multiple_segments_with_gap(self, db, habit):
        """Req 6.1: Two completed segments separated by a gap — only the recent segment counts."""
        # Recent segment: today and yesterday (2 days)
        db.add(DailyLog(habit_id=habit.id, date=TODAY, completed=True))
        db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=1), completed=True))
        # Gap at day -2
        # Older segment: days -3, -4, -5
        for i in range(3, 6):
            db.add(DailyLog(habit_id=habit.id, date=TODAY - timedelta(days=i), completed=True))
        db.flush()
        assert calculate_streak(db, habit.id, TODAY) == 2

