alter table public.payments
  add column if not exists student_confirmation_email_sent_at timestamptz,
  add column if not exists student_confirmation_email_id text,
  add column if not exists mentor_booking_email_sent_at timestamptz,
  add column if not exists mentor_booking_email_id text;
