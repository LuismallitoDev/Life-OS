# Life OS

A local personal dashboard pulling together Work & Projects, Finance, Personal
Goals, and Health & Fitness from your existing Notion databases and Google
Calendar.

Runs locally only — `npm run dev` and open `http://localhost:3000`. There's no
deployment step and no public hosting.

## Status

The app is fully built and runs out of the box (`npm run dev`), but each
integration needs credentials in `.env.local` before it shows real data. Until
then, every page shows a yellow setup notice explaining what's missing instead
of crashing.

## Setup

### 1. Notion

1. Go to https://www.notion.so/my-integrations → **New integration**.
2. Name it "Life OS", pick your workspace, create it, and copy the **Internal
   Integration Token**.
3. In Notion, open each of these pages/databases and use **···  → Connect to
   → Life OS** (connecting the parent page also covers nested databases):
   - **Business OS** (covers Project and Clients databases)
   - **Money Tracker** (covers Expense Tracker, Income Tracker, balance tracker)
   - **Weekly Workout & Meals** (covers Meal Tracking, Exercises)
4. Put the token in `.env.local`:
   ```
   NOTION_TOKEN=secret_xxx...
   ```

The data source IDs are already wired up in `src/lib/notion.ts` — no further
configuration needed once the integration has access.

### 2. Google Calendar

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a
   project (or reuse one) and enable the **Google Calendar API**.
2. Create an **OAuth client ID** (type: Desktop app), and note the client ID
   and secret.
3. Use the [OAuth Playground](https://developers.google.com/oauthplayground)
   (or a small local script) with the `https://www.googleapis.com/auth/calendar.readonly`
   scope, authenticated as `metallicajust@gmail.com`, to obtain a **refresh
   token**.
4. Put these in `.env.local`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REFRESH_TOKEN=...
   ```

### 3. Supabase

1. Create a free project at https://supabase.com.
2. In the SQL editor, run `supabase/schema.sql` from this repo — it creates
   `savings_goals`, `long_term_goals`, `habits`, and `habit_logs` tables (the
   only data that doesn't already live in Notion).
3. In **Settings → API**, copy the project URL and the `anon` public key into
   `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   ```

## Running

```bash
npm run dev
```

Open http://localhost:3000. Side menu: **Overview**, **Work & Projects**,
**Finance**, **Personal Goals**, **Health & Fitness**.

## Notes

- Health & Fitness targets (calories/protein/water) are hardcoded constants
  at the top of `src/app/health/page.tsx` — edit them to match your goals.
- `Meal Tracking` and `Exercises` are queried by today's date; there's no
  historical view yet.
- Since this only runs on localhost for a single user, there's no auth layer
  and Supabase RLS is left disabled (see the comment in `supabase/schema.sql`
  if you ever change that).
