import { describe, expect, it } from 'vitest';
import { demoStore } from './lib/demo-store';
import { formatMad, formatDate, signedAmount } from './lib/types';

describe('frontend financial presentation helpers', () => {
  it('formats MAD from integer minor units', () => {
    expect(formatMad(125050)).toContain('1.250,50');
  });

  it('uses the UTC date for Morocco-day display', () => {
    expect(formatDate('2026-11-04')).toMatch(/04/);
  });

  it('keeps transfers out of income and expense sign semantics', () => {
    expect(
      signedAmount({ kind: 'Transfer', amountMinor: 12500 } as never),
    ).toBe(-12500);
    expect(signedAmount({ kind: 'Refund', amountMinor: 12500 } as never)).toBe(
      12500,
    );
  });
});

describe('development demo adapter', () => {
  it('updates notification state through an explicit local adapter', () => {
    const unread = demoStore.notifications().find((item) => !item.read);
    expect(unread).toBeDefined();
    demoStore.markRead(unread!.id);
    expect(
      demoStore.notifications().find((item) => item.id === unread!.id)?.read,
    ).toBe(true);
  });

  it('creates a local budget with zero posted spend', () => {
    const budget = demoStore.addBudget({
      name: 'Test budget',
      limitMinor: 50000,
      period: 'November 2026',
    });
    expect(budget.spentMinor).toBe(0);
    expect(demoStore.budgets()).toContainEqual(budget);
  });
});
