"""Seed script: inserts a test user and 3 sample habits.

Idempotent — safe to run multiple times without duplicating data.
"""

import bcrypt
from backend.database import SessionLocal, init_db
from backend.models.models import User, Habit

TEST_EMAIL = "test@ecohabit.com"
TEST_PASSWORD = "password123"

SAMPLE_HABITS = [
    {"name": "Beber Agua", "icon": "💧", "color": "#3498DB"},
    {"name": "Ejercicio", "icon": "🏃", "color": "#2ECC71"},
    {"name": "Programar", "icon": "💻", "color": "#9B59B6"},
]


def seed():
    init_db()
    db = SessionLocal()
    try:
        # Create test user if not exists
        user = db.query(User).filter(User.email == TEST_EMAIL).first()
        if not user:
            hashed = bcrypt.hashpw(TEST_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            user = User(email=TEST_EMAIL, hashed_password=hashed)
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created test user: {TEST_EMAIL}")
        else:
            print(f"Test user already exists: {TEST_EMAIL}")

        # Insert sample habits if they don't exist for this user
        existing_names = {
            h.name for h in db.query(Habit).filter(Habit.user_id == user.id).all()
        }
        for habit_data in SAMPLE_HABITS:
            if habit_data["name"] not in existing_names:
                habit = Habit(user_id=user.id, **habit_data)
                db.add(habit)
                print(f"Created habit: {habit_data['name']}")
            else:
                print(f"Habit already exists: {habit_data['name']}")

        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
