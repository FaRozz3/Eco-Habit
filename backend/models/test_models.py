"""Unit tests for data models (User, Habit, DailyLog).

Validates: Requirements 1.1, 1.2, 2.2, 3.2
"""

from datetime import date

import pytest
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from backend.database import Base
from backend.models.models import DailyLog, Habit, User


@pytest.fixture()
def db():
    """Create an in-memory SQLite database with foreign key enforcement."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Enable foreign key enforcement for SQLite (required for CASCADE)
    from sqlalchemy import event

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def _make_user(db, email="user@example.com"):
    """Helper to create and persist a User."""
    u = User(email=email, hashed_password="hashed_pw")
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _make_habit(db, user_id, name="Read"):
    """Helper to create and persist a Habit."""
    h = Habit(name=name, icon="📖", color="#3498DB", user_id=user_id)
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


class TestUserUniqueEmail:
    """Req 1.1, 1.2: email column must be unique."""

    def test_duplicate_email_raises_integrity_error(self, db):
        _make_user(db, email="dup@example.com")
        with pytest.raises(IntegrityError):
            _make_user(db, email="dup@example.com")

    def test_different_emails_allowed(self, db):
        u1 = _make_user(db, email="a@example.com")
        u2 = _make_user(db, email="b@example.com")
        assert u1.id != u2.id


class TestCascadeDeleteHabit:
    """Req 2.2: Deleting a User cascades to their Habits."""

    def test_deleting_user_removes_habits(self, db):
        user = _make_user(db)
        _make_habit(db, user.id, name="Habit1")
        _make_habit(db, user.id, name="Habit2")
        assert db.query(Habit).filter(Habit.user_id == user.id).count() == 2

        db.delete(user)
        db.commit()

        assert db.query(Habit).count() == 0

    def test_deleting_user_removes_daily_logs(self, db):
        user = _make_user(db)
        habit = _make_habit(db, user.id)
        db.add(DailyLog(habit_id=habit.id, date=date(2025, 1, 1), completed=True))
        db.commit()
        assert db.query(DailyLog).count() == 1

        db.delete(user)
        db.commit()

        assert db.query(Habit).count() == 0
        assert db.query(DailyLog).count() == 0


class TestDailyLogUniqueConstraint:
    """Req 3.2: (habit_id, date) must be unique in DailyLog."""

    def test_duplicate_habit_date_raises_integrity_error(self, db):
        user = _make_user(db)
        habit = _make_habit(db, user.id)
        db.add(DailyLog(habit_id=habit.id, date=date(2025, 7, 10), completed=True))
        db.commit()

        with pytest.raises(IntegrityError):
            db.add(DailyLog(habit_id=habit.id, date=date(2025, 7, 10), completed=False))
            db.commit()

    def test_same_habit_different_dates_allowed(self, db):
        user = _make_user(db)
        habit = _make_habit(db, user.id)
        db.add(DailyLog(habit_id=habit.id, date=date(2025, 7, 10), completed=True))
        db.add(DailyLog(habit_id=habit.id, date=date(2025, 7, 11), completed=True))
        db.commit()

        assert db.query(DailyLog).filter(DailyLog.habit_id == habit.id).count() == 2

    def test_different_habits_same_date_allowed(self, db):
        user = _make_user(db)
        h1 = _make_habit(db, user.id, name="Habit A")
        h2 = _make_habit(db, user.id, name="Habit B")
        db.add(DailyLog(habit_id=h1.id, date=date(2025, 7, 10), completed=True))
        db.add(DailyLog(habit_id=h2.id, date=date(2025, 7, 10), completed=True))
        db.commit()

        assert db.query(DailyLog).filter(DailyLog.date == date(2025, 7, 10)).count() == 2
