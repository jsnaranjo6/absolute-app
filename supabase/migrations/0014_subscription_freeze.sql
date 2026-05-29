-- 0014_subscription_freeze.sql
-- Track when the current freeze began so unfreeze can compute days frozen and
-- shift end_date forward (pause-the-clock semantics).

alter table subscriptions
  add column frozen_at timestamptz;
