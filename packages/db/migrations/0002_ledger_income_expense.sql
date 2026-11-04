-- Income/expense ledger foundation. Transfer-specific structures are deferred
-- until D-04 is approved.

create table categories (
  id uuid primary key,
  wallet_id uuid not null references shared_wallets(id) on delete cascade,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (wallet_id, name)
);

create table transaction_records (
  id uuid primary key,
  wallet_id uuid not null references shared_wallets(id),
  account_id uuid not null references financial_accounts(id),
  creator_id uuid not null references app_users(id),
  category_id uuid references categories(id),
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null,
  amount_mad_minor bigint not null check (amount_mad_minor > 0),
  exchange_rate numeric(30, 12) not null check (exchange_rate > 0),
  rate_timestamp timestamptz,
  rate_source text,
  payment_method text not null check (payment_method in ('cash', 'card', 'bank_transfer', 'mobile_payment')),
  transaction_date date not null,
  note text,
  version integer not null default 1 check (version > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transaction_records_account_date_idx on transaction_records(account_id, transaction_date desc);
create index transaction_records_wallet_date_idx on transaction_records(wallet_id, transaction_date desc);

create table idempotency_keys (
  user_id uuid not null references app_users(id) on delete cascade,
  operation_key text not null,
  request_hash text not null,
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, operation_key)
);

create table audit_events (
  id uuid primary key,
  wallet_id uuid not null references shared_wallets(id),
  actor_id uuid not null references app_users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
