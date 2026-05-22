alter table public.submissions
add column if not exists stripe_session_id text;
