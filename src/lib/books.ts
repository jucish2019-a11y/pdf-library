import db from '@/db';
import type { Book } from '@/types';

export function getBooks(filters: {
  status?: string;
  collection?: string;
  tag?: string;
  sort?: string;
  order?: string;
} = {}): Book[] {
  const { status, collection, tag, sort = 'date_added', order = 'desc' } = filters;
  const sortCol = ['date_added', 'title', 'author', 'date_updated'].includes(sort) ? sort : 'date_added';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  let query = `
    SELECT DISTINCT b.*
    FROM books b
    ${tag ? 'JOIN book_tags bt ON bt.book_id = b.id JOIN tags t ON t.id = bt.tag_id' : ''}
    ${collection ? 'JOIN book_collections bc ON bc.book_id = b.id' : ''}
    WHERE 1=1
    ${status ? 'AND b.status = ?' : ''}
    ${tag ? 'AND t.name = ?' : ''}
    ${collection ? 'AND bc.collection_id = ?' : ''}
    ORDER BY b.${sortCol} ${sortOrder}
  `;

  const params: string[] = [];
  if (status) params.push(status);
  if (tag) params.push(tag);
  if (collection) params.push(collection);

  const books = db.prepare(query).all(...params) as Book[];
  return books.map(enrichBook);
}

export function getBook(id: string): Book | null {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
  if (!book) return null;
  return enrichBook(book);
}

function enrichBook(book: Book): Book {
  const tags = db.prepare(`
    SELECT t.name FROM tags t
    JOIN book_tags bt ON bt.tag_id = t.id
    WHERE bt.book_id = ?
  `).all(book.id) as { name: string }[];

  const collections = db.prepare(`
    SELECT c.id, c.name, c.color FROM collections c
    JOIN book_collections bc ON bc.collection_id = c.id
    WHERE bc.book_id = ?
  `).all(book.id) as { id: string; name: string; color: string }[];

  return {
    ...book,
    tags: tags.map(t => t.name),
    collections,
  };
}

export function updateBook(id: string, data: Partial<Book> & { tags?: string[]; collections?: string[] }) {
  const now = Date.now();
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
  if (!book) return null;

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  const updatable = ['title', 'author', 'status', 'current_page', 'rating', 'notes'] as const;
  for (const field of updatable) {
    if (field in data && data[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(data[field] as string | number | null);
    }
  }

  if (fields.length > 0) {
    fields.push('date_updated = ?');
    values.push(now, id);
    db.prepare(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  // Update tags
  if (data.tags !== undefined) {
    db.prepare('DELETE FROM book_tags WHERE book_id = ?').run(id);
    for (const tagName of data.tags) {
      const trimmed = tagName.trim().toLowerCase();
      if (!trimmed) continue;
      let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(trimmed) as { id: string } | undefined;
      if (!tag) {
        const tagId = crypto.randomUUID();
        db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(tagId, trimmed);
        tag = { id: tagId };
      }
      db.prepare('INSERT OR IGNORE INTO book_tags (book_id, tag_id) VALUES (?, ?)').run(id, tag.id);
    }
  }

  // Update collections
  if (data.collections !== undefined) {
    db.prepare('DELETE FROM book_collections WHERE book_id = ?').run(id);
    for (const colId of data.collections) {
      db.prepare('INSERT OR IGNORE INTO book_collections (book_id, collection_id) VALUES (?, ?)').run(id, colId);
    }
  }

  return getBook(id);
}

export function deleteBook(id: string): boolean {
  const result = db.prepare('DELETE FROM books WHERE id = ?').run(id);
  return result.changes > 0;
}
