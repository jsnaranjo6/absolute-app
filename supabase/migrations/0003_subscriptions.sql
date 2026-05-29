-- 0003_subscriptions.sql

create table subscriptions (
  id               uuid primary key default gen_random_uuid(),
  gym_id           uuid not null references gyms(id) on delete cascade,
  member_id        uuid not null references members(id) on delete cascade,
  plan_type        text not null
                     check (plan_type in ('daily','monthly','bi_monthly','tri_monthly','annual','special')),
  start_date       date not null,
  end_date         date not null,
  status           text not null default 'active'
                     check (status in ('active','expired','frozen','cancelled')),
  freeze_days_used int not null default 0,
  auto_renew       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_subs_gym on subscriptions (gym_id);
create index idx_subs_member on subscriptions (gym_id, member_id);
create index idx_subs_renewal on subscriptions (status, auto_renew, end_date);

create trigger trg_subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();
