import * as SQLite from 'expo-sqlite';

const DB_NAME = 'ecohabit.db';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync(DB_NAME);
    await _db.execAsync('PRAGMA journal_mode = WAL;');
    await _db.execAsync('PRAGMA foreign_keys = ON;');
  }
  return _db;
}

export async function initLocalDb(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '🌿',
      color TEXT NOT NULL DEFAULT '#2ECC71',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE(habit_id, date)
    );
  `);
}

// ─── Habit CRUD ──────────────────────────────────────────────────────────────

export interface HabitRow {
  id: number;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export async function getAllHabits(): Promise<HabitRow[]> {
  const db = await getDb();
  return db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY id ASC');
}

export async function createHabit(name: string, icon: string, color: string): Promise<HabitRow> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO habits (name, icon, color) VALUES (?, ?, ?)',
    name, icon, color,
  );
  const row = await db.getFirstAsync<HabitRow>('SELECT * FROM habits WHERE id = ?', result.lastInsertRowId);
  return row!;
}

export async function updateHabit(id: number, name: string, icon: string, color: string): Promise<HabitRow> {
  const db = await getDb();
  await db.runAsync('UPDATE habits SET name = ?, icon = ?, color = ? WHERE id = ?', name, icon, color, id);
  const row = await db.getFirstAsync<HabitRow>('SELECT * FROM habits WHERE id = ?', id);
  return row!;
}

export async function deleteHabit(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM habits WHERE id = ?', id);
}


// ─── Check / Uncheck ─────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function checkHabitToday(habitId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO daily_logs (habit_id, date, completed) VALUES (?, ?, 1)
     ON CONFLICT(habit_id, date) DO UPDATE SET completed = 1`,
    habitId, todayStr(),
  );
}

export async function uncheckHabitToday(habitId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO daily_logs (habit_id, date, completed) VALUES (?, ?, 0)
     ON CONFLICT(habit_id, date) DO UPDATE SET completed = 0`,
    habitId, todayStr(),
  );
}

// ─── Streak calculation ──────────────────────────────────────────────────────

export async function getStreak(habitId: number): Promise<number> {
  const db = await getDb();
  const today = todayStr();

  // Get all completed dates for this habit, ordered descending
  const logs = await db.getAllAsync<{ date: string }>(
    `SELECT date FROM daily_logs
     WHERE habit_id = ? AND completed = 1
     ORDER BY date DESC`,
    habitId,
  );

  if (logs.length === 0) return 0;

  const dateSet = new Set(logs.map((l) => l.date));

  // Start counting from today or yesterday
  let current = new Date(today);
  if (!dateSet.has(today)) {
    // Check yesterday
    current.setDate(current.getDate() - 1);
    const yesterday = current.toISOString().slice(0, 10);
    if (!dateSet.has(yesterday)) return 0;
  }

  let streak = 0;
  while (dateSet.has(current.toISOString().slice(0, 10))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

// ─── Last 7 days ─────────────────────────────────────────────────────────────

export async function getLast7Days(habitId: number): Promise<boolean[]> {
  const db = await getDb();
  const today = new Date();
  const result: boolean[] = [];

  // Build array from 6 days ago to today (index 0 = oldest, index 6 = today)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const log = await db.getFirstAsync<{ completed: number }>(
      'SELECT completed FROM daily_logs WHERE habit_id = ? AND date = ?',
      habitId, dateStr,
    );
    result.push(log?.completed === 1);
  }

  return result;
}

// ─── Completed today check ───────────────────────────────────────────────────

export async function isCompletedToday(habitId: number): Promise<boolean> {
  const db = await getDb();
  const log = await db.getFirstAsync<{ completed: number }>(
    'SELECT completed FROM daily_logs WHERE habit_id = ? AND date = ?',
    habitId, todayStr(),
  );
  return log?.completed === 1;
}

// ─── Full habit data with computed fields ────────────────────────────────────

export interface FullHabit {
  id: number;
  name: string;
  icon: string;
  color: string;
  created_at: string;
  streak: number;
  completed_today: boolean;
  last_7_days: boolean[];
}

export async function getFullHabits(): Promise<FullHabit[]> {
  const habits = await getAllHabits();
  const result: FullHabit[] = [];

  for (const h of habits) {
    const [streak, completed_today, last_7_days] = await Promise.all([
      getStreak(h.id),
      isCompletedToday(h.id),
      getLast7Days(h.id),
    ]);
    result.push({ ...h, streak, completed_today, last_7_days });
  }

  return result;
}
