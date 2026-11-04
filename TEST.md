# Expense Tracker — Verification Strategy

## Verification policy

No behavior is considered complete without relevant end-to-end proof. Every report must include exact commands, pass/fail results, tests not run, and remaining limitations. Tests must not contain secrets or real personal financial data.

## Unit tests

- Exact-money addition, subtraction, conversion, rounding, and persisted exchange-rate snapshots.
- Morocco-day/UTC date-only behavior and recurring schedule boundaries.
- Balance calculation from opening balance and posted activity.
- Budget thresholds and category aggregation.
- Transfer and refund invariants.
- Idempotency-key handling and conflict classification.
- Permission evaluation for Admin, custom roles, creators, and unauthorized members.
- Attachment size/type validation.

## Integration tests

- Authentication and secure session behavior.
- Server-side authorization on every protected operation.
- Account creation and opening balance.
- Create, edit, archive, and audit income/expense transactions.
- Atomic linked transfer creation and exclusion from income/expense totals.
- Full and partial refund references.
- Recurring generation, pause/edit/cancel, duplicate prevention, and recovery.
- Foreign-currency conversion persistence.
- Attachment upload and authorized/unauthorized access.
- Budget, statistics, reporting, exports, and notification events.
- Audit records for sensitive changes.

## Offline and synchronization tests

- Load the PWA shell while offline.
- Create supported offline transactions and verify durable queueing.
- Retry after reconnect without duplicate records.
- Replay the same operation multiple times and verify idempotent results.
- Exercise network failure, timeout, and partial synchronization recovery.
- Create concurrent edits and verify explicit conflict detection/resolution.
- Confirm unauthorized offline data is not exposed after session changes.

## Localization, accessibility, and UI tests

- English, French, and Arabic translations cover all user-visible flows.
- Arabic RTL navigation, forms, tables, errors, and responsive layouts.
- Keyboard navigation, focus visibility, labels, contrast, and validation messages.
- Responsive behavior for supported mobile, tablet, and desktop viewports.

## End-to-end acceptance flows

### Authentication status

The API guard and local-user provisioning are testable with a configured OIDC
issuer and bearer token. Browser Authorization Code + PKCE, Keycloak
registration, password recovery, callback exchange, logout, and revocation are
not currently executable from this repository because the disposable realm has
no committed/exported browser client configuration. Do not mark these flows
passed from unit tests or service-token smoke tests. Required evidence is a
real disposable browser client, browser callback, protected API request,
logout/revocation request, and rejected post-logout request.

1. Admin signs in, creates a shared wallet/account, and assigns a custom role.
2. Authorized family member adds income and expense entries with categories and payment methods.
3. User adds a foreign-currency expense and verifies the stored MAD conversion.
4. User creates a transfer and verifies linked records and unchanged income/expense totals.
5. User records a partial refund and verifies balance and report changes.
6. User configures a recurring transaction and verifies one generated occurrence with duplicate prevention.
7. User sets budgets and verifies threshold notifications and monthly statistics.
8. User attaches a valid document, rejects an invalid/oversized file, and verifies access control.
9. User works offline, reconnects, and verifies idempotent synchronization plus conflict handling.
10. User switches English/French/Arabic and verifies Arabic RTL layout.
11. Operator performs a backup restore drill and verifies data integrity.

## PWA and operational checks

- Verify manifest, service worker, installability, cache behavior, and offline fallback.
- Run database migrations from a clean environment and an upgrade environment.
- Run lint, type checking, unit tests, integration tests, and end-to-end tests.
- Run dependency/security checks appropriate to the approved stack.
- Perform and record a restore test; do not infer restore success from backup creation alone.

## Required reporting format

- Commands executed.
- Results and relevant counts.
- Tests not run and why.
- Known limitations and remaining risks.
- Whether end-to-end proof passed for the claimed behavior.
