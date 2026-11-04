# Migration review rules

Migrations are reviewed SQL artifacts. They are not executed automatically by
the application process.

`0001_identity_wallet_account.sql` establishes the approved identity,
Shared Wallet, role/permission, OIDC-backed session reference, and one
financial-account-per-user foundations. It intentionally does not include
ledger, transfer, attachment-provider, report, notification, or offline-sync
tables that belong to later approved slices.

Before applying migrations, verification must include a clean database run, an
upgrade run from the previous migration, constraint checks, and rollback or
forward-recovery evidence in an isolated disposable environment.
