import fs from 'fs';
import path from 'path';
import { UPLOADS_DIR, COVERS_DIR } from '@/db';

export function savePdf(buffer: Buffer, bookId: string): string {
  const filename = `${bookId}.pdf`;
  const fullPath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(fullPath, buffer);
  return `uploads/${filename}`;
}

export function deletePdf(filePath: string): void {
  try {
    const fullPath = path.join(process.cwd(), 'data', filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch {}
}

export function saveCover(buffer: Buffer, bookId: string): string {
  const filename = `${bookId}.png`;
  const fullPath = path.join(COVERS_DIR, filename);
  fs.writeFileSync(fullPath, buffer);
  return `covers/${filename}`;
}

export function deleteCover(coverPath: string | null): void {
  if (!coverPath) return;
  try {
    const fullPath = path.join(process.cwd(), 'data', coverPath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch {}
}

export function getPdfFullPath(filePath: string): string {
  return path.join(process.cwd(), 'data', filePath);
}
