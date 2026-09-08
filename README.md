# HR Tech summit contacts

A mobile-first lookup for the HR Tech summit contact list. Type a person's name or a company
name and get the person, their role, their industry, and any stated hiring requirement.

Built with Next.js 15 (App Router), Neon Postgres, and the Talent Muscle design system.

## What is in the data

`UBS Data.xlsx` holds 251 contacts. The seed script reads five columns — name, company,
designation, industry, requirement — and drops the two empty ones. The yellow fill on the
company cell marks 67 rows as **priority targets**; those get an orange "Priority" tag and
sort to the top of every result set.

## Run it locally

```bash
npm install
npx vercel link              # once, to connect this folder to the Vercel project
npx vercel env pull .env.local
npm run seed
npm run dev
```

`npm run seed -- --dry-run` parses the spreadsheet and prints the first rows without touching
the database. The seed asserts 251 contacts and 67 priority rows and refuses to write if the
spreadsheet no longer matches.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel. Framework preset: Next.js. No build settings to change.
3. On the Vercel project, add the **Neon** integration from the Storage tab. It sets
   `DATABASE_URL` on all environments.
4. Pull that value locally (`vercel env pull .env.local`) and run `npm run seed` once.

Re-seeding is idempotent — it truncates and reloads. Update the spreadsheet, re-run the seed,
and the live app picks it up without a redeploy.

## Notes

- The app sits behind a 6-digit PIN. The default is `111111`; set `ACCESS_PIN` on the Vercel
  project to change it. Middleware redirects every unlocked request to `/pin` and answers the
  contact API with 401, so the list is not readable without the PIN. Unlocking sets an
  httpOnly cookie holding a hash of the PIN, good for 12 hours.
- A shared PIN is a soft lock, not real authentication. Anyone who has the PIN can read the
  full list of 251 named individuals with their employer and job title.
- Search covers name and company only. Queries are bound parameters, capped at 80 characters,
  and matched with `strpos` / `starts_with` rather than `LIKE`, so a typed `%` or `_` is
  treated as an ordinary character.
- Results are capped at 50 per query.
