-- Run in Supabase → SQL Editor. Creates per-user price alerts (USD targets for BTC / ETH / USDT).

create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null check (symbol in ('BTC', 'ETH', 'USDT')),
  direction text not null check (direction in ('above', 'below')),
  target_price numeric not null check (target_price > 0),
  is_active boolean not null default true,
  triggered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists price_alerts_user_id_idx on price_alerts (user_id);

alter table price_alerts enable row level security;

create policy "price_alerts_select_own"
  on price_alerts for select
  using (auth.uid() = user_id);

create policy "price_alerts_insert_own"
  on price_alerts for insert
  with check (auth.uid() = user_id);

create policy "price_alerts_update_own"
  on price_alerts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "price_alerts_delete_own"
  on price_alerts for delete
  using (auth.uid() = user_id);

comment on table price_alerts is 'Simulator price watches; compared to CoinGecko USD feed in the app.';
