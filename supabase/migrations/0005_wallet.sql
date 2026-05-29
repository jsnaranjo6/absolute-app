-- 0005_wallet.sql

create table wallet_accounts (
  id         uuid primary key default gen_random_uuid(),
  gym_id     uuid not null references gyms(id) on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  balance    numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, member_id)
);

create index idx_wallet_accounts_gym on wallet_accounts (gym_id);

create trigger trg_wallet_accounts_updated_at
  before update on wallet_accounts
  for each row execute function set_updated_at();

create table wallet_transactions (
  id           uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references gyms(id) on delete cascade,
  member_id    uuid not null references members(id) on delete cascade,
  type         text not null check (type in ('top_up','purchase','fee','refund')),
  amount       numeric(10,2) not null,
  description  text,
  reference_id uuid,
  created_at   timestamptz not null default now()
);

create index idx_wallet_tx_gym on wallet_transactions (gym_id);
create index idx_wallet_tx_member on wallet_transactions (gym_id, member_id, created_at);
