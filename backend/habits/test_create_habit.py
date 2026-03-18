"""Unit tests for POST /habits endpoint.

Validates: Requirements 9.1, 9.2
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker

from backend.auth import _create_token, _hash_password
from backend.database import Base, get_db
from backend.main import app
from backend.models.models import Habit, User


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


class TestCreateHabit:
    """Tests for POST /habits endpoint."""

    def test_creates_habit_with_valid_data(self, client, auth_header, user, db_session):
        """Req 9.1: Valid POST /habits creates habit and returns 201."""
        payload = {"name": "Meditar", "icon": "🧘", "color": "#2ECC71"}
        response = client.post("/habits", json=payload, headers=auth_header)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Meditar"
        assert data["icon"] == "🧘"
        assert data["color"] == "#2ECC71"
        assert data["streak"] == 0
        assert data["completed_today"] is False
        assert "id" in data
        assert "created_at" in data

        # Verify persisted in DB
        habit = db_session.query(Habit).filter(Habit.id == data["id"]).first()
        assert habit is not None
        assert habit.user_id == user.id

    def test_rejects_empty_name(self, client, auth_header):
        """Req 9.2: POST /habits with empty name returns 422."""
        payload = {"name": "", "icon": "🧘", "color": "#2ECC71"}
        response = client.post("/habits", json=payload, headers=auth_header)
        assert response.status_code == 422

    def test_requires_authentication(self, client):
        """POST /habits without JWT returns 401."""
        payload = {"name": "Meditar", "icon": "🧘", "color": "#2ECC71"}
        response = client.post("/habits", json=payload)
        assert response.status_code in (401, 403)

    def test_rejects_missing_name_field(self, client, auth_header):
        """POST /habits without name field returns 422."""
        payload = {"icon": "🧘", "color": "#2ECC71"}
        response = client.post("/habits", json=payload, headers=auth_header)
        assert response.status_code == 422
