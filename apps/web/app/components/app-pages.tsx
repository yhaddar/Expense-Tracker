'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AppLink, Badge, PageHeader } from './app-shell';
import { demoStore } from '../lib/demo-store';
import {
  Budget,
  demoEnabled,
  formatDate,
  formatMad,
  NotificationItem,
  signedAmount,
  Transaction,
  TransactionKind,
} from '../lib/types';

function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        ◎
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </section>
  );
}

function Money({
  amountMinor,
  signed = false,
}: {
  amountMinor: number;
  signed?: boolean;
}) {
  const prefix = signed && amountMinor > 0 ? '+' : '';
  return (
    <span
      className={
        amountMinor < 0
          ? 'amount-negative'
          : amountMinor > 0
            ? 'amount-positive'
            : ''
      }
    >
      {prefix}
      {formatMad(amountMinor)}
    </span>
  );
}

export function OverviewPage() {
  const transactions = demoEnabled ? demoStore.transactions() : [];
  const balance =
    transactions.reduce(
      (total, transaction) => total + signedAmount(transaction),
      0,
    ) + 1000000;
  const income = transactions
    .filter((item) => item.kind === 'Income')
    .reduce((sum, item) => sum + item.amountMinor, 0);
  const expenses = transactions
    .filter((item) => item.kind === 'Expense')
    .reduce((sum, item) => sum + item.amountMinor, 0);
  const refunds = transactions
    .filter((item) => item.kind === 'Refund')
    .reduce((sum, item) => sum + item.amountMinor, 0);
  return (
    <>
      <PageHeader
        eyebrow="Shared Wallet"
        title="Overview"
        description="A calm view of your household money this month."
        action={
          <AppLink className="button" href="/transactions/new">
            ＋ Add transaction
          </AppLink>
        }
      />
      <section className="hero-card">
        <div>
          <p className="eyebrow">Current balance</p>
          <strong>{formatMad(balance)}</strong>
          <p>
            Opening balance plus posted activity. Transfers are excluded from
            income and expense totals.
          </p>
        </div>
        <AppLink className="button button-light" href="/transactions">
          View ledger
        </AppLink>
      </section>
      <section className="metrics" aria-label="Monthly summary">
        <Metric
          label="Income"
          value={income}
          detail="Posted this month"
          tone="positive"
        />
        <Metric
          label="Gross expenses"
          value={expenses}
          detail="Before refunds"
          tone="negative"
        />
        <Metric
          label="Refunds"
          value={refunds}
          detail="Returned to balance"
          tone="positive"
        />
        <Metric
          label="Net expenses"
          value={expenses - refunds}
          detail="Expenses less refunds"
        />
      </section>
      <div className="two-column overview-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest activity</p>
              <h2>Recent transactions</h2>
            </div>
            <AppLink href="/transactions">See all</AppLink>
          </div>
          {transactions.length ? (
            <TransactionTable transactions={transactions.slice(0, 4)} />
          ) : (
            <EmptyState title="Your household ledger starts here">
              Connect the API or enable the development demo to preview the
              transaction workflow.
            </EmptyState>
          )}
        </section>
        <BudgetSummary />
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone?: 'positive' | 'negative';
}) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong className={tone ? `amount-${tone}` : ''}>
        {formatMad(value)}
      </strong>
      <small>{detail}</small>
    </article>
  );
}

