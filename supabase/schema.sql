create table public.invites (
  id uuid primary key default gen_random_uuid(),
  code uuid not null unique default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  denied boolean default false
);

alter table public.invites enable row level security;

