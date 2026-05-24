alter table public.submissions
add column if not exists posting_tier text,
add column if not exists posting_speed text,
add column if not exists price_cents integer;

alter table public.submissions
drop constraint if exists submissions_posting_tier_check;

alter table public.submissions
add constraint submissions_posting_tier_check
check (
  posting_tier is null
  or posting_tier in ('instant', 'two_hours', 'twenty_four_hours', 'five_days')
);

alter table public.submissions
drop constraint if exists submissions_price_cents_check;

alter table public.submissions
add constraint submissions_price_cents_check
check (price_cents is null or price_cents > 0);

create index if not exists submissions_posting_tier_idx
on public.submissions (posting_tier);
