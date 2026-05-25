alter table public.submissions
add column if not exists instagram_post_id text;

notify pgrst, 'reload schema';
