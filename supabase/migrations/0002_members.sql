-- 0002_members.sql

create table members (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references gyms(id) on delete cascade,
  name          text not null,
  email         text not null,
  password_hash text not null,
  photo_url     text,
  gender        text not null check (gender in ('male','female','other')),
  role          text not null default 'member'
                  check (role in ('member','trainer','front_desk','manager','owner')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- email is unique per gym, not globally (multi-tenant)
  unique (gym_id, email)
);

create index idx_members_gym on members (gym_id);
create index idx_members_gym_role on members (gym_id, role);

create trigger trg_members_updated_at
  before update on members
  for each row execute function set_updated_at();
