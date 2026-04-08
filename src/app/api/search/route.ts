import { NextRequest, NextResponse } from 'next/server';
import { searchBooks } from '@/lib/search';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || undefined;
  const status = searchParams.get('status') || undefined;
  const collection = searchParams.get('collection') || undefined;

  const results = searchBooks(q, { tag, status, collection });
  return NextResponse.json(results);
}
