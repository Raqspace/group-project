-- Run this in the Supabase SQL editor (Dashboard → SQL) so new wallets can store
-- a simulator recovery phrase. Table name must match your project (often "Wallet" with capital W).

alter table if exists "Wallet"
  add column if not exists recovery_phrase text;

comment on column "Wallet".recovery_phrase is 'Simulator teaching phrase only; not for production key custody.';
