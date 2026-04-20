create table if not exists public.booking_meeting_setup_issues (
  id uuid primary key default gen_random_uuid(),
  booking_id bigint not null references public.bookings(id) on delete cascade,
  provider text,
  error_summary text not null,
  error_details text,
  status text not null default 'unresolved' check (status in ('unresolved', 'resolved')),
  failure_count integer not null default 1 check (failure_count >= 1),
  occurred_at timestamptz not null default now(),
  resolved_at timestamptz,
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_meeting_setup_issues_booking_id_key unique (booking_id)
);

create index if not exists booking_meeting_setup_issues_status_occurred_at_idx
  on public.booking_meeting_setup_issues(status, occurred_at desc);

drop trigger if exists set_booking_meeting_setup_issues_updated_at
on public.booking_meeting_setup_issues;

create trigger set_booking_meeting_setup_issues_updated_at
before update on public.booking_meeting_setup_issues
for each row
execute function public.update_updated_at_column();

alter table public.booking_meeting_setup_issues enable row level security;

drop policy if exists "admins can read meeting setup issues"
on public.booking_meeting_setup_issues;

create policy "admins can read meeting setup issues"
on public.booking_meeting_setup_issues
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

grant all on table public.booking_meeting_setup_issues to anon;
grant all on table public.booking_meeting_setup_issues to authenticated;
grant all on table public.booking_meeting_setup_issues to service_role;
