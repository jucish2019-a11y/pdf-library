import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { saveCover } from '@/lib/file-store';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const bookId = form.get('bookId') as string | null;
    const image = form.get('image') as File | null;

    if (!bookId || !image) {
      return NextResponse.json({ error: 'Missing bookId or image' }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const coverPath = saveCover(buffer, bookId);

    db.prepare('UPDATE books SET cover_path = ?, date_updated = ? WHERE id = ?').run(
      coverPath,
      Date.now(),
      bookId
    );

    return NextResponse.json({ cover_path: coverPath });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to save cover' }, { status: 500 });
  }
}
