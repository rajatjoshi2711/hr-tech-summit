import { neon } from '@neondatabase/serverless';
import type { Contact } from './types';

/** Why the list could not load - the UI names the fix for each. */
export type SearchFailure = 'not_configured' | 'not_seeded' | 'search_failed';

export class SearchError extends Error {
  constructor(readonly reason: SearchFailure, cause?: unknown) {
    super(reason, { cause });
  }
}

/**
 * The whole list, once. It is 251 rows, so the client holds it in memory and
 * searches it there - no request per keystroke, and search keeps working if the
 * connection drops after the page has loaded.
 */
export async function fetchAllContacts(): Promise<Contact[]> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new SearchError('not_configured');

  const sql = neon(url);

  try {
    const rows = await sql`
      select id, name, company, designation, industry, requirement, is_priority
      from contacts
      order by is_priority desc, company, name
    `;
    return rows as Contact[];
  } catch (error) {
    // 42P01 = undefined_table: connected fine, but the seed has not run yet.
    const code = (error as { code?: string })?.code;
    throw new SearchError(code === '42P01' ? 'not_seeded' : 'search_failed', error);
  }
}
