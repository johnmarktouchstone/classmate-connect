alter table public.submissions
add column if not exists error_message text;
