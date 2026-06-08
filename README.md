# Madrassa Attendance

Mobile-first attendance system for a madrassa. **Admins** manage teachers; **teachers**
manage students, classes, and take attendance. Bilingual (English / اردو) with full RTL support.

Built with **React + Vite + TypeScript**, **Supabase** (Postgres + Auth + RLS + Edge Functions),
**TanStack Query**, **Tailwind CSS v4**, **react-hook-form + zod**, **react-i18next**.

> Architecture, data model, business rules, and conventions live in **[CLAUDE.md](./CLAUDE.md)** — read it first.

## Quick start

```bash
npm install
cp .env.example .env          # fill in your Supabase URL + anon key
npm run dev
```

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com). Copy the **Project URL** and
   **anon key** into `.env`.
2. Apply migrations **in order** (`supabase db push`, or paste each file into the SQL editor):
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_functions.sql`
   - `supabase/migrations/0003_rls.sql`
   - `supabase/migrations/0004_seed.sql`
3. **Bootstrap the first admin** — follow the commented steps at the bottom of `0004_seed.sql`
   (create an auth user in the dashboard, then insert its profile with `role = 'admin'`).
4. Deploy the teacher-provisioning function and set its secret:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   supabase functions deploy create-teacher
   ```

## Scripts

| Command             | Description                             |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Dev server                              |
| `npm run build`     | Typecheck (`tsc -b`) + production build |
| `npm run typecheck` | Types only                              |
| `npm run preview`   | Preview the production build            |

## Key features

- **Roles & auth** — admin-only teacher management via a secure edge function; RLS on every table.
- **Students** — plain CRUD records (not auth users), searchable, subject-tagged.
- **Classes** — daily time slots; a student can join multiple classes, but the DB **rejects
  overlapping class times** for the same student (enforced by a trigger).
- **Attendance** — tap-to-mark present/absent/late/excused per class per day; idempotent upserts.
- **Reports** — day / week / month / custom range, by class or by student, with attendance rate.
- **i18n / RTL** — every string translated; layout mirrors automatically using logical CSS.
