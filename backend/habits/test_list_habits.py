"""Unit tests for GET /habits endpoint.

Validates: Requirements 7.1, 7.2, 7.3
"""

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker

from backend.database import Base, get_db
from backend.models.models import DailyLog, Habit, User
from backend.auth import _hash_password, _create_token
from backend.main import app


@pytest.fixture()
def db_session():
    """Create an in-memory SQLite database shared across threads."""
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
    """FastAPI test client with overridden DB dependency."""

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def user(db_session):
    """Create a test user and return it."""
    u = User(email="test@example.com", hashed_password=_hash_password("password123"))
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture()
def auth_header(user):
    """Return Authorization header with a valid JWT for the test user."""
    token = _create_token(user.id)
    return {"Authorization": f"Bearer {token}"}


class TestGetHabits:
    """Tests for GET /habits endpoint."""

    def test_returns_401_without_token(self, client):
        """Req 7.3: Request without JWT returns 401."""
        response = client.get("/habits")
        assert response.status_code in (401, 403)

    def test_returns_401_with_invalid_token(self, client):
        """Req 7.3: Request with invalid JWT returns 401."""
        response = client.get("/habits", headers={"Authorization": "Bearer invalid-token"})
        assert response.status_code == 401

    def test_returns_empty_list_when_no_habits(self, client, auth_header):
        """Req 7.1: Authenticated user with no habits gets empty list."""
        response = client.get("/habits", headers=auth_header)
        assert response.status_code == 200
        assert response.json() == []

    def test_returns_habits_with_streak_and_completed_today(
        self, client, auth_header, user, db_session
    ):
        """Req 7.1, 7.2: Returns habits with streak and completed_today computed."""
        habit = Habit(name="Exercise", icon="🏃", color="#2ECC71", user_id=user.id)
        db_session.add(habit)
        db_session.commit()
        db_session.refresh(habit)

        today = date.today()
        for i in range(3):
            db_session.add(
                DailyLog(habit_id=habit.id, date=today - timedelta(days=i), completed=True)
            )
        db_session.commit()

        response = client.get("/habits", headers=auth_header)
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == habit.id
        assert data[0]["name"] == "Exercise"
        assert data[0]["streak"] == 3
        assert data[0]["completed_today"] is True

    def test_completed_today_false_when_not_checked(
        self, client, auth_header, user, db_session
    ):
        """Req 7.2: completed_today is False when no DailyLog for today."""
        habit = Habit(name="Read", icon="📖", color="#3498DB", user_id=user.id)
        db_session.add(habit)
        db_session.commit()

        response = client.get("/habits", headers=auth_header)
        data = response.json()
        assert len(data) == 1
        assert data[0]["completed_today"] is False
        assert data[0]["streak"] == 0

    def test_does_not_return_other_users_habits(
        self, client, auth_header, user, db_session
    ):
        """Req 7.1: Only returns habits belonging to the authenticated user."""
        other_user = User(
            email="other@example.com", hashed_password=_hash_password("pass")
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        db_session.add(
            Habit(name="Other Habit", icon="🔥", color="#E74C3C", user_id=other_user.id)
        )
        db_session.add(
            Habit(name="My Habit", icon="✅", color="#2ECC71", user_id=user.id)
        )
        db_session.commit()

        response = client.get("/habits", headers=auth_header)
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "My Habit"
