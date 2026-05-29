-- 0011_payment_transactions.sql

create table payment_transactions (
  id                  uuid primary key default gen_random_uuid(),
  gym_id              uuid not null references gyms(id) on delete cascade,
  member_id           uuid references members(id) on delete set null,
  wawa_transaction_id text,
  type                text not null
                        check (type in ('subscription_renewal','wallet_top_up','no_show_fee','cancellation_fee','refund')),
  amount              numeric(10,2) not null,
  status              text not null default 'pending' check (status in ('pending','completed','failed')),
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

create index idx_payments_gym on payment_transactions (gym_id);
create index idx_payments_member on payment_transactions (gym_id, member_id);
create index idx_payments_wawa on payment_transactions (wawa_transaction_id);
