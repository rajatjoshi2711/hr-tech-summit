import { neon } from '@neondatabase/serverless';
import type { Contact } from './types';

const MAX_QUERY_LENGTH = 80;
const RESULT_LIMIT = 50;

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add the Neon integration on the Vercel project.');
  }
  return neon(url);
}

/** Escape the LIKE wildcards so a typed % or _ matches literally. */
function escapeLike(value: string): string {
  return value.replace(/([\%_])/g, '\$1');
}

export async function searchContacts(rawQuery: string): Promise<Contact[]> {
  const sql = client();
  const q = escapeLike(rawQuery.trim().slice(0, MAX_QUERY_LENGTH));

  if (q.length === 0) {
    const rows = await sql`
      select id, name, company, designation, industry, requirement, is_priority
      from contacts
      order by is_priority desc, company, name
      limit ${RESULT_LIMIT}
    `;
    return rows as Contact[];
  }

  const contains = `%${q}%`;
  const prefix = `${q}%`;

  const rows = await sql`
    select id, name, company, designation, industry, requirement, is_priority
    from contacts
    where name ilike ${contains} escape '\'
       or company ilike ${contains} escape '\'
    order by
      is_priority desc,
      case when company ilike ${prefix} escape '\'
             or name ilike ${prefix} escape '\' then 0 else 1 end,
      company, name
    limit ${RESULT_LIMIT}
  `;
  return rows as Contact[];
}
