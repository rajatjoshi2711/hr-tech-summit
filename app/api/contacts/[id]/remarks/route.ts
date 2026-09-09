import { NextResponse } from 'next/server';
import { MAX_REMARKS_LENGTH, SearchError, saveRemarks } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const contactId = Number(id);
  if (!Number.isInteger(contactId) || contactId <= 0) {
    return NextResponse.json({ error: 'bad_contact' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const raw = (body as { remarks?: unknown }).remarks;
  if (typeof raw !== 'string' || raw.length > MAX_REMARKS_LENGTH * 2) {
    return NextResponse.json({ error: 'bad_remarks' }, { status: 400 });
  }

  try {
    const remarks = await saveRemarks(contactId, raw);
    return NextResponse.json({ remarks });
  } catch (error) {
    const reason = error instanceof SearchError ? error.reason : 'search_failed';
    console.error(`saving remarks failed (${reason})`, error);
    return NextResponse.json({ error: reason }, { status: 500 });
  }
}
