-- barasaju LLM report cache
-- Stores all generated reports keyed by a hash of (scope, birth identity, context).
-- No PII (no name) in cache_key — name is treated as a render-time variable.

create table if not exists public.reports (
  cache_key text primary key,
  kind text not null,                  -- 'oneLiner' | 'section' | 'daewoonReport' | 'yearlyOverview' | 'yearDetail'
  tier text not null default 'lite',   -- 'lite' | 'full'
  data jsonb not null,
  created_at timestamptz not null default now(),
  hit_count int not null default 0
);

create index if not exists reports_kind_idx on public.reports(kind);
create index if not exists reports_created_at_idx on public.reports(created_at);

alter table public.reports enable row level security;

-- The cache is non-sensitive (no PII). Allow anyone (authenticated or anon) to read & insert.
-- Server inserts via anon key; future migration can tighten to a service_role write path.
drop policy if exists "reports_read_all" on public.reports;
create policy "reports_read_all"
  on public.reports
  for select
  using (true);

drop policy if exists "reports_insert_all" on public.reports;
create policy "reports_insert_all"
  on public.reports
  for insert
  with check (true);

drop policy if exists "reports_update_hit" on public.reports;
create policy "reports_update_hit"
  on public.reports
  for update
  using (true)
  with check (true);
