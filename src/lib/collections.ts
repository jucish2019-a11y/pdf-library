import db from '@/db';
import type { Collection } from '@/types';

export function getCollections(): Collection[] {
  return db.prepare(`
    SELECT c.*, COUNT(bc.book_id) as book_count
    FROM collections c
    LEFT JOIN book_collections bc ON bc.collection_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at ASC
  `).all() as Collection[];
}

export function getCollection(id: string): Collection | null {
  return db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as Collection | null;
}

export function createCollection(data: { name: string; description?: string; color?: string }): Collection {
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    'INSERT INTO collections (id, name, description, color, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, data.name, data.description || '', data.color || '#6366f1', now);
  return getCollection(id)!;
}

export function updateCollection(id: string, data: { name?: string; description?: string; color?: string }): Collection | null {
  const fields: string[] = [];
  const values: string[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }
  if (!fields.length) return getCollection(id);
  values.push(id);
  db.prepare(`UPDATE collections SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getCollection(id);
}

export function deleteCollection(id: string): boolean {
  const result = db.prepare('DELETE FROM collections WHERE id = ?').run(id);
  return result.changes > 0;
}
