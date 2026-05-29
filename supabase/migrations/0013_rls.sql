-- 0013_rls.sql
-- Row Level Security: enforce gym_id isolation on every tenant-scoped table.
--
-- The API connects with the service role, which BYPASSES RLS — that is
-- deliberate: the backend needs cross-tenant bootstrap operations (gym
-- onboarding, login lookups by email+gym before a token exists). The backend
-- guarantees isolation by (a) filtering every query by the JWT's gym_id and
-- (b) calling set_gym_context(gym_id) per request. RLS here is the backstop for
-- any non-service-role connection (e.g. a frontend using the anon key directly):
-- those roles are hard-constrained to a single tenant. We therefore enable RLS
-- but do NOT FORCE it, so the trusted service role retains its bypass.

-- Helper: stash the current request's gym_id in a GUC for policies to read.
create or replace function set_gym_context(p_gym_id uuid)
returns void
language sql
as $$
  select set_config('app.gym_id', p_gym_id::text, true);
$$;

-- Helper: read it back, null-safe.
create or replace function current_gym_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.gym_id', true), '')::uuid;
$$;

do $$
declare
  t text;
  scoped_tables text[] := array[
    'members','subscriptions','check_ins','wallet_accounts','wallet_transactions',
    'products','machines','help_requests','cycling_classes','bikes','cycling_bookings',
    'notifications','notification_inbox','device_tokens','staff','payment_transactions',
    'member_stats'
  ];
begin
  foreach t in array scoped_tables loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy %1$s_gym_isolation on %1$I
        using (gym_id = current_gym_id())
        with check (gym_id = current_gym_id());
    $f$, t);
  end loop;
end;
$$;

-- gyms has no gym_id; isolate on its own id instead.
alter table gyms enable row level security;
create policy gyms_self_isolation on gyms
  using (id = current_gym_id())
  with check (id = current_gym_id());
