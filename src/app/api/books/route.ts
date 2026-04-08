import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { getBooks } from '@/lib/books';
import { saveBookFile, saveCover, type FileType } from '@/lib/file-store';
import { extractMeta } from '@/lib/pdf-meta';
import { extractEpubMeta } from '@/lib/epub-meta';

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

function detectType(file: File): FileType | null {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    file.type === 'application/epub+zip' ||
    file.type === 'application/epub' ||
    name.endsWith('.epub')
  ) return 'epub';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const fileType = detectType(file);
    if (!fileType) {
      return NextResponse.json({ error: 'Only PDF and EPUB files are supported' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = crypto.randomUUID();
    const filePath = saveBookFile(buffer, id, fileType);

    let title = '';
    let author = '';
    let pageCount = 0;
    let coverPath: string | null = null;

    if (fileType === 'pdf') {
      const meta = await extractMeta(buffer);
      title = meta.title;
      pageCount = meta.pageCount;
    } else {
      const meta = await extractEpubMeta(buffer);
      title = meta.title;
      author = meta.author;
      if (meta.coverBuffer && meta.coverExt) {
        coverPath = saveCover(meta.coverBuffer, id, meta.coverExt);
      }
    }

    const originalName = file.name.replace(/\.(pdf|epub)$/i, '');
    const bookTitle = title || originalName;

    const now = Date.now();
    db.prepare(`
      INSERT INTO books (id, title, author, filename, file_path, cover_path, file_type, page_count, date_added, date_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, bookTitle, author, file.name, filePath, coverPath, fileType, pageCount, now, now);

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    return NextResponse.json(book, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
