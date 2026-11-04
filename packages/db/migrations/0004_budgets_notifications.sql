create table budgets (
  id uuid primary key,
  wallet_id uuid not null references shared_wallets(id) on delete cascade,
  budget_scope_key text not null,
  category_id uuid references categories(id),
  month_start date not null,
  limit_mad_minor bigint not null check (limit_mad_minor > 0),
  threshold_percent integer not null default 80 check (threshold_percent between 1 and 100),
  current_mad_minor bigint not null default 0 check (current_mad_minor >= 0),
  threshold_state text not null default 'normal' check (threshold_state in ('normal', 'attention', 'exceeded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wallet_id, budget_scope_key, month_start)
);

create table notifications (
  id uuid primary key,
  wallet_id uuid not null references shared_wallets(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  event_type text not null,
  title text not null,
  body text not null,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx on notifications(user_id, created_at desc);
create unique index budget_threshold_notification_once on notifications(user_id, event_type, entity_id) where event_type = 'budget.threshold';
