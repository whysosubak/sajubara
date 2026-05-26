-- 사주바라 결제/권한/유자 장부
-- 실결제 연동 전 기준 원장. 클라이언트 URL의 paid=1은 권한이 아니며,
-- 아래 entitlements / yuzu_wallets / yuzu_ledger가 최종 권한 소스가 된다.

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id text not null unique,
  payment_id text unique,
  provider text not null default 'portone',
  status text not null check (
    status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')
  ),
  plan text not null,
  product text not null,
  amount_krw integer not null check (amount_krw >= 0),
  yuzu_amount integer not null default 0 check (yuzu_amount >= 0),
  return_to text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.yuzu_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  paid_yuzu integer not null default 0 check (paid_yuzu >= 0),
  bonus_yuzu integer not null default 0 check (bonus_yuzu >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.yuzu_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null check (
    entry_type in ('charge', 'spend', 'grant', 'refund', 'adjust')
  ),
  yuzu_delta integer not null,
  amount_krw integer not null default 0 check (amount_krw >= 0),
  product text,
  scope_key text,
  order_id text references public.payment_orders(order_id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_key text not null,
  product text not null,
  scope_key text not null,
  source_type text not null default 'purchase',
  order_id text references public.payment_orders(order_id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, scope_key)
);

create or replace function public.increment_yuzu_wallet(
  target_user_id uuid,
  paid_delta integer default 0,
  bonus_delta integer default 0
)
returns table (paid_yuzu integer, bonus_yuzu integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.yuzu_wallets (user_id, paid_yuzu, bonus_yuzu, updated_at)
  values (
    target_user_id,
    greatest(paid_delta, 0),
    greatest(bonus_delta, 0),
    now()
  )
  on conflict (user_id) do update
    set paid_yuzu = public.yuzu_wallets.paid_yuzu + paid_delta,
        bonus_yuzu = public.yuzu_wallets.bonus_yuzu + bonus_delta,
        updated_at = now();

  return query
    select public.yuzu_wallets.paid_yuzu, public.yuzu_wallets.bonus_yuzu
    from public.yuzu_wallets
    where public.yuzu_wallets.user_id = target_user_id;
end;
$$;

revoke execute on function public.increment_yuzu_wallet(uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.increment_yuzu_wallet(uuid, integer, integer)
  to service_role;

create index if not exists payment_orders_user_id_idx
  on public.payment_orders(user_id);
create index if not exists payment_orders_status_idx
  on public.payment_orders(status);
create index if not exists yuzu_ledger_user_id_created_at_idx
  on public.yuzu_ledger(user_id, created_at desc);
create index if not exists entitlements_user_id_idx
  on public.entitlements(user_id);
create index if not exists entitlements_user_id_product_idx
  on public.entitlements(user_id, product);

alter table public.payment_orders enable row level security;
alter table public.yuzu_wallets enable row level security;
alter table public.yuzu_ledger enable row level security;
alter table public.entitlements enable row level security;

drop policy if exists "payment_orders_select_own" on public.payment_orders;
create policy "payment_orders_select_own"
  on public.payment_orders for select
  using (auth.uid() = user_id);

drop policy if exists "yuzu_wallets_select_own" on public.yuzu_wallets;
create policy "yuzu_wallets_select_own"
  on public.yuzu_wallets for select
  using (auth.uid() = user_id);

drop policy if exists "yuzu_ledger_select_own" on public.yuzu_ledger;
create policy "yuzu_ledger_select_own"
  on public.yuzu_ledger for select
  using (auth.uid() = user_id);

drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own"
  on public.entitlements for select
  using (auth.uid() = user_id);
