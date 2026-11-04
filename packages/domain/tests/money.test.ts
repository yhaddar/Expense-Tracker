import { describe, expect, it } from 'vitest';
import { addMoney } from '../src/money';
import { calculateBalance, moroccoUtcDay } from '../src/account';
import {
  canMutateTransaction,
  defaultMemberPermissions,
  hasPermission,
} from '../src/permissions';

describe('money', () => {
  it('adds exact minor units without floating point arithmetic', () => {
    expect(
      addMoney(
        { minor: 100n, currency: 'MAD', scale: 2 },
        { minor: 25n, currency: 'MAD', scale: 2 },
      ),
    ).toEqual({ minor: 125n, currency: 'MAD', scale: 2 });
  });
});

describe('authorization baseline', () => {
  it('denies by default and permits only creator-owned mutations for members', () => {
    const member = {
      userId: 'u1',
      role: 'member' as const,
      permissions: new Set(['transactions:edit:own'] as const),
    };
    expect(hasPermission(member, 'members:manage')).toBe(false);
    expect(canMutateTransaction(member, 'u1', 'edit')).toBe(true);
    expect(canMutateTransaction(member, 'u2', 'edit')).toBe(false);
  });

  it('keeps the default member role least-privilege', () => {
    expect(defaultMemberPermissions).toEqual(
      expect.arrayContaining([
        'wallet:read',
        'transactions:create',
        'transactions:edit:own',
        'transactions:archive:own',
      ]),
    );
    expect(defaultMemberPermissions).not.toContain('roles:manage');
    expect(defaultMemberPermissions).not.toContain('transactions:edit:any');
    expect(defaultMemberPermissions).not.toContain('account:manage');
  });
});

describe('account balance', () => {
  it('calculates from opening balance and posted activity using exact minor units', () => {
    const mad = (minor: bigint) => ({ minor, currency: 'MAD', scale: 2 });
    expect(
      calculateBalance(mad(10000n), [
        { kind: 'income', amount: mad(5000n) },
        { kind: 'expense', amount: mad(1250n) },
        { kind: 'transfer_debit', amount: mad(1000n) },
        { kind: 'transfer_credit', amount: mad(250n) },
        { kind: 'refund', amount: mad(100n) },
      ]),
    ).toEqual(mad(13100n));
  });

  it('uses the UTC calendar day for Morocco date-only behavior', () => {
    expect(moroccoUtcDay(new Date('2026-11-04T23:30:00-01:00'))).toBe(
      '2026-11-05',
    );
  });
});
