-- 0008_cycling.sql

create table cycling_classes (
  id                         uuid primary key default gen_random_uuid(),
  gym_id                     uuid not null references gyms(id) on delete cascade,
  instructor_name            text not null,
  title                      text not null,
  scheduled_at               timestamptz not null,
  duration_minutes           int not null default 45,
  capacity                   int not null,
  cancellation_cutoff_minutes int not null default 60,
  is_active                  boolean not null default true,
  created_at                 timestamptz not null default now()
);

create index idx_classes_gym on cycling_classes (gym_id);
create index idx_classes_schedule on cycling_classes (gym_id, scheduled_at);

create table bikes (
  id         uuid primary key default gen_random_uuid(),
  gym_id     uuid not null references gyms(id) on delete cascade,
  name       text not null,
  status     text not null default 'available' check (status in ('available','booked','maintenance')),
  created_at timestamptz not null default now()
);

create index idx_bikes_gym on bikes (gym_id);

create table cycling_bookings (
  id                uuid primary key default gen_random_uuid(),
  gym_id            uuid not null references gyms(id) on delete cascade,
  member_id         uuid not null references members(id) on delete cascade,
  class_id          uuid not null references cycling_classes(id) on delete cascade,
  bike_id           uuid references bikes(id) on delete set null,
  status            text not null default 'confirmed'
                      check (status in ('confirmed','cancelled','no_show','waitlist')),
  booked_at         timestamptz not null default now(),
  cancelled_at      timestamptz,
  waitlist_position int
);

create index idx_bookings_gym on cycling_bookings (gym_id);
create index idx_bookings_class on cycling_bookings (gym_id, class_id, status);
create index idx_bookings_member on cycling_bookings (gym_id, member_id);
-- A confirmed booking ties up exactly one bike per class.
create unique index uniq_bike_per_class
  on cycling_bookings (class_id, bike_id)
  where status = 'confirmed' and bike_id is not null;
