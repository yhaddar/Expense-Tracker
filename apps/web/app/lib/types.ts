export type TransactionKind = 'Income' | 'Expense' | 'Refund' | 'Transfer';
export type TransactionStatus = 'Posted' | 'Pending';

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  kind: TransactionKind;
  amountMinor: number;
  status: TransactionStatus;
  account: string;
  note?: string;
};

export type Budget = {
  id: string;
  name: string;
  spentMinor: number;
  limitMinor: number;
  period: string;
  category?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  tone: 'info' | 'warning' | 'success';
};

export type WalletMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Revoked';
};

export const demoEnabled = process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true';

export const initialTransactions: Transaction[] = [
  {
    id: 'tx-1',
    date: '2026-11-03',
    description: 'October salary',
    category: 'Salary',
    kind: 'Income',
    amountMinor: 1250000,
    status: 'Posted',
    account: 'Main account',
  },
  {
    id: 'tx-2',
    date: '2026-11-02',
    description: 'Grocery market',
    category: 'Groceries',
    kind: 'Expense',
    amountMinor: 18450,
    status: 'Posted',
    account: 'Main account',
  },
  {
    id: 'tx-3',
    date: '2026-11-01',
    description: 'Returned headphones',
    category: 'Shopping',
    kind: 'Refund',
    amountMinor: 32000,
    status: 'Posted',
    account: 'Main account',
  },
  {
    id: 'tx-4',
    date: '2026-10-30',
    description: 'Apartment rent',
    category: 'Housing',
    kind: 'Expense',
    amountMinor: 420000,
    status: 'Posted',
    account: 'Main account',
  },
  {
    id: 'tx-5',
    date: '2026-10-29',
    description: 'Transfer to Samira',
    category: 'Transfer',
    kind: 'Transfer',
    amountMinor: 125000,
    status: 'Posted',
    account: 'Main account',
  },
  {
    id: 'tx-6',
    date: '2026-10-28',
    description: 'Electricity bill',
    category: 'Utilities',
    kind: 'Expense',
    amountMinor: 7600,
    status: 'Pending',
    account: 'Main account',
  },
];

export const initialBudgets: Budget[] = [
  {
    id: 'budget-1',
    name: 'Household essentials',
    category: 'Groceries',
    spentMinor: 18450,
    limitMinor: 250000,
    period: 'November 2026',
  },
  {
    id: 'budget-2',
    name: 'Transport',
    category: 'Transport',
    spentMinor: 92500,
    limitMinor: 150000,
    period: 'November 2026',
  },
  {
    id: 'budget-3',
    name: 'All spending',
    spentMinor: 538000,
    limitMinor: 950000,
    period: 'November 2026',
  },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'note-1',
    title: 'Household essentials are at 74%',
    message: 'You have 65,500 MAD remaining in this month’s category budget.',
    date: 'Today, 09:30',
    read: false,
    tone: 'warning',
  },
  {
    id: 'note-2',
    title: 'Recurring transaction generated',
    message: 'Your November apartment rent was posted successfully.',
    date: 'Yesterday, 18:10',
    read: false,
    tone: 'success',
  },
  {
    id: 'note-3',
    title: 'Welcome to Atlas Ledger',
    message: 'Invite your household members to start sharing visibility.',
    date: '28 Oct 2026',
    read: true,
    tone: 'info',
  },
];

export const initialMembers: WalletMember[] = [
  {
    id: 'member-1',
    name: 'You',
    email: 'you@example.test',
    role: 'Admin',
    status: 'Active',
  },
  {
    id: 'member-2',
    name: 'Samira El Idrissi',
    email: 'samira@example.test',
    role: 'Member',
    status: 'Active',
  },
];

export function formatMad(amountMinor: number) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function signedAmount(transaction: Transaction) {
  return transaction.kind === 'Income' || transaction.kind === 'Refund'
    ? transaction.amountMinor
    : -transaction.amountMinor;
}
