'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { demoEnabled } from '../lib/types';

const navigation = [
  { href: '/', label: 'Overview', icon: '⌂' },
  { href: '/transactions', label: 'Transactions', icon: '↕' },
  { href: '/budgets', label: 'Budgets', icon: '◒' },
  { href: '/reports', label: 'Reports', icon: '▥' },
  { href: '/notifications', label: 'Notifications', icon: '◌' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <div className="app-shell">
      <button
        className="mobile-menu"
        type="button"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        ☰
      </button>
      {open && (
        <button
          className="scrim"
          aria-label="Close navigation"
          type="button"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`rail ${open ? 'rail-open' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="rail-top">
          <Link className="brand" href="/" onClick={() => setOpen(false)}>
            <span className="brand-mark" aria-hidden="true">
              ◎
            </span>
            <span>Atlas Ledger</span>
          </Link>
          <button
            className="rail-close"
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>
        <p className="context">Shared Wallet · 2 members</p>
        <nav>
          {navigation.map((item) => (
            <Link
              className={isActive(item.href) ? 'active' : ''}
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="rail-footer">
          <Link
            className={pathname.startsWith('/wallet') ? 'active' : ''}
            href="/wallet"
            onClick={() => setOpen(false)}
          >
            ◉ Shared Wallet
          </Link>
          <Link
            className={pathname.startsWith('/settings') ? 'active' : ''}
            href="/settings"
            onClick={() => setOpen(false)}
          >
            ⚙ Settings
          </Link>
          <Link
            className={pathname.startsWith('/profile') ? 'active' : ''}
            href="/profile"
            onClick={() => setOpen(false)}
          >
            <span className="avatar small">H</span> Profile
          </Link>
        </div>
      </aside>
      <section className="content">
        <div className="status-row" role="status">
          <span className="status-dot" /> Online ·{' '}
          {demoEnabled ? 'demo data, not saved' : 'API connection pending'}
        </div>
        {demoEnabled && (
          <div className="demo-banner" role="note">
            <strong>Development demo</strong>
            <span>
              Interactions are local to this browser and are not persisted by
              the API.
            </span>
            <Link href="/settings">Configure API</Link>
          </div>
        )}
        {children}
      </section>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function AppLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'positive' | 'warning' | 'neutral' | 'negative';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
