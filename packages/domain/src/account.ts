import type { Money } from './money';

export type PostedActivity = {
  kind: 'income' | 'expense' | 'refund' | 'transfer_debit' | 'transfer_credit';
  amount: Money;
};

export function calculateBalance(
  openingBalance: Money,
  activities: readonly PostedActivity[],
): Money {
  return activities.reduce((balance, activity) => {
    const sign =
      activity.kind === 'income' ||
      activity.kind === 'refund' ||
      activity.kind === 'transfer_credit'
        ? 1n
        : -1n;
    if (
      balance.currency !== activity.amount.currency ||
      balance.scale !== activity.amount.scale
    )
      throw new Error('Activity currency is incompatible');
    return { ...balance, minor: balance.minor + sign * activity.amount.minor };
  }, openingBalance);
}

export function moroccoUtcDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}
