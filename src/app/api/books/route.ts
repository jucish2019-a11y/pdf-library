import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { getBooks } from '@/lib/books';
import { savePdf } from '@/lib/file-store';
import { extractMeta } from '@/lib/pdf-meta';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const books = getBooks({
    status: searchParams.get('status') || undefined,
    collection: searchParams.get('collection') || undefined,
    tag: searchParams.get('tag') || undefined,
    sort: searchParams.get('sort') || undefined,
    order: searchParams.get('order') || undefined,
  });
  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = crypto.randomUUID();
    const filePath = savePdf(buffer, id);
    const { pageCount, title } = await extractMeta(buffer);

    const originalName = file.name.replace(/\.pdf$/i, '');
    const bookTitle = title || originalName;

    const now = Date.now();
    db.prepare(`
      INSERT INTO books (id, title, author, filename, file_path, page_count, date_added, date_updated)
      VALUES (?, ?, '', ?, ?, ?, ?, ?)
    `).run(id, bookTitle, file.name, filePath, pageCount, now, now);

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    return NextResponse.json(book, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
