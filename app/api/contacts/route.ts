import { NextResponse } from 'next/server';
import { searchContacts, SearchError } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';

  try {
    const contacts = await searchContacts(q);
    return NextResponse.json({ contacts });
  } catch (error) {
    const reason = error instanceof SearchError ? error.reason : 'search_failed';
    console.error(`contact search failed (${reason})`, error);
    return NextResponse.json({ error: reason }, { status: 500 });
  }
}
