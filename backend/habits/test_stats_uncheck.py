"""Unit tests for GET /habits/stats, POST /habits/{id}/uncheck, and last_7_days.

Validates: Requirements 15.1, 15.2, 15.3, 3.4
"""

from datetime import date, timedelta

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


def _create_habit(db_session, user, name="Exercise", icon="🏃", color="#2ECC71"):
    """Helper to create a habit for the test user."""
    h = Habit(name=name, icon=icon, color=color, user_id=user.id)
    db_session.add(h)
    db_session.commit()
    db_session.refresh(h)
    return h


def _add_log(db_session, habit_id, day_offset=0, completed=True):
    """Helper to add a DailyLog relative to today. offset=0 means today, 1 means yesterday."""
    log = DailyLog(
        habit_id=habit_id,
        date=date.today() - timedelta(days=day_offset),
        completed=completed,
    )
    db_session.add(log)
    db_session.commit()
    return log


# ---------------------------------------------------------------------------
# GET /habits/stats
# ---------------------------------------------------------------------------


class TestGetStats:
    """Tests for GET /habits/stats endpoint.

    Validates: Requirements 15.1, 15.2, 15.3
    """

    def test_returns_zero_values_when_no_habits(self, client, auth_header):
        """Req 15.3: No habits → all numeric fields are zero, level 1 Eco Seedling."""
        response = client.get("/habits/stats", headers=auth_header)
        assert response.status_code == 200
        data = response.json()
        assert data["total_streak"] == 0
        assert data["eco_points"] == 0
        assert data["current_level"] == 1
        assert data["level_title"] == "Eco Seedling"
        assert data["next_level_points"] == 100
        assert data["completed_today_count"] == 0
        assert data["total_habits_count"] == 0
        assert data["max_streak"] == 0

    def test_single_habit_completed_today_only(self, client, auth_header, user, db_session):
        """Req 15.1, 15.2: One habit completed today → streak 1, eco_points = 1*50 + 1*20 = 70."""
        habit = _create_habit(db_session, user)
        _add_log(db_session, habit.id, day_offset=0)

        response = client.get("/habits/stats", headers=auth_header)
        assert response.status_code == 200
        data = response.json()
        assert data["total_streak"] == 1
        assert data["max_streak"] == 1
        assert data["completed_today_count"] == 1
        assert data["total_habits_count"] == 1
        # eco_points = (1 * 50) + (1 * 20) = 70
        assert data["eco_points"] == 70
        # level = floor(70 / 100) + 1 = 1
        assert data["current_level"] == 1
        assert data["level_title"] == "Eco Seedling"
        # next_level_points = (1 * 100) - 70 = 30
        assert data["next_level_points"] == 30

    def test_multiple_habits_various_streaks(self, client, auth_header, user, db_session):
        """Req 15.1, 15.2: Multiple habits with different streaks compute correctly."""
        h1 = _create_habit(db_session, user, name="Exercise")
        h2 = _create_habit(db_session, user, name="Read")

        # h1: 3-day streak (today, yesterday, day before)
        for i in range(3):
            _add_log(db_session, h1.id, day_offset=i)

        # h2: 1-day streak (today only)
        _add_log(db_session, h2.id, day_offset=0)

        response = client.get("/habits/stats", headers=auth_header)
        data = response.json()

        assert data["total_streak"] == 4  # 3 + 1
        assert data["max_streak"] == 3
        assert data["completed_today_count"] == 2
        assert data["total_habits_count"] == 2
        # eco_points = (4 * 50) + (2 * 20) = 240
        assert data["eco_points"] == 240
        # level = floor(240 / 100) + 1 = 3
        assert data["current_level"] == 3
        assert data["level_title"] == "Eco Seedling"
        # next_level_points = (3 * 100) - 240 = 60
        assert data["next_level_points"] == 60

    def test_habit_not_completed_today(self, client, auth_header, user, db_session):
        """Req 15.2: Habit with streak from yesterday but not today still counts streak."""
        habit = _create_habit(db_session, user)
        # Yesterday and day before completed, but not today
        _add_log(db_session, habit.id, day_offset=1)
        _add_log(db_session, habit.id, day_offset=2)

        response = client.get("/habits/stats", headers=auth_header)
        data = response.json()

        assert data["total_streak"] == 2
        assert data["max_streak"] == 2
        assert data["completed_today_count"] == 0
        # eco_points = (2 * 50) + (0 * 20) = 100
        assert data["eco_points"] == 100
        # level = floor(100 / 100) + 1 = 2
        assert data["current_level"] == 2

    def test_stats_level_title_eco_sprout(self, client, auth_header, user, db_session):
        """Req 15.2: Level 5-9 should return 'Eco Sprout' title."""
        # Need eco_points such that floor(eco_points / 100) + 1 is in [5, 9]
        # level 5 → eco_points in [400, 499]
        # We need total_streak * 50 + completed_today * 20 = ~450
        # 8 habits each with 1-day streak completed today: 8*50 + 8*20 = 560 → level 6
        for i in range(8):
            h = _create_habit(db_session, user, name=f"Habit{i}")
            _add_log(db_session, h.id, day_offset=0)

        response = client.get("/habits/stats", headers=auth_header)
        data = response.json()
        # eco_points = (8 * 50) + (8 * 20) = 560
        assert data["eco_points"] == 560
        # level = floor(560 / 100) + 1 = 6
        assert data["current_level"] == 6
        assert data["level_title"] == "Eco Sprout"

    def test_stats_requires_authentication(self, client):
        """Stats endpoint requires a valid JWT."""
        response = client.get("/habits/stats")
        assert response.status_code in (401, 403)

    def test_stats_response_has_all_fields(self, client, auth_header):
        """Req 15.1: Response includes all required fields."""
        response = client.get("/habits/stats", headers=auth_header)
        data = response.json()
        required_fields = [
            "total_streak", "eco_points", "current_level", "level_title",
            "next_level_points", "completed_today_count", "total_habits_count", "max_streak",
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"


# ---------------------------------------------------------------------------
# POST /habits/{id}/uncheck
# ---------------------------------------------------------------------------


class TestUncheckHabit:
    """Tests for POST /habits/{id}/uncheck endpoint.

    Validates: Requirement 3.4
    """

    def test_uncheck_sets_completed_false(self, client, auth_header, user, db_session):
        """Req 3.4: Unchecking a checked habit sets completed=False for today."""
        habit = _create_habit(db_session, user)
        _add_log(db_session, habit.id, day_offset=0, completed=True)

        response = client.post(f"/habits/{habit.id}/uncheck", headers=auth_header)
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

        log = (
            db_session.query(DailyLog)
            .filter(DailyLog.habit_id == habit.id, DailyLog.date == date.today())
            .first()
        )
        assert log is not None
        assert log.completed is False

    def test_uncheck_when_no_log_exists(self, client, auth_header, user, db_session):
        """Req 3.4: Unchecking when no log exists returns 200 (no-op)."""
        habit = _create_habit(db_session, user)

        response = client.post(f"/habits/{habit.id}/uncheck", headers=auth_header)
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_uncheck_idempotent(self, client, auth_header, user, db_session):
        """Req 3.4: Unchecking twice doesn't cause errors."""
        habit = _create_habit(db_session, user)
        _add_log(db_session, habit.id, day_offset=0, completed=True)

        client.post(f"/habits/{habit.id}/uncheck", headers=auth_header)
        response = client.post(f"/habits/{habit.id}/uncheck", headers=auth_header)
        assert response.status_code == 200

        log = (
            db_session.query(DailyLog)
            .filter(DailyLog.habit_id == habit.id, DailyLog.date == date.today())
            .first()
        )
        assert log.completed is False

    def test_uncheck_returns_404_for_nonexistent_habit(self, client, auth_header):
        """Uncheck returns 404 when habit doesn't exist."""
        response = client.post("/habits/99999/uncheck", headers=auth_header)
        assert response.status_code == 404

    def test_uncheck_returns_403_for_other_users_habit(self, client, auth_header, db_session):
        """Uncheck returns 403 when habit belongs to another user."""
        other = User(email="other@example.com", hashed_password=_hash_password("pass"))
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        other_habit = Habit(name="Other", icon="🔥", color="#E74C3C", user_id=other.id)
        db_session.add(other_habit)
        db_session.commit()
        db_session.refresh(other_habit)

        response = client.post(f"/habits/{other_habit.id}/uncheck", headers=auth_header)
        assert response.status_code == 403

    def test_uncheck_requires_authentication(self, client):
        """Uncheck endpoint requires a valid JWT."""
        response = client.post("/habits/1/uncheck")
        assert response.status_code in (401, 403)

    def test_check_then_uncheck_toggles(self, client, auth_header, user, db_session):
        """Req 3.4: Check then uncheck correctly toggles completion status."""
        habit = _create_habit(db_session, user)

        # Check
        client.post(f"/habits/{habit.id}/check", headers=auth_header)
        log = (
            db_session.query(DailyLog)
            .filter(DailyLog.habit_id == habit.id, DailyLog.date == date.today())
            .first()
        )
        assert log.completed is True

        # Uncheck
        client.post(f"/habits/{habit.id}/uncheck", headers=auth_header)
        db_session.refresh(log)
        assert log.completed is False


# ---------------------------------------------------------------------------
# GET /habits — last_7_days array
# ---------------------------------------------------------------------------


class TestLast7Days:
    """Tests for last_7_days array in GET /habits response.

    Validates: Requirement 5.3
    """

    def test_all_false_when_no_logs(self, client, auth_header, user, db_session):
        """No logs → last_7_days is all False."""
        _create_habit(db_session, user)

        response = client.get("/habits", headers=auth_header)
        data = response.json()
        assert data[0]["last_7_days"] == [False] * 7

    def test_today_only_completed(self, client, auth_header, user, db_session):
        """Only today completed → index 0 is True, rest False."""
        habit = _create_habit(db_session, user)
        _add_log(db_session, habit.id, day_offset=0)

        response = client.get("/habits", headers=auth_header)
        data = response.json()
        expected = [True, False, False, False, False, False, False]
        assert data[0]["last_7_days"] == expected

    def test_all_7_days_completed(self, client, auth_header, user, db_session):
        """All 7 days completed → all True."""
        habit = _create_habit(db_session, user)
        for i in range(7):
            _add_log(db_session, habit.id, day_offset=i)

        response = client.get("/habits", headers=auth_header)
        data = response.json()
        assert data[0]["last_7_days"] == [True] * 7

    def test_alternating_days(self, client, auth_header, user, db_session):
        """Alternating completed days are reflected correctly."""
        habit = _create_habit(db_session, user)
        # Complete today (0), day-before-yesterday (2), 4 days ago (4), 6 days ago (6)
        for offset in [0, 2, 4, 6]:
            _add_log(db_session, habit.id, day_offset=offset)

        response = client.get("/habits", headers=auth_header)
        data = response.json()
        expected = [True, False, True, False, True, False, True]
        assert data[0]["last_7_days"] == expected

    def test_old_logs_outside_7_days_excluded(self, client, auth_header, user, db_session):
        """Logs older than 7 days don't appear in last_7_days."""
        habit = _create_habit(db_session, user)
        # Only a log from 8 days ago
        _add_log(db_session, habit.id, day_offset=8)

        response = client.get("/habits", headers=auth_header)
        data = response.json()
        assert data[0]["last_7_days"] == [False] * 7

    def test_uncompleted_log_not_counted(self, client, auth_header, user, db_session):
        """A log with completed=False should show as False in last_7_days."""
        habit = _create_habit(db_session, user)
        _add_log(db_session, habit.id, day_offset=0, completed=False)
        _add_log(db_session, habit.id, day_offset=1, completed=True)

        response = client.get("/habits", headers=auth_header)
        data = response.json()
        expected = [False, True, False, False, False, False, False]
        assert data[0]["last_7_days"] == expected
