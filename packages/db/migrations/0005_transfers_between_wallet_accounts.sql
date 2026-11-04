-- Transfers connect two users' existing financial accounts in one Shared Wallet.
-- Each transfer is two linked ledger legs and is excluded from income/expense totals.

alter table transaction_records
  drop constraint transaction_records_transaction_type_check;

alter table transaction_records
  add constraint transaction_records_transaction_type_check
  check (transaction_type in ('income', 'expense', 'refund', 'transfer_debit', 'transfer_credit'));

alter table transaction_records
  add column transfer_group_id uuid,
  add column linked_transaction_id uuid references transaction_records(id);

alter table transaction_records
  add constraint transaction_records_transfer_shape_check
  check (
    (transaction_type in ('transfer_debit', 'transfer_credit')) =
      (transfer_group_id is not null and linked_transaction_id is not null)
  );

create unique index transaction_records_transfer_group_type_unique
  on transaction_records(transfer_group_id, transaction_type)
  where transfer_group_id is not null;

create index transaction_records_transfer_group_idx
  on transaction_records(transfer_group_id);
