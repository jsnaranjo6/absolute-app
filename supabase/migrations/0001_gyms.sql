-- 0001_gyms.sql
-- Root tenant table. The only table WITHOUT a gym_id column (it IS the gym).

create extension if not exists "pgcrypto";

-- Shared trigger to keep updated_at fresh on any table that has the column.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table gyms (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  logo_url        text,
  primary_color   text,
  secondary_color text,
  feature_flags   jsonb not null default '{}'::jsonb,
  timezone        text not null default 'UTC',
  created_at      timestamptz not null default now()
);

create index idx_gyms_slug on gyms (slug);
