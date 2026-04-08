import { NextRequest, NextResponse } from 'next/server';
import { getBook, updateBook, deleteBook } from '@/lib/books';
import { deleteBookFile, deleteCover } from '@/lib/file-store';
import db from '@/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const book = getBook(params.id);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(book);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const book = updateBook(params.id, body);
    if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(book);
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const book = db.prepare('SELECT file_path, cover_path FROM books WHERE id = ?').get(params.id) as
    | { file_path: string; cover_path: string | null }
    | undefined;

  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const deleted = deleteBook(params.id);
  if (deleted) {
    deleteBookFile(book.file_path);
    deleteCover(book.cover_path);
  }
  return NextResponse.json({ ok: true });
}
