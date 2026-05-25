alter table public.submissions
add column if not exists promo_code text,
add column if not exists discount_cents integer not null default 0,
add column if not exists original_price_cents integer;

alter table public.submissions
drop constraint if exists submissions_price_cents_check;

alter table public.submissions
add constraint submissions_price_cents_check
check (price_cents is null or price_cents >= 0);

alter table public.submissions
drop constraint if exists submissions_discount_cents_check;

alter table public.submissions
add constraint submissions_discount_cents_check
check (discount_cents >= 0);

alter table public.submissions
drop constraint if exists submissions_original_price_cents_check;

alter table public.submissions
add constraint submissions_original_price_cents_check
check (original_price_cents is null or original_price_cents >= 0);

create index if not exists submissions_promo_code_idx
on public.submissions (promo_code);
