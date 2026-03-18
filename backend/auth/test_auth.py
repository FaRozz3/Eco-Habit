"""Unit tests for the authentication module.

Validates: Requirements 4.1, 4.2, 4.3, 5.1, 5.2
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app


@pytest.fixture()
def client():
    """Create a TestClient backed by an in-memory SQLite database."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine)

    def _override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def _signup(client: TestClient, email="user@example.com", password="secret123"):
    return client.post("/auth/signup", json={"email": email, "password": password})


# ---------------------------------------------------------------------------
# Signup tests — Req 4.1, 4.2, 4.3
# ---------------------------------------------------------------------------


class TestSignup:
    """POST /auth/signup"""

    def test_signup_valid_email_returns_201_with_token(self, client):
        """Req 4.1: valid email + password → 201 with access_token."""
        resp = _signup(client)
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_signup_duplicate_email_returns_409(self, client):
        """Req 1.2: duplicate email → 409."""
        _signup(client, email="dup@example.com")
        resp = _signup(client, email="dup@example.com")
        assert resp.status_code == 409

    def test_signup_invalid_email_returns_422(self, client):
        """Req 4.2: malformed email → 422."""
        resp = client.post("/auth/signup", json={"email": "not-an-email", "password": "secret123"})
        assert resp.status_code == 422

    def test_signup_empty_password_returns_422(self, client):
        """Req 4.3: empty password → 422."""
        resp = client.post("/auth/signup", json={"email": "user@example.com", "password": ""})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Login tests — Req 5.1, 5.2
# ---------------------------------------------------------------------------


class TestLogin:
    """POST /auth/login"""

    def test_login_valid_credentials_returns_200_with_token(self, client):
        """Req 5.1: correct credentials → 200 with JWT."""
        _signup(client, email="login@example.com", password="pass123")
        resp = client.post("/auth/login", json={"email": "login@example.com", "password": "pass123"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password_returns_401(self, client):
        """Req 5.2: wrong password → 401."""
        _signup(client, email="login@example.com", password="correct")
        resp = client.post("/auth/login", json={"email": "login@example.com", "password": "wrong"})
        assert resp.status_code == 401

    def test_login_nonexistent_user_returns_401(self, client):
        """Req 5.2: user does not exist → 401."""
        resp = client.post("/auth/login", json={"email": "nobody@example.com", "password": "pass"})
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# get_current_user tests — Req 7.3, 5.3
# ---------------------------------------------------------------------------


class TestGetCurrentUser:
    """Authorization via get_current_user dependency (tested through GET /habits)."""

    def test_valid_token_grants_access(self, client):
        """Valid JWT → 200 on a protected route."""
        token = _signup(client).json()["access_token"]
        resp = client.get("/habits", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200

    def test_missing_token_returns_error(self, client):
        """No Authorization header → rejected (401)."""
        resp = client.get("/habits")
        assert resp.status_code == 401

    def test_invalid_token_returns_401(self, client):
        """Garbage token → 401."""
        resp = client.get("/habits", headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status_code == 401
