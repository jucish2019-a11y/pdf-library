import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import db from '@/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const book = db.prepare('SELECT cover_path FROM books WHERE id = ?').get(params.id) as
    | { cover_path: string | null }
    | undefined;

  if (!book?.cover_path) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const fullPath = path.join(process.cwd(), 'data', book.cover_path);
  if (!fs.existsSync(fullPath)) return NextResponse.json({ error: 'File missing' }, { status: 404 });

  const buffer = fs.readFileSync(fullPath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
