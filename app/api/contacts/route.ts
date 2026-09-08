import { NextResponse } from 'next/server';
import { searchContacts } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';

  try {
    const contacts = await searchContacts(q);
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('contact search failed', error);
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}
