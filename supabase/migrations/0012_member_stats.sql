-- 0012_member_stats.sql
-- Denormalized streak/visit counters maintained by check-in service + streaks cron.

create table member_stats (
  id             uuid primary key default gen_random_uuid(),
  gym_id         uuid not null references gyms(id) on delete cascade,
  member_id      uuid not null references members(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  total_visits   int not null default 0,
  updated_at     timestamptz not null default now(),
  unique (gym_id, member_id)
);

create index idx_member_stats_visits on member_stats (gym_id, total_visits desc);
create index idx_member_stats_streak on member_stats (gym_id, current_streak desc);

create trigger trg_member_stats_updated_at
  before update on member_stats
  for each row execute function set_updated_at();
