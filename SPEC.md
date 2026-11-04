# Expense Tracker — Product Specification

## Product

Expense Tracker is a secure, family-oriented application for personal and shared household finances. A Shared Wallet is in scope, with role- and permission-based access.

## Users and access

- Authentication is required.
- The default secure role is Admin.
- Custom roles may be created, assigned, changed, and revoked only through explicit permission management; permissions are never granted implicitly.
- The server enforces authorization for every protected operation.
- A transaction may be created by a permitted user, edited or archived by its creator or an Admin, and audited for sensitive changes.

## Accounts and money

- Each user has one financial account.
- An account has an Opening Balance and a single base currency: MAD.
- Balance equals opening balance plus posted financial activity.
- Money uses exact decimal or integer minor-unit representation, never binary floating point.
- A foreign-currency transaction stores original currency, original amount, applied exchange rate, converted MAD amount, and rate timestamp/source when available.
- Historical MAD values never change when rates are updated.
- Date-only behavior uses the Morocco day as the UTC calendar day.

## Transactions

Supported types:

- Income
- Expense
- Transfer
- Recurring Transaction
- Refund

Rules:

- Transfers create linked debit and credit records and are excluded from income and expense totals.
- Refunds reference the original transaction where possible and support full and partial amounts.
- Recurring transactions are generated from a configured schedule, with pause/edit/cancel controls for authorized users.
- Recurring generation must prevent duplicates and provide failure recovery.
- Categories include predefined categories and Admin-managed custom categories.
- Payment methods include Cash, Credit Card / Debit Card, Bank Transfer, and Mobile Payment.
- Attachments support JPG, PNG, and PDF, with a maximum of 10 MB per file.
- Server-side validation must not trust client-provided MIME types alone.
- Deletion is an auditable archive/soft-delete operation; irreversible deletion is not part of the baseline.

## Budgets, statistics, and reports

- Support a global monthly budget and category-level budgets.
- Provide financial statistics and weekly/monthly reports.
- Provide manual CSV, Excel, and PDF exports.
- Notifications are in scope for budget thresholds, low balance, transaction events, recurring reminders, and weekly/monthly reports.

## Offline and PWA

- Deliver as a Progressive Web App.
- Support full offline operation for the approved offline workflows.
- Queue offline changes durably and synchronize when connectivity returns.
- Synchronization is idempotent and must prevent duplicate transactions.
- Conflicts are detected explicitly and never silently overwritten; the user receives a documented resolution path.

## Localization and accessibility

- Support English, French, and Arabic.
- Arabic uses RTL layout across navigation, forms, tables, and responsive views.
- User-visible workflows must be keyboard accessible and provide clear validation and error states.

## Security, audit, and recovery

- Hash passwords with a modern password-hashing algorithm if password authentication is implemented.
- Use HTTPS in deployed environments.
- Validate and normalize all server inputs.
- Audit permission changes, transaction edits/archives, financial adjustments, and account-level changes.
- Never log passwords, tokens, secrets, or full payment credentials.
- Only authorized users can view or download attachments.
- Automatic backups are required. Frequency, retention, restore procedure, and responsibility remain open design decisions.
- A backup is not considered restorable until a restore test has passed.

## Open decisions

The following remain proposals/open decisions, not user-approved implementation facts: hosting and storage providers, attachment scanning/retention, notification channels, report definitions, offline workflow boundary, conflict actions, backup policy, and export layout details. Keycloak OIDC/server validation and the Admin/default-Member/custom-role permission model are confirmed in `EXECUTION_TRACKER.md`; browser session/revocation behavior still requires implementation and proof. The Product Owner has separately approved the D-01 technical foundation, D-07 browser/device matrix, and D-14 Atlas Ledger light/dark design-system direction.

## Acceptance baseline

The product is not complete until the relevant automated tests and end-to-end proof demonstrate correct behavior for authentication, authorization, ledger operations, balance calculation, transfers, refunds, recurring transactions, budgets, reports, attachments, localization/RTL, offline synchronization, and backup restore.
