import { NextResponse } from 'next/server';
import { fetchAllContacts, SearchError } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** Hands the client the full list in one response; searching happens there. */
export async function GET() {
  try {
    const contacts = await fetchAllContacts();
    return NextResponse.json({ contacts });
  } catch (error) {
    const reason = error instanceof SearchError ? error.reason : 'search_failed';
    console.error(`loading the contact list failed (${reason})`, error);
    return NextResponse.json({ error: reason }, { status: 500 });
  }
}
