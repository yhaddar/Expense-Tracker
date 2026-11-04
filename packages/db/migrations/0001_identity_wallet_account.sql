-- Reviewed migration: identity, Shared Wallet membership, roles, sessions,
-- and the one-account-per-user invariant. No secrets or provider credentials.

create table app_users (
  id uuid primary key,
  oidc_subject text not null unique,
  email text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table shared_wallets (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table roles (
  id uuid primary key,
  wallet_id uuid not null references shared_wallets(id),
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (wallet_id, name)
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission text not null,
  primary key (role_id, permission)
);

create table wallet_memberships (
  wallet_id uuid not null references shared_wallets(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  role_id uuid not null references roles(id),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  primary key (wallet_id, user_id)
);

create table user_sessions (
  id uuid primary key,
  user_id uuid not null references app_users(id) on delete cascade,
  oidc_session_id text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table financial_accounts (
  id uuid primary key,
  user_id uuid not null unique references app_users(id) on delete restrict,
  opening_balance_minor bigint not null,
  base_currency char(3) not null default 'MAD' check (base_currency = 'MAD'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wallet_memberships_user_idx on wallet_memberships(user_id);
create index user_sessions_active_idx on user_sessions(user_id, expires_at) where revoked_at is null;
