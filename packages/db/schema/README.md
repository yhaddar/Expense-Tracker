# Neutral schema foundation

This directory records the Phase 2 schema boundary without creating executable
migrations. The authoritative database is PostgreSQL and the implementation
direction is Drizzle plus reviewed SQL.

The eventual schema must represent, at minimum:

- users and one financial account per user, with an exact opening balance;
- one Shared Wallet context and membership references;
- role/permission extension points without selecting the D-03 matrix;
- immutable currency-conversion snapshots and aggregate versions;
- transaction records, audit events, domain-event outbox, notification-delivery
  outbox, idempotency keys, sync metadata, and conflict records;
- private transaction-scoped attachment metadata;
- budgets, reports, and durable in-app notifications.

The following remain deliberately absent until their decisions are approved:

- authentication-provider/session-specific tables (D-02);
- permission-matrix-specific policies/seeds (D-03);
- transfer-specific relationships, fields, events, and constraints (D-04);
- provider-specific attachment storage/scanning fields (D-09).

Required invariants for the reviewed migration design include a unique
idempotency key, immutable conversion snapshots, optimistic versioning, audit
references for sensitive changes, and a database constraint enforcing one
financial account per user.
