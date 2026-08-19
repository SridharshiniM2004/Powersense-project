-- Run once in the Supabase SQL Editor before deploying the active-bill code.
alter table public.predictions
  add column if not exists bill_id uuid references public.electricity_bills(id) on delete set null;
alter table public.recommendations
  add column if not exists bill_id uuid references public.electricity_bills(id) on delete cascade;

create index if not exists predictions_user_bill_created_idx
  on public.predictions (user_id, bill_id, created_at desc);
create index if not exists recommendations_user_bill_created_idx
  on public.recommendations (user_id, bill_id, created_at desc);
