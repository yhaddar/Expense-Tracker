-- Refund and recurring transaction structures. No transfer-specific model.

alter table transaction_records drop constraint transaction_records_transaction_type_check;
alter table transaction_records add constraint transaction_records_transaction_type_check check (transaction_type in ('income', 'expense', 'refund'));
alter table transaction_records add column original_transaction_id uuid references transaction_records(id);
alter table transaction_records add column recurring_template_id uuid;

create table recurring_templates (
  id uuid primary key,
  wallet_id uuid not null references shared_wallets(id) on delete cascade,
  account_id uuid not null references financial_accounts(id),
  creator_id uuid not null references app_users(id),
  category_id uuid references categories(id),
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null,
  amount_mad_minor bigint not null check (amount_mad_minor > 0),
  exchange_rate numeric(30, 12) not null check (exchange_rate > 0),
  payment_method text not null check (payment_method in ('cash', 'card', 'bank_transfer', 'mobile_payment')),
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  next_occurrence_date date not null,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table transaction_records add constraint transaction_records_recurring_template_date_unique unique (recurring_template_id, transaction_date);
alter table transaction_records add constraint transaction_records_refund_requires_original check ((transaction_type = 'refund') = (original_transaction_id is not null));