export function TransactionsPage() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'All' | TransactionKind>('All');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'largest'>('newest');
  const all = demoEnabled ? demoStore.transactions() : [];
  const transactions = useMemo(
    () =>
      all
        .filter(
          (item) =>
            (kind === 'All' || item.kind === kind) &&
            `${item.description} ${item.category}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === 'largest'
            ? b.amountMinor - a.amountMinor
            : sort === 'oldest'
              ? a.date.localeCompare(b.date)
              : b.date.localeCompare(a.date),
        ),
    [all, kind, query, sort],
  );
  return (
    <>
      <PageHeader
        eyebrow="Ledger"
        title="Transactions"
        description="Search and review posted activity across the Shared Wallet."
        action={
          <AppLink className="button" href="/transactions/new">
            ＋ Add transaction
          </AppLink>
        }
      />
      <section className="toolbar" aria-label="Transaction filters">
        <label className="search-field">
          <span className="sr-only">Search transactions</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search description or category"
          />
        </label>
        <label>
          <span className="sr-only">Filter by type</span>
          <select
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as 'All' | TransactionKind)
            }
          >
            <option>All</option>
            <option>Income</option>
            <option>Expense</option>
            <option>Refund</option>
            <option>Transfer</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Sort transactions</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="largest">Largest amount</option>
          </select>
        </label>
      </section>
      {transactions.length ? (
        <section className="panel table-panel">
          <TransactionTable transactions={transactions} />
        </section>
      ) : (
        <EmptyState
          title={
            all.length ? 'No matching transactions' : 'No transactions yet'
          }
        >
          Try another search or add the first transaction. Transfers and refunds
          remain separate from expense totals.
        </EmptyState>
      )}
    </>
  );
}

export function TransactionTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <div className="table-wrap">
      <table>
        <caption className="sr-only">Transactions</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col" className="numeric">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => (
            <tr key={item.id}>
              <td>{formatDate(item.date)}</td>
              <td>
                <AppLink
                  className="table-link"
                  href={`/transactions/${item.id}`}
                >
                  {item.description}
                </AppLink>
                <small>{item.category}</small>
              </td>
              <td>
                <Badge
                  tone={
                    item.kind === 'Expense'
                      ? 'negative'
                      : item.kind === 'Income' || item.kind === 'Refund'
                        ? 'positive'
                        : 'neutral'
                  }
                >
                  {item.kind}
                </Badge>
              </td>
              <td>
                <Badge tone={item.status === 'Posted' ? 'positive' : 'warning'}>
                  {item.status}
                </Badge>
              </td>
              <td className="numeric">
                <Money
                  amountMinor={
                    item.kind === 'Expense' || item.kind === 'Transfer'
                      ? -item.amountMinor
                      : item.amountMinor
                  }
                  signed
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TransactionFormPage({ editId }: { editId?: string }) {
  const existing =
    editId && demoEnabled
      ? demoStore.transactions().find((item) => item.id === editId)
      : undefined;
  const [kind, setKind] = useState<TransactionKind>(
    existing?.kind ?? 'Expense',
  );
  const [description, setDescription] = useState(existing?.description ?? '');
  const [amount, setAmount] = useState(
    existing ? String(existing.amountMinor / 100) : '',
  );
  const [category, setCategory] = useState(existing?.category ?? 'Groceries');
  const [date, setDate] = useState(existing?.date ?? '2026-11-04');
  const [note, setNote] = useState(existing?.note ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!description.trim() || !Number.isFinite(value) || value <= 0) {
      setError('Enter a description and an amount greater than zero.');
      return;
    }
    if (!demoEnabled) {
      setError(
        'The API is not connected in this environment. Enable demo mode or configure the API before saving.',
      );
      return;
    }
    demoStore.addTransaction({
      date,
      description: description.trim(),
      category,
      kind,
      amountMinor: Math.round(value * 100),
      status: 'Posted',
      account: 'Main account',
      note,
    });
    setSubmitted(true);
    setError('');
  };
  if (submitted)
    return (
      <EmptyState title="Transaction ready in demo mode">
        <p className="success-copy">
          The local demo ledger was updated. No backend record was created.
        </p>
        <AppLink className="button" href="/transactions">
          Return to transactions
        </AppLink>
      </EmptyState>
    );
  return (
    <>
      <PageHeader
        eyebrow="Ledger"
        title={editId ? 'Edit transaction' : 'Add transaction'}
        description="Financial validation and posting remain authoritative in the API."
      />
      <form className="form-card" onSubmit={submit} noValidate>
        <div className="demo-form-note">
          {demoEnabled
            ? 'Demo mode: this form updates local browser state only.'
            : 'API connection required before this form can save.'}
        </div>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="form-grid">
          <label>
            Type
            <select
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as TransactionKind)
              }
            >
              <option>Expense</option>
              <option>Income</option>
              <option>Refund</option>
              <option>Transfer</option>
            </select>
          </label>
          <label>
            Amount (MAD)
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label>
            Description
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Weekly groceries"
            />
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>Groceries</option>
              <option>Housing</option>
              <option>Utilities</option>
              <option>Transport</option>
              <option>Shopping</option>
              <option>Salary</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Date (Morocco UTC day)
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label>
            Payment method
            <select>
              <option>Cash</option>
              <option>Credit / debit card</option>
              <option>Bank transfer</option>
              <option>Mobile payment</option>
            </select>
          </label>
          <label className="full-field">
            Note (optional)
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder="Add context for your household"
            />
          </label>
        </div>
        <div className="form-actions">
          <AppLink
            className="button button-secondary"
            href={editId ? `/transactions/${editId}` : '/transactions'}
          >
            Cancel
          </AppLink>
          <button className="button" type="submit">
            {editId ? 'Save changes' : 'Create transaction'}
          </button>
        </div>
      </form>
    </>
  );
}

export function TransactionDetailPage({ id }: { id: string }) {
  const transaction = demoEnabled
    ? demoStore.transactions().find((item) => item.id === id)
    : undefined;
  if (!transaction)
    return (
      <EmptyState title="Transaction unavailable">
        This transaction is not available in the current demo session or API
        connection.
      </EmptyState>
    );
  return (
    <>
      <PageHeader
        eyebrow="Transaction detail"
        title={transaction.description}
        description={`${formatDate(transaction.date)} · ${transaction.category}`}
        action={
          <AppLink className="button" href={`/transactions/${id}/edit`}>
            Edit transaction
          </AppLink>
        }
      />
      <section className="detail-grid">
        <div className="panel detail-amount">
          <p className="eyebrow">Posted amount</p>
          <strong>
            <Money
              amountMinor={
                transaction.kind === 'Expense' ||
                transaction.kind === 'Transfer'
                  ? -transaction.amountMinor
                  : transaction.amountMinor
              }
              signed
            />
          </strong>
          <Badge
            tone={transaction.kind === 'Expense' ? 'negative' : 'positive'}
          >
            {transaction.kind}
          </Badge>
        </div>
        <div className="panel">
          <dl className="detail-list">
            <div>
              <dt>Date</dt>
              <dd>{formatDate(transaction.date)}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{transaction.category}</dd>
            </div>
            <div>
              <dt>Account</dt>
              <dd>{transaction.account}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{transaction.status}</dd>
            </div>
            <div>
              <dt>Note</dt>
              <dd>{transaction.note || 'No note added'}</dd>
            </div>
          </dl>
        </div>
      </section>
      <section className="danger-zone">
        <div>
          <h2>Archive transaction</h2>
          <p>
            Archived financial history remains auditable and is removed from
            active lists.
          </p>
        </div>
        <button
          className="button button-danger"
          type="button"
          onClick={() =>
            window.alert(
              'Archive requires the authenticated API and current transaction version.',
            )
          }
        >
          Archive
        </button>
      </section>
    </>
  );
}

function BudgetSummary() {
  const budgets = demoEnabled ? demoStore.budgets() : [];
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Plan ahead</p>
          <h2>Budgets</h2>
        </div>
        <AppLink href="/budgets">Manage</AppLink>
      </div>
      {budgets.slice(0, 3).map((budget) => (
        <BudgetRow budget={budget} key={budget.id} />
      ))}
    </section>
  );
}
function BudgetRow({ budget }: { budget: Budget }) {
  const percent = Math.min(
    100,
    Math.round((budget.spentMinor / budget.limitMinor) * 100),
  );
  return (
    <div className="budget-row">
      <div>
        <strong>{budget.name}</strong>
        <span>
          {formatMad(budget.spentMinor)} of {formatMad(budget.limitMinor)}
        </span>
      </div>
      <div className="progress">
        <span style={{ width: `${percent}%` }} />
      </div>
      <small>{percent}% used</small>
    </div>
  );
}

export function BudgetsPage() {
  const budgets = demoEnabled ? demoStore.budgets() : [];
  return (
    <>
      <PageHeader
        eyebrow="Planning"
        title="Budgets"
        description="Keep shared spending visible before the month gets away from you."
        action={
          <AppLink className="button" href="/budgets/new">
            ＋ Create budget
          </AppLink>
        }
      />
      {budgets.length ? (
        <div className="budget-grid">
          {budgets.map((budget) => (
            <section className="panel budget-card" key={budget.id}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{budget.period}</p>
                  <h2>{budget.name}</h2>
                </div>
                <Badge
                  tone={
                    budget.spentMinor / budget.limitMinor > 0.9
                      ? 'warning'
                      : 'positive'
                  }
                >
                  {Math.round((budget.spentMinor / budget.limitMinor) * 100)}%
                  used
                </Badge>
              </div>
              <BudgetRow budget={budget} />
              <p className="muted">
                {budget.category
                  ? `${budget.category} category budget`
                  : 'Global monthly budget'}
              </p>
              <AppLink
                className="text-button"
                href={`/budgets/${budget.id}/edit`}
              >
                Edit budget →
              </AppLink>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title="Set your first budget">
          Budget thresholds are ready for the API-backed workflow. Create one in
          demo mode to preview the experience.
        </EmptyState>
      )}
    </>
  );
}

export function BudgetFormPage() {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !limit || Number(limit) <= 0) {
      setError('Add a budget name and a positive monthly limit.');
      return;
    }
    if (!demoEnabled) {
      setError('The API is not connected in this environment.');
      return;
    }
    demoStore.addBudget({
      name,
      category: category || undefined,
      limitMinor: Math.round(Number(limit) * 100),
      period: 'November 2026',
    });
    setDone(true);
  };
  if (done)
    return (
      <EmptyState title="Budget added in demo mode">
        <p className="success-copy">
          The local budget was created. It is not persisted to the backend.
        </p>
        <AppLink className="button" href="/budgets">
          View budgets
        </AppLink>
      </EmptyState>
    );
  return (
    <>
      <PageHeader
        eyebrow="Planning"
        title="Create budget"
        description="Set a monthly MAD limit for the household or one category."
      />
      <form className="form-card" onSubmit={submit} noValidate>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="form-grid">
          <label>
            Budget name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Family groceries"
            />
          </label>
          <label>
            Monthly limit (MAD)
            <input
              inputMode="decimal"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              placeholder="2500.00"
            />
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All spending</option>
              <option>Groceries</option>
              <option>Housing</option>
              <option>Transport</option>
              <option>Utilities</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <AppLink className="button button-secondary" href="/budgets">
            Cancel
          </AppLink>
          <button className="button" type="submit">
            Create budget
          </button>
        </div>
      </form>
    </>
  );
}

export function ReportsPage() {
  const transactions = demoEnabled ? demoStore.transactions() : [];
  const byCategory = transactions
    .filter((item) => item.kind === 'Expense')
    .reduce<
      Record<string, number>
    >((acc, item) => ({ ...acc, [item.category]: (acc[item.category] ?? 0) + item.amountMinor }), {});
  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Understand your household patterns without changing the authoritative ledger."
      />
      <div className="report-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={() =>
            window.alert(
              'Export will be connected after report definitions and layouts are approved.',
            )
          }
        >
          Export CSV
        </button>
        <button
          className="button button-secondary"
          type="button"
          onClick={() =>
            window.alert(
              'Export will be connected after report definitions and layouts are approved.',
            )
          }
        >
          Export PDF
        </button>
      </div>
      {transactions.length ? (
        <div className="two-column">
          <section className="panel">
            <p className="eyebrow">November 2026</p>
            <h2>Expense categories</h2>
            {Object.entries(byCategory).map(([category, total]) => (
              <div className="report-row" key={category}>
                <span>{category}</span>
                <strong>{formatMad(total)}</strong>
              </div>
            ))}
          </section>
          <section className="panel report-callout">
            <p className="eyebrow">Read-only insight</p>
            <h2>Transfers are not expenses</h2>
            <p>
              Linked transfer legs move value between household accounts and
              stay out of income and expense totals.
            </p>
            <AppLink href="/transactions?type=Transfer">
              Review transfers →
            </AppLink>
          </section>
        </div>
      ) : (
        <EmptyState title="Reports are waiting for data">
          Add or connect posted transactions to preview category totals. Export
          layouts remain gated by the approved report definition.
        </EmptyState>
      )}
    </>
  );
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(
    demoEnabled ? demoStore.notifications() : [],
  );
  const markRead = (id: string) => {
    demoStore.markRead(id);
    setItems(demoStore.notifications());
  };
  const markAll = () => {
    demoStore.markAllRead();
    setItems(demoStore.notifications());
  };
  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Durable in-app updates for your Shared Wallet."
        action={
          items.some((item) => !item.read) ? (
            <button
              className="button button-secondary"
              type="button"
              onClick={markAll}
            >
              Mark all read
            </button>
          ) : undefined
        }
      />
      {items.length ? (
        <section className="notification-list">
          {items.map((item) => (
            <article
              className={`notification ${item.read ? 'read' : ''}`}
              key={item.id}
            >
              <span
                className={`notification-icon ${item.tone}`}
                aria-hidden="true"
              >
                {item.tone === 'warning'
                  ? '!'
                  : item.tone === 'success'
                    ? '✓'
                    : 'i'}
              </span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.message}</p>
                <small>{item.date}</small>
              </div>
              {!item.read && (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => markRead(item.id)}
                >
                  Mark read
                </button>
              )}
            </article>
          ))}
        </section>
      ) : (
        <EmptyState title="You’re all caught up">
          New budget, transaction, and recurring activity updates will appear
          here.
        </EmptyState>
      )}
    </>
  );
}

export function WalletPage() {
  const [members, setMembers] = useState(
    demoEnabled ? demoStore.members() : [],
  );
  const [message, setMessage] = useState('');
  const changeRole = (id: string, role: string) => {
    demoStore.updateMemberRole(id, role);
    setMembers(demoStore.members());
    setMessage('Role change staged in demo mode only.');
  };
  return (
    <>
      <PageHeader
        eyebrow="Shared Wallet"
        title="Members & permissions"
        description="Manage who can see and act on household finances."
        action={
          <button
            className="button"
            type="button"
            onClick={() =>
              setMessage('Invitation flow requires the authenticated API.')
            }
          >
            ＋ Invite member
          </button>
        }
      />
      {message && (
        <div className="form-success" role="status">
          {message}
        </div>
      )}
      {members.length ? (
        <section className="panel table-panel">
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Shared Wallet members</caption>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.name}</strong>
                      <small>{member.email}</small>
                    </td>
                    <td>
                      <select
                        value={member.role}
                        onChange={(event) =>
                          changeRole(member.id, event.target.value)
                        }
                        disabled={member.name === 'You'}
                      >
                        <option>Admin</option>
                        <option>Member</option>
                        <option>Viewer</option>
                      </select>
                    </td>
                    <td>
                      <Badge
                        tone={
                          member.status === 'Active' ? 'positive' : 'negative'
                        }
                      >
                        {member.status}
                      </Badge>
                    </td>
                    <td>
                      <span className="muted">Explicit permissions</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState title="Connect your Shared Wallet">
          Members and explicit roles are loaded from the protected API.
        </EmptyState>
      )}
      <section className="panel permission-note">
        <p className="eyebrow">Security boundary</p>
        <h2>Permissions are enforced by the API</h2>
        <p>
          Changing a select here never grants access by itself. The
          authenticated backend remains responsible for authorization, audit
          events, and revocation.
        </p>
      </section>
    </>
  );
}

export function ProfilePage() {
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Identity and account details for this Shared Wallet."
      />
      <section className="profile-card panel">
        <div className="avatar large">H</div>
        <div>
          <h2>Hatim</h2>
          <p className="muted">you@example.test</p>
          <Badge tone="positive">Admin</Badge>
        </div>
      </section>
      <section className="panel">
        <h2>Financial account</h2>
        <dl className="detail-list">
          <div>
            <dt>Base currency</dt>
            <dd>MAD · Moroccan Dirham</dd>
          </div>
          <div>
            <dt>Opening balance</dt>
            <dd>{demoEnabled ? formatMad(1000000) : 'Connect API to load'}</dd>
          </div>
          <div>
            <dt>Balance source</dt>
            <dd>Authoritative posted ledger</dd>
          </div>
        </dl>
        <AppLink className="text-button" href="/settings">
          Manage account settings →
        </AppLink>
      </section>
    </>
  );
}

export function SettingsPage() {
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    document.documentElement.lang =
      language === 'Français' ? 'fr' : language === 'العربية' ? 'ar' : 'en';
    document.documentElement.dir = language === 'العربية' ? 'rtl' : 'ltr';
  }, [language]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Keep the app comfortable and transparent for every household member."
      />
      <section className="settings-grid">
        <section className="panel">
          <p className="eyebrow">Appearance</p>
          <h2>Language & direction</h2>
          <label>
            Language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option>English</option>
              <option>Français</option>
              <option>العربية</option>
            </select>
          </label>
          <p className="muted">
            Arabic switches the document direction to RTL. Full translated copy
            is still being connected to the localization package.
          </p>
        </section>
        <section className="panel">
          <p className="eyebrow">Theme</p>
          <h2>Light or dark</h2>
          <label>
            Theme
            <select
              value={theme}
              onChange={(event) =>
                setTheme(event.target.value as 'light' | 'dark')
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <p className="muted">
            Theme selection applies immediately in this browser.
          </p>
        </section>
        <section className="panel">
          <p className="eyebrow">Connection</p>
          <h2>Data source</h2>
          <div className="connection-card">
            <span className="status-dot" />
            <div>
              <strong>
                {demoEnabled
                  ? 'Development demo data'
                  : 'Backend API not connected'}
              </strong>
              <p>
                {demoEnabled
                  ? 'Local actions are never presented as persisted financial records.'
                  : 'Configure authentication and the API to load protected data.'}
              </p>
            </div>
          </div>
          <button
            className="button"
            type="button"
            onClick={() => setSaved(true)}
          >
            {saved ? 'Preferences saved locally' : 'Save preferences'}
          </button>
        </section>
      </section>
      <section className="danger-zone">
        <div>
          <h2>Sign out</h2>
          <p>
            Browser authentication and revocation are controlled by the approved
            OIDC/session integration.
          </p>
        </div>
        <AppLink className="button button-secondary" href="/login">
          Open sign-in
        </AppLink>
      </section>
    </>
  );
}

export function AuthPage({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const [error, setError] = useState('');
  const title =
    mode === 'login'
      ? 'Welcome back'
      : mode === 'register'
        ? 'Create your account'
        : 'Recover access';
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(
      'Keycloak browser authentication is not configured in this environment. A browser client ID and redirect URI are required before a real PKCE redirect can start.',
    );
  };
  return (
    <main className="auth-layout">
      <section className="auth-card">
        <AppLink className="brand" href="/welcome">
          <span className="brand-mark" aria-hidden="true">
            ◎
          </span>
          <span>Atlas Ledger</span>
        </AppLink>
        <p className="eyebrow">Shared household finance</p>
        <h1>{title}</h1>
        <p className="page-description">
          {mode === 'login'
            ? 'Continue to Keycloak for secure sign-in.'
            : mode === 'register'
              ? 'Registration is handled by the configured Keycloak realm.'
              : 'Password recovery is handled by the configured Keycloak realm.'}
        </p>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={submit} noValidate>
          <button className="button" type="submit">
            {mode === 'login'
              ? 'Continue with Keycloak'
              : mode === 'register'
                ? 'Open Keycloak registration'
                : 'Open Keycloak recovery'}
          </button>
        </form>
        <div className="auth-links">
          {mode !== 'login' && <AppLink href="/login">Sign in</AppLink>}
          {mode === 'login' && (
            <>
              <AppLink href="/register">Create an account</AppLink>
              <AppLink href="/forgot-password">Forgot password?</AppLink>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <EmptyState title="This page is not available">
      The route may have moved, or you may not have permission to view it.
    </EmptyState>
  );
}
