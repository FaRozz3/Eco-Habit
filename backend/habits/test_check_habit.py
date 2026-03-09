"""Unit tests for POST /habits/{id}/check endpoint.

Validates: Requirements 8.1, 8.2, 8.3
"""

from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker

from backend.auth import _create_token, _hash_password
from backend.database import Base, get_db
from backend.main import app
from backend.models.models import DailyLog, Habit, User


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def user(db_session):
    u = User(email="test@example.com", hashed_password=_hash_password("password123"))
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture()
def auth_header(user):
    token = _create_token(user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def habit(db_session, user):
    h = Habit(name="Exercise", icon="🏃", color="#2ECC71", user_id=user.id)
    db_session.add(h)
    db_session.commit()
    db_session.refresh(h)
    return h


class TestCheckHabit:
    """Tests for POST /habits/{id}/check endpoint."""

    def test_check_creates_daily_log(self, client, auth_header, habit, db_session):
        """Req 8.1: Creates a DailyLog with completed=True for today."""
        response = client.post(f"/habits/{habit.id}/check", headers=auth_header)
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

        log = (
            db_session.query(DailyLog)
            .filter(DailyLog.habit_id == habit.id, DailyLog.date == date.today())
            .first()
        )
        assert log is not None
        assert log.completed is True

    def test_check_updates_existing_daily_log(self, client, auth_header, habit, db_session):
        """Req 8.1: Updates existing DailyLog to completed=True."""
        existing = DailyLog(habit_id=habit.id, date=date.today(), completed=False)
        db_session.add(existing)
        db_session.commit()

        response = client.post(f"/habits/{habit.id}/check", headers=auth_header)
        assert response.status_code == 200

        db_session.refresh(existing)
        assert existing.completed is True

    def test_check_idempotent(self, client, auth_header, habit, db_session):
        """Req 8.1: Checking twice doesn't create duplicate logs."""
        client.post(f"/habits/{habit.id}/check", headers=auth_header)
        client.post(f"/habits/{habit.id}/check", headers=auth_header)

        logs = (
            db_session.query(DailyLog)
            .filter(DailyLog.habit_id == habit.id, DailyLog.date == date.today())
            .all()
        )
        assert len(logs) == 1
        assert logs[0].completed is True

    def test_returns_403_for_other_users_habit(self, client, auth_header, db_session):
        """Req 8.2: Returns 403 when habit belongs to another user."""
        other = User(email="other@example.com", hashed_password=_hash_password("pass"))
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        other_habit = Habit(name="Other", icon="🔥", color="#E74C3C", user_id=other.id)
        db_session.add(other_habit)
        db_session.commit()
        db_session.refresh(other_habit)

        response = client.post(f"/habits/{other_habit.id}/check", headers=auth_header)
        assert response.status_code == 403

    def test_returns_404_for_nonexistent_habit(self, client, auth_header):
        """Req 8.3: Returns 404 when habit doesn't exist."""
        response = client.post("/habits/99999/check", headers=auth_header)
        assert response.status_code == 404

    def test_returns_401_without_token(self, client):
        """Check endpoint requires authentication."""
        response = client.post("/habits/1/check")
        assert response.status_code in (401, 403)
