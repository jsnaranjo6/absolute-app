-- 0006_products.sql

create table products (
  id                  uuid primary key default gen_random_uuid(),
  gym_id              uuid not null references gyms(id) on delete cascade,
  name                text not null,
  emoji               text,
  price               numeric(10,2) not null,
  category            text,
  stock_quantity      int not null default 0,
  low_stock_threshold int not null default 5,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_products_gym on products (gym_id);
create index idx_products_gym_active on products (gym_id, is_active);

create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();
