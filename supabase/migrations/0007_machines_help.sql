-- 0007_machines_help.sql

create table machines (
  id           uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references gyms(id) on delete cascade,
  name         text not null,
  type         text,
  zone         text,
  qr_code_id   uuid not null unique default gen_random_uuid(),
  instructions jsonb not null default '[]'::jsonb,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index idx_machines_gym on machines (gym_id);
create index idx_machines_qr on machines (qr_code_id);

create table help_requests (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid not null references gyms(id) on delete cascade,
  member_id   uuid not null references members(id) on delete cascade,
  machine_id  uuid references machines(id) on delete set null,
  trainer_id  uuid references members(id) on delete set null,
  status      text not null default 'open' check (status in ('open','in_progress','resolved')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_help_gym on help_requests (gym_id);
create index idx_help_gym_status on help_requests (gym_id, status);
