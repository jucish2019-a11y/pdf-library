import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import db from '@/db';
import { getPdfFullPath } from '@/lib/file-store';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const book = db.prepare('SELECT file_path FROM books WHERE id = ?').get(params.id) as
    | { file_path: string }
    | undefined;

  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const fullPath = getPdfFullPath(book.file_path);
  if (!fs.existsSync(fullPath)) return NextResponse.json({ error: 'File missing' }, { status: 404 });

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const rangeHeader = req.headers.get('range');

  if (rangeHeader) {
    const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(fullPath, { start, end });
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', chunk => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', err => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
      },
    });
  }

  const stream = fs.createReadStream(fullPath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on('data', chunk => controller.enqueue(chunk));
      stream.on('end', () => controller.close());
      stream.on('error', err => controller.error(err));
    },
  });

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Accept-Ranges': 'bytes',
      'Content-Length': String(fileSize),
    },
  });
}
