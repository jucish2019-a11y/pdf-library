import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const COVERS_DIR = path.join(DATA_DIR, 'covers');
const DB_PATH = path.join(DATA_DIR, 'library.db');

// Ensure data directories exist
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(COVERS_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('busy_timeout = 10000');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
// Migrate legacy schemas that predate file_type column
const bookCols = db.prepare(`PRAGMA table_info(books)`).all() as { name: string }[];
if (bookCols.length > 0 && !bookCols.some(c => c.name === 'file_type')) {
  db.exec(`ALTER TABLE books ADD COLUMN file_type TEXT NOT NULL DEFAULT 'pdf'`);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    cover_path TEXT,
    status TEXT NOT NULL DEFAULT 'to-read'
      CHECK(status IN ('to-read', 'reading', 'read')),
    file_type TEXT NOT NULL DEFAULT 'pdf'
      CHECK(file_type IN ('pdf', 'epub')),
    page_count INTEGER NOT NULL DEFAULT 0,
    current_page INTEGER NOT NULL DEFAULT 0,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    notes TEXT NOT NULL DEFAULT '',
    date_added INTEGER NOT NULL,
    date_updated INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS book_tags (
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    tag_id  TEXT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (book_id, tag_id)
  );

  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS book_collections (
    book_id       TEXT NOT NULL REFERENCES books(id)       ON DELETE CASCADE,
    collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (book_id, collection_id)
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS books_fts USING fts5(
    title, author, notes,
    content=books,
    content_rowid=rowid
  );

  CREATE TRIGGER IF NOT EXISTS books_ai AFTER INSERT ON books BEGIN
    INSERT INTO books_fts(rowid, title, author, notes)
    VALUES (new.rowid, new.title, new.author, new.notes);
  END;

  CREATE TRIGGER IF NOT EXISTS books_ad AFTER DELETE ON books BEGIN
    INSERT INTO books_fts(books_fts, rowid, title, author, notes)
    VALUES ('delete', old.rowid, old.title, old.author, old.notes);
  END;

  CREATE TRIGGER IF NOT EXISTS books_au AFTER UPDATE ON books BEGIN
    INSERT INTO books_fts(books_fts, rowid, title, author, notes)
    VALUES ('delete', old.rowid, old.title, old.author, old.notes);
    INSERT INTO books_fts(rowid, title, author, notes)
    VALUES (new.rowid, new.title, new.author, new.notes);
  END;
`);

export default db;
export { UPLOADS_DIR, COVERS_DIR };
