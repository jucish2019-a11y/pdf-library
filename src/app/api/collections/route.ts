import { NextRequest, NextResponse } from 'next/server';
import { getCollections, createCollection } from '@/lib/collections';

export async function GET() {
  return NextResponse.json(getCollections());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    const col = createCollection(body);
    return NextResponse.json(col, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
