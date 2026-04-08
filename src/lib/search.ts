import db from '@/db';
import type { Book } from '@/types';

export function searchBooks(query: string, filters: {
  tag?: string;
  status?: string;
  collection?: string;
} = {}): Book[] {
  const { tag, status, collection } = filters;

  let books: Book[];

  if (query.trim()) {
    // FTS search
    books = db.prepare(`
      SELECT b.* FROM books b
      JOIN books_fts ON books.rowid = books_fts.rowid
      WHERE books_fts MATCH ?
      ORDER BY rank
    `).all(`${query.trim()}*`) as Book[];
  } else {
    books = db.prepare('SELECT * FROM books ORDER BY date_added DESC').all() as Book[];
  }

  // Apply filters
  if (status) books = books.filter(b => b.status === status);

  if (tag) {
    const taggedIds = new Set(
      (db.prepare(`
        SELECT bt.book_id FROM book_tags bt
        JOIN tags t ON t.id = bt.tag_id
        WHERE t.name = ?
      `).all(tag) as { book_id: string }[]).map(r => r.book_id)
    );
    books = books.filter(b => taggedIds.has(b.id));
  }

  if (collection) {
    const colIds = new Set(
      (db.prepare('SELECT book_id FROM book_collections WHERE collection_id = ?').all(collection) as { book_id: string }[]).map(r => r.book_id)
    );
    books = books.filter(b => colIds.has(b.id));
  }

  return books;
}
