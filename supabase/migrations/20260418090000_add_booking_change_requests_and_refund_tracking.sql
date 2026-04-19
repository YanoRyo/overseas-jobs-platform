alter table public.payments
  add column if not exists stripe_refund_id text,
  add column if not exists refund_amount integer,
  add column if not exists refund_reason text,
  add column if not exists refunded_at timestamptz;

create table if not exists public.booking_change_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id bigint not null references public.bookings(id) on delete cascade,
  requester_user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type = 'cancel'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason text,
  review_note text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_booking_change_requests_booking_id
  on public.booking_change_requests (booking_id);

create index if not exists idx_booking_change_requests_status
  on public.booking_change_requests (status);

create or replace trigger set_booking_change_requests_updated_at
before update on public.booking_change_requests
for each row
execute function public.update_updated_at_column();

alter table public.booking_change_requests enable row level security;

grant all on table public.booking_change_requests to service_role;
