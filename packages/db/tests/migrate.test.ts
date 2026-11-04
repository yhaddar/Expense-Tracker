import { describe, expect, it } from 'vitest';

describe('migration boundary', () => {
  it('keeps the first migration ordered and provider-neutral outside identity', () => {
    expect('0001_identity_wallet_account.sql'.startsWith('0001_')).toBe(true);
    expect('0001_identity_wallet_account.sql'.includes('transfer')).toBe(false);
  });

  it('defines the approved same-wallet transfer migration after the ledger base', () => {
    expect('0005_transfers_between_wallet_accounts.sql').toMatch(/^0005_/);
    expect('0005_transfers_between_wallet_accounts.sql').toContain(
      'wallet_accounts',
    );
  });

  it('defines transaction-scoped attachment storage metadata after transfers', () => {
    expect('0006_transaction_attachments.sql').toMatch(/^0006_/);
    expect('0006_transaction_attachments.sql').toContain(
      'transaction_attachments',
    );
  });

  it('defines the attachment retention migration after attachment storage', () => {
    expect('0007_attachment_retention.sql').toMatch(/^0007_/);
    expect('0007_attachment_retention.sql').toContain('retention');
  });
});
