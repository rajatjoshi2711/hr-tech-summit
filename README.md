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
cp .env.example .env.local   # then paste your Neon connection string in
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

- The app is public and unauthenticated. Anyone with the URL can read the full list of 251
  named individuals with their employer and job title.
- Search covers name and company only. Queries are bound parameters, capped at 80 characters,
  with `%` and `_` escaped so they match literally.
- Results are capped at 50 per query.
