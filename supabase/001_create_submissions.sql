create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  school text not null,
  full_name text not null,
  email text not null,
  instagram_handle text not null,
  caption text not null,
  image_urls text[] not null,
  stripe_session_id text,
  payment_status text not null default 'unpaid',
  post_status text not null default 'unpaid',
  make_sent_at timestamptz,
  posted_at timestamptz,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists submissions_school_idx on public.submissions (school);
create index if not exists submissions_payment_status_idx on public.submissions (payment_status);
create index if not exists submissions_post_status_idx on public.submissions (post_status);
create index if not exists submissions_created_at_idx on public.submissions (created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_submissions_updated_at on public.submissions;
create trigger set_submissions_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

alter table public.submissions enable row level security;

insert into storage.buckets (id, name, public)
values ('classmate-submissions', 'classmate-submissions', true)
on conflict (id) do update set public = true;
