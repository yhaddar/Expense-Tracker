import { describe, expect, it } from 'vitest';
import { isValidMoroccoDate, validateTransactionInput } from './ledger.service';

const valid = {
  transactionType: 'expense' as const,
  amountMinor: '1250',
  currency: 'MAD',
  amountMadMinor: '1250',
  exchangeRate: '1',
  paymentMethod: 'card' as const,
  transactionDate: '2026-11-04',
};

describe('ledger request validation', () => {
  it('rejects impossible calendar dates instead of accepting a regex match', () => {
    expect(isValidMoroccoDate('2026-02-31')).toBe(false);
  });

  it('rejects unsupported payment methods with a client error', () => {
    expect(() =>
      validateTransactionInput({ ...valid, paymentMethod: 'crypto' as never }),
    ).toThrow('Payment method is invalid');
  });

  it('accepts exact minor-unit amounts and valid Morocco UTC dates', () => {
    expect(() => validateTransactionInput(valid)).not.toThrow();
  });
});
