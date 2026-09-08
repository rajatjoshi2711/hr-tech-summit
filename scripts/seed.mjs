// Reads UBS Data.xlsx and loads it into the Neon `contacts` table.
// The yellow fill on the Company cell (column B) marks a priority target.
//
//   node scripts/seed.mjs [path/to/UBS Data.xlsx]

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import ExcelJS from 'exceljs';
import { neon } from '@neondatabase/serverless';

const HIGHLIGHT_ARGB = 'FFFFFF00';
const EXPECTED_ROWS = 251;
const EXPECTED_PRIORITY = 67;

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const workbookPath = args.find((a) => !a.startsWith('--')) ?? path.join(here, '..', 'UBS Data.xlsx');

function text(cell) {
  const value = cell?.value;
  if (value === null || value === undefined) return null;
  const asString = typeof value === 'object' && 'text' in value ? value.text : String(value);
  const trimmed = asString.trim();
  return trimmed === '' ? null : trimmed;
}

function isHighlighted(cell) {
  const fill = cell?.fill;
  return fill?.type === 'pattern'
    && fill.pattern === 'solid'
    && String(fill.fgColor?.argb ?? '').toUpperCase() === HIGHLIGHT_ARGB;
}

async function readContacts() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  const sheet = workbook.worksheets[0];

  const contacts = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const name = text(row.getCell(1));
    const company = text(row.getCell(2));
    if (!name || !company) return;

    contacts.push({
      name,
      company,
      designation: text(row.getCell(3)) ?? '',
      industry: text(row.getCell(4)),
      requirement: text(row.getCell(5)),
      isPriority: isHighlighted(row.getCell(2)),
    });
  });
  return contacts;
}

async function main() {
  if (!dryRun && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Put it in .env.local or export it first.');
  }

  const contacts = await readContacts();
  const priorityCount = contacts.filter((c) => c.isPriority).length;
  console.log(`Read ${contacts.length} contacts, ${priorityCount} priority from ${workbookPath}`);

  if (contacts.length !== EXPECTED_ROWS || priorityCount !== EXPECTED_PRIORITY) {
    throw new Error(
      `Unexpected shape: expected ${EXPECTED_ROWS} contacts and ${EXPECTED_PRIORITY} priority, ` +
      `got ${contacts.length} and ${priorityCount}. Check the spreadsheet before seeding.`
    );
  }

  if (dryRun) {
    console.log('Dry run — nothing written. First three rows:');
    console.log(contacts.slice(0, 3));
    return;
  }

  const sql = neon(process.env.DATABASE_URL);

  await sql`
    create table if not exists contacts (
      id serial primary key,
      name text not null,
      company text not null,
      designation text not null,
      industry text,
      requirement text,
      is_priority boolean not null default false
    )
  `;
  await sql`create index if not exists contacts_name_idx on contacts (lower(name))`;
  await sql`create index if not exists contacts_company_idx on contacts (lower(company))`;
  await sql`truncate table contacts restart identity`;

  for (const c of contacts) {
    await sql`
      insert into contacts (name, company, designation, industry, requirement, is_priority)
      values (${c.name}, ${c.company}, ${c.designation}, ${c.industry}, ${c.requirement}, ${c.isPriority})
    `;
  }

  const [{ count }] = await sql`select count(*)::int as count from contacts`;
  console.log(`Seeded ${count} contacts, ${priorityCount} priority.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
