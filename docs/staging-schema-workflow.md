# Staging And Schema Workflow

This guide explains how Bridgeee should handle Supabase changes without editing production directly.

## The Goal

Use three layers clearly:

- `local`: where you write and test code
- `staging`: where you validate changes before release
- `production`: where you apply approved changes

Local or staging changes do not affect production until you explicitly run `supabase db push` against the production project.

## Choose The Right Workflow

If your change does **not** modify DB schema:

1. Branch from `main`
2. Update app code
3. Push the branch
4. Verify in staging / preview
5. Merge after review

If your change **does** modify DB schema:

1. Branch from `main`
2. Create a migration
3. Update app code
4. Push to staging first
5. Validate on staging
6. Push the same migration to production only after approval

## What Counts As A Schema Change

Examples:

- add or remove a table
- add or remove a column
- change RLS policies
- add or update a trigger
- add or update a SQL function
- add or update an index

These changes must go through Supabase migrations.

## Docker: Who Needs It

Docker is needed for developers who manage Supabase schema locally.

Docker required:

- `npx supabase db pull`
- `npx supabase db diff`
- `npx supabase migration new ...`
- `npx supabase start`

Docker usually not required:

- frontend work
- component styling
- existing API changes that do not change DB structure
- testing against the shared staging Supabase project

Check your machine:

```bash
docker --version
docker ps
```

## Standard Branch Flow

Create a feature branch from `main`.

```bash
git switch main
git pull
git switch -c feature/my-change
```

If you need a staging-only validation branch:

```bash
git switch main
git pull
git switch -c staging
```

## Local App Setup

1. Copy the env template.

```bash
cp .env.example .env.local
```

2. Fill in local values.

For most app work, local can point to the shared staging Supabase project instead of production.

## Schema Change Example

Example: add `bio` to `public.users`.

Who does this:

- steps 1 to 5 are usually done by the developer who made the schema change
- steps 6 to 7 are done by the release owner or the person allowed to update production
- not every developer should push schema changes to production

1. Create a migration.

```bash
npx supabase migration new add_bio_to_users
```

2. Put SQL in the generated file.

```sql
alter table public.users add column bio text;
```

3. Link to the staging Supabase project.

```bash
npx supabase link --project-ref <staging-project-ref>
```

How to find `<staging-project-ref>`:

- open the staging Supabase project
- go to `Settings`
- go to `General`
- copy `Project ID`

Notes:

- `--project-ref` is the Supabase CLI option name
- `<staging-project-ref>` is the actual `Project ID` of the staging project
- do not paste real project IDs into documentation committed to the repository

You can also read the same value from the Supabase project URL:

- open the project in Supabase
- find `Project URL`
- copy the string between `https://` and `.supabase.co`

That means these two values are the same:

- the string between `https://` and `.supabase.co` in `Project URL`
- `Settings > General > Project ID`

How to run the command:

1. copy the `Project ID`
2. paste it into the command in place of `<staging-project-ref>`

4. Push to staging.

```bash
npx supabase db push
```

This changes the staging database only.
It does not change production.

5. Verify:

- UI reads and writes the new field
- API behavior is correct
- RLS still works

At this point, the developer opens a PR after staging is confirmed.

6. After approval, link to production.

```bash
npx supabase link --project-ref <production-project-ref>
```

Use the same steps above to find `<production-project-ref>`, but in the production Supabase project instead of the staging project.

This step is normally done only by the release owner.

7. Push the same migration to production.

```bash
npx supabase db push
```

Production changes happen only in this final step.

## Staging Setup Rules

Vercel environments:

- `Production`: production Supabase values
- `Preview`: staging Supabase values
- `Development`: local-only values

Image to keep in mind:

- `bridgeee.com`: production
- `staging.bridgeee.com`: preview / staging
- your local machine: development

Required preview env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Optional preview vars when using payments:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ADMIN_USER_IDS`

## Auth And Email Rules

Each Supabase project has its own Auth settings.

For staging, configure:

- `Site URL`
- `Redirect URLs`
- SMTP sender

Important:

- the sender email domain must be verified in Resend
- if Resend has only verified `bridgeee.com`, do not send from `noreply@staging.bridgeee.com`
- use `noreply@bridgeee.com` unless `staging.bridgeee.com` is separately verified

## Baseline And Migrations

If the repo is missing Supabase migration history, first create a baseline from the current remote schema.

Typical sequence:

```bash
npx supabase init
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db pull
```

How to find `<project-ref>`:

- open the target Supabase project
- go to `Settings`
- go to `General`
- copy `Project ID`

You can also find the same value in `Project URL`:

- copy the string between `https://` and `.supabase.co`

Notes:

- `--project-ref` is the Supabase CLI option name
- `<project-ref>` is the `Project ID` of the Supabase project you want to connect to
- do not paste real project IDs into documentation committed to the repository

After the baseline exists, new schema changes should be added as new migration files instead of editing tables manually.

## Review Checklist

Before merging a schema-related PR, confirm all of the following:

- migration file is included
- staging `db push` succeeded
- app behavior was tested against staging
- production was not edited manually
- required Vercel env vars are documented
- Auth and SMTP settings were checked if signup/login behavior changed
