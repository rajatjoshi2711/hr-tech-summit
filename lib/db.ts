import { neon } from '@neondatabase/serverless';
import type { Contact } from './types';

const MAX_QUERY_LENGTH = 80;
const RESULT_LIMIT = 50;

/** Why a search could not run - the UI names the fix for each. */
export type SearchFailure = 'not_configured' | 'not_seeded' | 'search_failed';

export class SearchError extends Error {
  constructor(readonly reason: SearchFailure, cause?: unknown) {
    super(reason, { cause });
  }
}

export async function searchContacts(rawQuery: string): Promise<Contact[]> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new SearchError('not_configured');

  const sql = neon(url);
  // strpos and starts_with take the needle literally, so a typed % or _ has no
  // wildcard meaning and there is no LIKE escape clause to get wrong.
  const q = rawQuery.trim().slice(0, MAX_QUERY_LENGTH).toLowerCase();

  try {
    if (q.length === 0) {
      const rows = await sql`
        select id, name, company, designation, industry, requirement, is_priority
        from contacts
        order by is_priority desc, company, name
        limit ${RESULT_LIMIT}
      `;
      return rows as Contact[];
    }

    const rows = await sql`
      select id, name, company, designation, industry, requirement, is_priority
      from contacts
      where strpos(lower(name), ${q}) > 0
         or strpos(lower(company), ${q}) > 0
      order by
        is_priority desc,
        case when starts_with(lower(company), ${q})
               or starts_with(lower(name), ${q}) then 0 else 1 end,
        company, name
      limit ${RESULT_LIMIT}
    `;
    return rows as Contact[];
  } catch (error) {
    // 42P01 = undefined_table: connected fine, but the seed has not run yet.
    const code = (error as { code?: string })?.code;
    throw new SearchError(code === '42P01' ? 'not_seeded' : 'search_failed', error);
  }
}
