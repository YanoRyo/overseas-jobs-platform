create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid references public.users(id) on delete set null,
  name text not null,
  email text not null,
  category text not null check (
    category in ('payment', 'schedule_change', 'no_response', 'trouble_report', 'other')
  ),
  request_context text,
  message text not null,
  locale text,
  status text not null default 'open' check (status in ('open', 'replied')),
  last_replied_at timestamptz,
  last_replied_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_status_created_at_idx
  on public.support_requests(status, created_at desc);

create index if not exists support_requests_requester_user_id_idx
  on public.support_requests(requester_user_id);

drop trigger if exists set_support_requests_updated_at
on public.support_requests;

create trigger set_support_requests_updated_at
before update on public.support_requests
for each row
execute function public.update_updated_at_column();

create table if not exists public.support_request_replies (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null references public.support_requests(id) on delete cascade,
  sender_user_id uuid references public.users(id) on delete set null,
  subject text not null,
  body text not null,
  delivery_status text not null default 'pending' check (
    delivery_status in ('pending', 'sent', 'failed')
  ),
  delivery_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_request_replies_request_id_created_at_idx
  on public.support_request_replies(support_request_id, created_at asc);

create index if not exists support_request_replies_delivery_status_idx
  on public.support_request_replies(delivery_status);

drop trigger if exists set_support_request_replies_updated_at
on public.support_request_replies;

create trigger set_support_request_replies_updated_at
before update on public.support_request_replies
for each row
execute function public.update_updated_at_column();

alter table public.support_requests enable row level security;
alter table public.support_request_replies enable row level security;

drop policy if exists "admins can read support requests"
on public.support_requests;

create policy "admins can read support requests"
on public.support_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "admins can read support request replies"
on public.support_request_replies;

create policy "admins can read support request replies"
on public.support_request_replies
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

grant all on table public.support_requests to anon;
grant all on table public.support_requests to authenticated;
grant all on table public.support_requests to service_role;

grant all on table public.support_request_replies to anon;
grant all on table public.support_request_replies to authenticated;
grant all on table public.support_request_replies to service_role;
