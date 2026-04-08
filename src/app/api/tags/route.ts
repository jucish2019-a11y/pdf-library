import { NextResponse } from 'next/server';
import db from '@/db';

export async function GET() {
  const tags = db.prepare(`
    SELECT t.id, t.name, COUNT(bt.book_id) as count
    FROM tags t
    LEFT JOIN book_tags bt ON bt.tag_id = t.id
    GROUP BY t.id
    ORDER BY count DESC, t.name ASC
  `).all();
  return NextResponse.json(tags);
}
