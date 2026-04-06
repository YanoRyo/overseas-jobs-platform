alter table public.bookings
  add column if not exists meeting_provider text,
  add column if not exists meeting_join_url text,
  add column if not exists meeting_host_url text,
  add column if not exists external_meeting_id text,
  add column if not exists meeting_created_at timestamptz;
