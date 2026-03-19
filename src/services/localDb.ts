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

// ─── Completion by range ─────────────────────────────────────────────────────

export interface CompletionDataPoint {
  label: string;
  ratio: number;
}

export type TimeRange = 'week' | 'month' | 'year';

/**
 * Returns completion ratio data points for the given time range.
 * - week: 7 points (Mon–Sun of current week)
 * - month: N points (each day of current month)
 * - year: 12 points (each month of current year)
 */
export async function getCompletionByRange(range: TimeRange): Promise<CompletionDataPoint[]> {
  try {
    const db = await getDb();

    // Get total habit count
    const countRow = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM habits');
    const totalHabits = countRow?.cnt ?? 0;

    if (range === 'week') {
      return await getWeekData(db, totalHabits);
    } else if (range === 'month') {
      return await getMonthData(db, totalHabits);
    } else {
      return await getYearData(db, totalHabits);
    }
  } catch (e) {
    console.warn('getCompletionByRange error:', e);
    return [];
  }
}

async function getWeekData(db: SQLite.SQLiteDatabase, totalHabits: number): Promise<CompletionDataPoint[]> {
  const today = new Date();
  // Get Monday of current week (ISO: Monday = 1)
  const day = today.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);

  const points: CompletionDataPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayIndex = (i + 1).toString(); // 1=Mon .. 7=Sun as label placeholder
    const ratio = totalHabits === 0 ? 0 : await getDayRatio(db, dateStr, totalHabits);
    points.push({ label: dayIndex, ratio });
  }
  return points;
}

async function getMonthData(db: SQLite.SQLiteDatabase, totalHabits: number): Promise<CompletionDataPoint[]> {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const rows = await db.getAllAsync<{ date: string; completed_count: number }>(
    `SELECT dl.date, COUNT(CASE WHEN dl.completed = 1 THEN 1 END) as completed_count
     FROM daily_logs dl
     WHERE dl.date BETWEEN ? AND ?
     GROUP BY dl.date
     ORDER BY dl.date ASC`,
    startDate, endDate,
  );

  const completedMap = new Map(rows.map(r => [r.date, r.completed_count]));

  const points: CompletionDataPoint[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const completed = completedMap.get(dateStr) ?? 0;
    const ratio = totalHabits === 0 ? 0 : completed / totalHabits;
    points.push({ label: String(d), ratio });
  }
  return points;
}

async function getYearData(db: SQLite.SQLiteDatabase, totalHabits: number): Promise<CompletionDataPoint[]> {
  const year = new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const rows = await db.getAllAsync<{ month: string; avg_ratio: number }>(
    `SELECT substr(dl.date, 1, 7) as month,
            AVG(CAST(completed_count AS REAL) / ?) as avg_ratio
     FROM (
       SELECT date, COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_count
       FROM daily_logs
       WHERE date BETWEEN ? AND ?
       GROUP BY date
     ) dl
     GROUP BY substr(dl.date, 1, 7)
     ORDER BY month ASC`,
    totalHabits > 0 ? totalHabits : 1, startDate, endDate,
  );

  const ratioMap = new Map(rows.map(r => [r.month, r.avg_ratio]));

  const points: CompletionDataPoint[] = [];
  for (let m = 1; m <= 12; m++) {
    const monthKey = `${year}-${String(m).padStart(2, '0')}`;
    const ratio = ratioMap.get(monthKey) ?? 0;
    points.push({ label: String(m), ratio });
  }
  return points;
}

async function getDayRatio(db: SQLite.SQLiteDatabase, dateStr: string, totalHabits: number): Promise<number> {
  const row = await db.getFirstAsync<{ completed_count: number }>(
    `SELECT COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_count
     FROM daily_logs WHERE date = ?`,
    dateStr,
  );
  return (row?.completed_count ?? 0) / totalHabits;
}

