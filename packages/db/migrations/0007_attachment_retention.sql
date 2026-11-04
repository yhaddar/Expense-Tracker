alter table transaction_attachments
  add column retention_until timestamptz;

create index transaction_attachments_retention_idx
  on transaction_attachments(retention_until)
  where retention_until is not null;
