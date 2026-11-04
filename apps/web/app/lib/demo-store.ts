'use client';

import {
  Budget,
  initialBudgets,
  initialMembers,
  initialNotifications,
  initialTransactions,
  NotificationItem,
  Transaction,
  WalletMember,
} from './types';

let transactions = [...initialTransactions];
let budgets = [...initialBudgets];
let notifications = [...initialNotifications];
let members = [...initialMembers];

export const demoStore = {
  transactions: () => transactions,
  budgets: () => budgets,
  notifications: () => notifications,
  members: () => members,
  addTransaction(input: Omit<Transaction, 'id'>) {
    const transaction = { ...input, id: `tx-${Date.now()}` };
    transactions = [transaction, ...transactions];
    return transaction;
  },
  addBudget(
    input: Omit<Budget, 'id' | 'spentMinor' | 'category'> & {
      category?: string | undefined;
    },
  ) {
    const budget: Budget = {
      name: input.name,
      limitMinor: input.limitMinor,
      period: input.period,
      id: `budget-${Date.now()}`,
      spentMinor: 0,
    };
    if (input.category) budget.category = input.category;
    budgets = [budget, ...budgets];
    return budget;
  },
  markRead(id: string) {
    notifications = notifications.map((item) =>
      item.id === id ? { ...item, read: true } : item,
    );
  },
  markAllRead() {
    notifications = notifications.map((item) => ({ ...item, read: true }));
  },
  updateMemberRole(id: string, role: string) {
    members = members.map((member) =>
      member.id === id ? { ...member, role } : member,
    );
  },
};

export type DemoSnapshot = {
  transactions: Transaction[];
  budgets: Budget[];
  notifications: NotificationItem[];
  members: WalletMember[];
};
