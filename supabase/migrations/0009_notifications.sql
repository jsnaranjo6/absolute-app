-- 0009_notifications.sql

create table notifications (
  id           uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references gyms(id) on delete cascade,
  title        text not null,
  body         text not null,
  type         text not null check (type in ('tip','alert','promo')),
  target_type  text not null check (target_type in ('all','by_subscription','by_gender','specific')),
  target_value text,
  scheduled_at timestamptz,
  sent_at      timestamptz,
  created_by   uuid references members(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index idx_notifications_gym on notifications (gym_id);
create index idx_notifications_schedule on notifications (scheduled_at) where sent_at is null;

create table notification_inbox (
  id              uuid primary key default gen_random_uuid(),
  gym_id          uuid not null references gyms(id) on delete cascade,
  member_id       uuid not null references members(id) on delete cascade,
  notification_id uuid not null references notifications(id) on delete cascade,
  is_read         boolean not null default false,
  received_at     timestamptz not null default now()
);

create index idx_inbox_member on notification_inbox (gym_id, member_id, is_read);

-- Device push tokens (OneSignal player IDs) registered by the frontend.
create table device_tokens (
  id               uuid primary key default gen_random_uuid(),
  gym_id           uuid not null references gyms(id) on delete cascade,
  member_id        uuid not null references members(id) on delete cascade,
  player_id        text not null,
  platform         text,
  created_at       timestamptz not null default now(),
  unique (gym_id, member_id, player_id)
);

create index idx_device_tokens_member on device_tokens (gym_id, member_id);
