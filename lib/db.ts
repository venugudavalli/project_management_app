import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'kanban.db');
    db = new Database(dbPath);
    initializeTables();
  }
  return db;
}

function initializeTables() {
  const database = db!;
  
  // Create tables if they don't exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      cardIds TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      notes TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS board (
      columnOrder TEXT NOT NULL
    );
  `);
}

export { getDatabase };
