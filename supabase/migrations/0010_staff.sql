-- 0010_staff.sql

create table staff (
  id         uuid primary key default gen_random_uuid(),
  gym_id     uuid not null references gyms(id) on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  role       text not null check (role in ('trainer','front_desk','manager','owner')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (gym_id, member_id)
);

create index idx_staff_gym on staff (gym_id);
create index idx_staff_gym_role on staff (gym_id, role);
