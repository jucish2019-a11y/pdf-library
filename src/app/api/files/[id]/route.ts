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
  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: 'File missing' }, { status: 404 });
  }

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const rangeHeader = req.headers.get('range');

  if (rangeHeader) {
    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const buffer = Buffer.alloc(chunkSize);
      const fd = fs.openSync(fullPath, 'r');
      fs.readSync(fd, buffer, 0, chunkSize, start);
      fs.closeSync(fd);

      return new NextResponse(new Uint8Array(buffer), {
        status: 206,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Disposition': 'inline',
        },
      });
    }
  }

  const buffer = fs.readFileSync(fullPath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Accept-Ranges': 'bytes',
      'Content-Length': String(fileSize),
    },
  });
}
