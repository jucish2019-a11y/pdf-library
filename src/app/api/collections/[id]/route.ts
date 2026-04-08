import { NextRequest, NextResponse } from 'next/server';
import { getCollection, updateCollection, deleteCollection } from '@/lib/collections';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const col = getCollection(params.id);
  if (!col) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(col);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const col = updateCollection(params.id, body);
    if (!col) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(col);
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ok = deleteCollection(params.id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
