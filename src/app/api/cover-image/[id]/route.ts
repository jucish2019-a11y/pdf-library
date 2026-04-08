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
  const ext = path.extname(fullPath).slice(1).toLowerCase();
  const mime =
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
    ext === 'gif' ? 'image/gif' :
    ext === 'webp' ? 'image/webp' :
    ext === 'svg' ? 'image/svg+xml' :
    'image/png';
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
