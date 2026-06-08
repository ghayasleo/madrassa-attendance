# CLAUDE.md — Madrassa Attendance System

Project rules, architecture, and conventions. **Read this before changing anything.**

---

## 1. What this app is

A mobile-first attendance system for a madrassa. Teachers use it primarily on phones.

**Roles**

- **Admin** — a Supabase Auth user. Can create/manage **Teachers** (which are also Auth users). Can see all data and all reports.
- **Teacher** — a Supabase Auth user created by an Admin. Can manage **Students** (plain records, not Auth users), create **Classes**, assign students to classes, and take **Attendance**. Can see reports for their own classes/students.

**Students are NOT auth users.** They are plain CRUD rows created by teachers.

---

## 2. Tech stack (do not swap without reason)

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Build          | Vite + React 18 + TypeScript             |
| Styling        | Tailwind CSS **v4** (CSS-based config)   |
| Server / DB    | Supabase (Postgres, Auth, RLS, Edge Fns) |
| Data fetching  | TanStack Query v5                         |
| Forms          | react-hook-form + zod                    |
| Routing        | react-router-dom v6                      |
| i18n           | i18next + react-i18next (en + ur)        |
| Icons          | lucide-react                             |
| Dates          | date-fns                                  |

### Tailwind v4 rules

- Config lives in `src/index.css` inside `@theme { … }`. **There is no `tailwind.config.js`.**
- The Vite plugin `@tailwindcss/vite` is wired in `vite.config.ts`. No PostCSS config.
- Brand color = `brand-*` (green). Use `brand-600` as the primary action color.

---

## 3. Path alias

`@/` → `src/`. Import like `import { Button } from '@/components/ui/Button'`. Configured in `vite.config.ts` and `tsconfig.app.json`.

---

## 4. Data model

All tables are in the `public` schema. UUID primary keys, `created_at`/`updated_at` timestamptz.

- **profiles** — one row per auth user. `id` (= `auth.users.id`), `role` (`admin` | `teacher`), `full_name`, `email`, `phone`, `is_active`.
- **subjects** — `id`, `name` (e.g. Hifz, Nazra, Science). Shared list.
- **students** — `id`, `full_name`, `guardian_name`, `phone`, `subject_id` (nullable), `is_active`, `created_by`. Plain records.
- **classes** — `id`, `name`, `subject_id`, `teacher_id`, `start_time` (time), `end_time` (time), `is_active`. **Times are a recurring daily slot** (e.g. 08:00–10:00 every day). `end_time` must be after `start_time`.
- **class_students** — junction (many-to-many). `class_id`, `student_id`. Unique on the pair.
- **attendance** — `id`, `class_id`, `student_id`, `date`, `status` (`present` | `absent` | `late` | `excused`), `marked_by`, `note`. Unique on (`class_id`, `student_id`, `date`).

### Business rules (enforced in DB, not just UI)

1. **No time overlap for a student.** A student cannot be enrolled in two classes whose daily time ranges overlap. Enforced by a trigger on `class_students` (`check_student_class_overlap`). Half-open comparison: overlap iff `a.start < b.end AND b.start < a.end`.
2. **Class times valid.** `end_time > start_time` (CHECK constraint).
3. **One attendance row per student/class/date** (unique constraint). Marking again = upsert.
4. A student can be in **multiple** non-overlapping classes (e.g. Hifz morning + Hifz evening).

---

## 5. Permissions (RLS) — source of truth is the DB

RLS is ON for every table. Summary:

- **profiles**: a user reads their own row. Admins read/insert/update all. Teacher profiles are created by the `create-teacher` edge function (service role), never directly from the client.
- **subjects**: any authenticated user reads. Admin writes. (Teachers may add subjects too — allowed; keep liberal.)
- **students / classes / class_students / attendance**: any authenticated **teacher or admin** can read & write. Teachers are trusted staff; we do not silo teachers from each other's students by default. (If per-teacher isolation is ever needed, scope by `teacher_id` / `created_by`.)

Helper SQL function `public.is_admin()` and `public.current_role()` read the caller's profile for use in policies.

