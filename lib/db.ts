import { neon } from '@neondatabase/serverless';
import type { Contact } from './types';

/** Why the list could not load - the UI names the fix for each. */
export type SearchFailure = 'not_configured' | 'not_seeded' | 'search_failed';

/** Discussion remarks are capped so one paste cannot fill the column. */
export const MAX_REMARKS_LENGTH = 2000;

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
function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new SearchError('not_configured');
  return neon(url);
}

/**
 * Remarks live in their own table, not a contacts column, because re-seeding
 * truncates contacts and would otherwise take everyone's notes with it.
 */
async function ensureRemarksTable(sql: ReturnType<typeof connect>): Promise<void> {
  await sql`
    create table if not exists contact_remarks (
      contact_id integer primary key,
      remarks text not null,
      updated_at timestamptz not null default now()
    )
  `;
}

export async function fetchAllContacts(): Promise<Contact[]> {
  const sql = connect();

  try {
    await ensureRemarksTable(sql);
    const rows = await sql`
      select c.id, c.name, c.company, c.designation, c.industry, c.requirement,
             c.is_priority, r.remarks
      from contacts c
      left join contact_remarks r on r.contact_id = c.id
      order by c.is_priority desc, c.company, c.name
    `;
    return rows as Contact[];
  } catch (error) {
    // 42P01 = undefined_table: connected fine, but the seed has not run yet.
    const code = (error as { code?: string })?.code;
    throw new SearchError(code === '42P01' ? 'not_seeded' : 'search_failed', error);
  }
}

/**
 * Upsert one contact's remarks. Clearing the box deletes the row rather than
 * storing an empty string, so a blank note leaves no trace.
 */
export async function saveRemarks(contactId: number, remarks: string): Promise<string | null> {
  const sql = connect();
  const text = remarks.trim().slice(0, MAX_REMARKS_LENGTH);

  try {
    await ensureRemarksTable(sql);

    if (text.length === 0) {
      await sql`delete from contact_remarks where contact_id = ${contactId}`;
      return null;
    }

    const rows = await sql`
      insert into contact_remarks (contact_id, remarks)
      values (${contactId}, ${text})
      on conflict (contact_id)
        do update set remarks = excluded.remarks, updated_at = now()
      returning remarks
    `;
    return (rows[0] as { remarks: string }).remarks;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    throw new SearchError(code === '42P01' ? 'not_seeded' : 'search_failed', error);
  }
}
