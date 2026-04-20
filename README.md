# Bridgeee

Bridgeee is a Next.js application backed by Supabase and Stripe.

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Copy the example environment file and fill in the required values.

```bash
cp .env.example .env.local
```

3. Start the development server.

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Use [`.env.example`](.env.example) as the source of truth for local setup.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Stripe-related variables are required when working on payments:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ADMIN_USER_IDS`

Optional variables for transactional emails:

- `RESEND_API_KEY`
- `EMAIL_FROM` in `email@example.com` or `Name <email@example.com>` format
- `SUPPORT_EMAIL` to override the recipient inbox for support requests
- when setting `EMAIL_FROM` in Vercel or another dashboard UI, omit surrounding quotes

Optional variables for auto-issued meeting links after payment:

- `MEETING_PROVIDER`
- `MEETING_URL_TEMPLATE`
- `MEETING_HOST_URL_TEMPLATE`
- `ZOOM_ACCOUNT_ID`
- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_HOST_EMAIL`

## Meeting Links

When a Stripe `payment_intent.succeeded` webhook is received, Bridgeee can now
generate a per-booking meeting URL and store it on the related `bookings`
record. The generated link is shown in `Settings > My lessons`.

Supported providers in code:

- `template`: generates a deterministic external URL from environment-driven
  templates. A simple setup is `https://meet.jit.si/bridgeee-{bookingId}`.
- `zoom`: creates a scheduled Zoom meeting and stores separate host/join URLs.

The database change for this feature lives in:

- `supabase/migrations/20260402120000_add_meeting_links_to_bookings.sql`

## Staging And Schema Workflow

We no longer edit production tables directly from the Supabase dashboard.

Use this workflow instead:

1. Create a branch from `main`.
2. Make app changes locally.
3. If the PR changes DB schema, create a Supabase migration.
4. Push the branch and validate it against staging.
5. Merge only after staging is confirmed.

Detailed instructions:

- [`docs/staging-schema-workflow.md`](docs/staging-schema-workflow.md)

## Docker Rules

Docker is required only for developers who work on Supabase schema management.

Docker required:

- `supabase db pull`
- `supabase db diff`
- `supabase migration new`
- `supabase start`

Docker not required:

- regular Next.js UI work
- API work that does not change schema
- shared staging validation

Quick check:

```bash
docker --version
docker ps
```

## Deployment Model

- `main`: production-ready code
- `staging` or preview branch: staging validation
- `Production` Vercel env: production Supabase project
- `Preview` Vercel env: staging Supabase project
- `Development`: local-only values

## Notes

- Do not commit secrets.
- Do not point local development at production unless there is a deliberate reason.
- Prefer migrations over manual table edits.