### Creating teachers

Client **cannot** create auth users directly (needs service role). Use the **`create-teacher` edge function** (`supabase/functions/create-teacher`):

1. Verifies the caller's JWT belongs to an **admin**.
2. Uses the service role to `auth.admin.createUser` + insert the `profiles` row with role `teacher`.

`SUPABASE_SERVICE_ROLE_KEY` lives only in the edge function env. **Never** put it in client `.env` / `VITE_*`.

---

## 6. Folder structure

```
src/
  lib/            supabase client, queryClient, utils (cn, time helpers)
  types/          database.ts (DB row types), app types
  i18n/           index.ts + locales/{en,ur}.json
  providers/      AppProviders (query, auth, language)
  context/        AuthContext, LanguageContext
  hooks/          shared hooks (useDirection, etc.)
  components/
    ui/           reusable primitives (Button, Input, Card, Modal, …)
    layout/       AppLayout, TopBar, Sidebar, BottomNav, ProtectedRoute
  features/
    <feature>/    api.ts (query/mutation hooks) + components + page
      auth/ teachers/ students/ classes/ attendance/ reports/
  pages/          top-level route pages that compose features
  routes.tsx      route table
  App.tsx main.tsx
```

**Feature rule:** each feature owns its TanStack Query hooks in `features/<x>/api.ts`. Query keys are centralized per feature as a `<x>Keys` object.

---

## 7. Conventions

- **TypeScript is strict** (`verbatimModuleSyntax` + `erasableSyntaxOnly` are on). Use `import type { … }` for type-only imports. **No `enum`s, no namespaces, no parameter properties** — use union types and `const` objects.
- Reusable UI primitives live in `components/ui` and must be i18n- and RTL-agnostic (use logical CSS: `ps-*`/`pe-*`/`ms-*`/`start-*`, never hard-coded `left`/`right`).
- Merge class names with the `cn()` helper (`clsx` + `tailwind-merge`) from `@/lib/utils`.
- Use `Intl`/date-fns for date formatting; never hand-format.
- Keep components small and composable. No business logic in `ui/` primitives.

### i18n / RTL rules

- Every user-facing string goes through `t('key')`. No hard-coded English/Urdu in JSX.
- `LanguageContext` sets `<html lang dir>`; `en` → `ltr`, `ur` → `rtl`, and persists the choice.
- Layout must use **logical properties** (`ps/pe/ms/me/start/end`, `text-start`) so it mirrors automatically. Test both directions.
- Numbers/dates in reports: format per active locale.

---

## 8. Supabase

- Migrations live in `supabase/migrations/` and are ordered by filename (`0001_…` first). They are idempotent-friendly and must be applied in order.
- Apply via the Supabase CLI (`supabase db push`) or paste into the SQL editor in order.
- Edge functions in `supabase/functions/`. Deploy with `supabase functions deploy create-teacher`.
- Generated DB types: keep `src/types/database.ts` in sync with migrations. Can be regenerated with `supabase gen types typescript`.

### First-run setup

1. Create a Supabase project. Put `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env` (copy from `.env.example`).
2. Apply migrations in order. `0005_seed.sql` documents how to bootstrap the **first admin** (create the auth user in the dashboard, then run the seed snippet with its id).
3. Set the edge function secret `SUPABASE_SERVICE_ROLE_KEY` and deploy `create-teacher`.

---

## 9. Commands

```bash
npm run dev        # start dev server
npm run build      # typecheck (tsc -b) + production build
npm run typecheck  # tsc --noEmit
npm run preview    # preview the production build
```

**Always** run `npm run build` (or `npm run typecheck`) before declaring work done — strict TS will catch type-only import and erasable-syntax violations.

---

## 10. Things NOT to do

- Don't expose the service role key to the client.
- Don't enforce business rules only in the UI — they must hold in the DB.
- Don't use physical `left`/`right` in layout; it breaks RTL.
- Don't add a `tailwind.config.js` — this is Tailwind v4 (CSS config).
- Don't make students auth users.
