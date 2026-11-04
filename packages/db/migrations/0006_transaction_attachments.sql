create table transaction_attachments (
  id uuid primary key,
  wallet_id uuid not null references shared_wallets(id) on delete cascade,
  transaction_id uuid not null references transaction_records(id) on delete cascade,
  uploader_id uuid not null references app_users(id),
  object_key text not null unique,
  original_filename text not null,
  detected_content_type text not null check (detected_content_type in ('image/jpeg', 'image/png', 'application/pdf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'clean', 'quarantined', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transaction_attachments_transaction_idx
  on transaction_attachments(transaction_id, created_at desc);
