# Fix avatar upload (missing columns + missing bucket)

## Root cause

The migration `supabase/migrations/20260813120000_account_name_and_avatar.sql` was written but never applied to the live database. Two things are missing:

1. **`profiles.full_name` and `profiles.avatar_url` columns** — confirmed via `information_schema`: the `profiles` table has only `id, currency, pay_frequency, anchor_day, dark_mode, ftux_completed, created_at, updated_at`. This is why every `select ... full_name, avatar_url` query returns HTTP 400 `"column profiles.full_name does not exist"`.

2. **`avatars` storage bucket** — confirmed: `storage.buckets` has no row with `id = 'avatars'`. This is why the avatar upload POST returns `"Bucket not found"`.

The app code (`src/lib/data-provider.tsx` → `useUploadAvatar`) is correct: it uploads to the `avatars` bucket, gets the public URL, and upserts `avatar_url` into `profiles`. Both steps fail because the schema and bucket were never created.

## Fix

### Step 1 — Create the `avatars` bucket via the storage tool

Call `supabase--storage_create_bucket` with `name = "avatars"`, `public = true`.

SQL `INSERT INTO storage.buckets` is rejected by the migration tool, so the bucket must be created through the storage API. (The existing migration file contains such an INSERT — it will be removed in Step 2.)

### Step 2 — Edit the migration file to remove the bucket INSERT

In `supabase/migrations/20260813120000_account_name_and_avatar.sql`, delete the `insert into storage.buckets ... on conflict ...` block (lines 28–30). Keep:
- `alter table public.profiles add column ...` (lines 7–9)
- The `update public.profiles` backfill (lines 13–22)
- All four `storage.objects` RLS policies (lines 35–62) — SQL on `storage.objects` is allowed

### Step 3 — Apply the migration

Run the edited migration via `supabase--migration`. This adds the two columns, backfills `full_name` from auth metadata, and installs the read/insert/update/delete RLS policies on `storage.objects`.

## Verification

- `supabase--read_query` on `information_schema.columns` for `profiles` → `full_name` and `avatar_url` present
- `supabase--read_query` on `storage.buckets` → `avatars` row exists with `public = true`
- Reload `/settings` (Account section) — the `full_name` query no longer 400s, name shows, and a photo upload succeeds
