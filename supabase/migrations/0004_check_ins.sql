-- 0004_check_ins.sql
-- No updated_at on this table (append-only event log).

create table check_ins (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references gyms(id) on delete cascade,
  member_id     uuid not null references members(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  method        text not null default 'barcode' check (method in ('barcode','manual')),
  created_at    timestamptz not null default now()
);

create index idx_checkins_gym on check_ins (gym_id);
create index idx_checkins_member on check_ins (gym_id, member_id, checked_in_at);
create index idx_checkins_time on check_ins (gym_id, checked_in_at);
