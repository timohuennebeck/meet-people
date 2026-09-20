-- The two jobs that keep the data honest without anyone opening the app.
--
-- Both are plain SQL functions rather than edge functions: neither needs the
-- network, a secret or a deploy step, and `pg_cron` can call them directly.
-- The three that genuinely do need the outside world — the RevenueCat webhook,
-- the entitlement sync and the storage purge — stay edge functions.

create extension if not exists pg_cron;

-- Materialise the next occurrence of every active series, ten days ahead. Once a
-- day is plenty: the horizon is far longer than the gap between runs, so a
-- missed night costs nothing.
select cron.schedule(
  'materialise-plan-series',
  '7 3 * * *',
  $$select private.materialise_plan_series(10)$$
);

-- Derive attendance from cancellation discipline once a plan's end time has
-- passed. Every half hour, because the profile stat should settle the same
-- evening rather than the next morning.
select cron.schedule(
  'close-stale-plans',
  '*/30 * * * *',
  $$select private.close_stale_plans()$$
);
