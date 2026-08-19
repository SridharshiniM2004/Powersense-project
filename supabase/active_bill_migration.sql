-- Run once in the Supabase SQL Editor before deploying the active-bill code.
alter table public.predictions
  add column if not exists bill_id uuid references public.electricity_bills(id) on delete set null;
alter table public.recommendations
  add column if not exists bill_id uuid references public.electricity_bills(id) on delete cascade;

-- The active bill is a user preference, never a replacement for historical bills.
alter table public.profiles
  add column if not exists active_bill_id uuid references public.electricity_bills(id) on delete set null;

-- An OCR document can be a valid bill even when a provider does not print one of
-- these values. NULL means "Not detected"; zero must not be used as a placeholder.
alter table public.electricity_bills alter column units_consumed_kwh drop not null;
alter table public.electricity_bills alter column amount_due drop not null;
alter table public.electricity_bills alter column units_consumed_kwh drop default;
alter table public.electricity_bills alter column amount_due drop default;

create index if not exists predictions_user_bill_created_idx
  on public.predictions (user_id, bill_id, created_at desc);
create index if not exists recommendations_user_bill_created_idx
  on public.recommendations (user_id, bill_id, created_at desc);
