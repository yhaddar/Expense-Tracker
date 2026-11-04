# AGENTS.md — Expense Tracker

## 1. Mission

Build a secure, reliable, family-oriented Expense Tracker for managing personal and shared household finances.

This file defines how AI coding agents must work in this repository. Product requirements belong in `SPEC.md`; implementation sequencing belongs in `PLAN.md`; verification strategy belongs in `TEST.md`.

**Current task boundary:** when asked to perform Project Discovery documentation, create or update only the planning documents explicitly requested. Do not start application implementation until the human has reviewed and approved the plan and specification.

## 2. Required reading and repository discovery

Before making changes:

1. Read this `AGENTS.md` completely.
2. Inspect the repository structure, existing documentation, package manifests, source code, tests, CI workflows, and Git status.
3. Identify the actual framework, language, package manager, database, ORM, test tools, and existing conventions from the repository. Do not assume a stack based only on familiarity.
4. Preserve existing work. Never overwrite, delete, rename, or replace existing files merely to make the repository match a preferred template.
5. If existing project decisions conflict with this file or with the user's latest explicit instruction, stop and document the conflict in the relevant planning document. Do not silently choose one.
6. Do not expose secrets. Never copy `.env` values, tokens, credentials, private URLs, or personal financial data into documentation, logs, commits, or test fixtures.

## 3. Product context and discovery decisions

The following are the current Project Discovery decisions. Carry them into `SPEC.md` and the relevant parts of `TEST.md`. Do not ask the user to repeat them.

### Product and users

- Product: Expense Tracker for family and shared household financial management.
- Main capabilities: income and expense tracking, transfers, recurring transactions, refunds, budgets, financial statistics, reports, and shared financial visibility.
- Audience: family/shared use.
- Shared Wallet is in scope.
- The system supports custom roles and permission-based access.
- Define a secure default role (Admin) and document how custom roles and permissions are created, assigned, changed, and revoked. Do not grant permissions implicitly.

### Transactions

- Supported transaction types: Income, Expense, Transfer, Recurring Transaction, and Refund.
- Users can create transactions directly when their permissions allow it; do not add a mandatory approval workflow unless an existing explicit decision requires it.
- A transaction can be edited or deleted by its creator or an Admin, subject to authorization and audit requirements.
- Categories include predefined categories and custom categories managed by Admin.
- Supported payment methods: Cash, Credit Card / Debit Card, Bank Transfer, and Mobile Payment.
- Support transaction images and documents as attachments.
- Preserve transaction history and audit-sensitive information. Prefer an auditable archive/soft-delete approach over irreversible deletion; document the exact behavior and its implications in `SPEC.md`.
- Transfers must create linked debit/credit records and must not be counted as income or expense.
- Refunds should reference the original transaction where possible; support full and partial refunds.
- Recurring transactions are generated automatically from their configured schedule. Users with permission can pause, edit, or cancel them. Define duplicate-prevention and failure-recovery behavior.
- Store the exchange rate used by a foreign-currency transaction so historical MAD values do not change when rates later change.

### Budgets and reporting

- Support a global monthly budget and category-level budgets.
- Notifications are in scope for budget thresholds, low balance, transaction events, recurring transaction reminders, and weekly/monthly reports.
- Support financial statistics and weekly/monthly reporting.
- Manual exports: CSV, Excel, and PDF.
- Automatic backups are required. Document backup frequency, retention, restore procedure, and responsibility as explicit design decisions; never claim a backup is restorable without a restore test.

### Financial accounts and currencies

- Each user has one financial account.
- Financial account balance is calculated automatically from the account's opening balance and its posted financial activity.
- Users enter an Opening Balance when creating the account.
- The account's single/base currency is MAD (Moroccan Dirham).
- Transactions may use multiple currencies, with conversion to MAD.
- Save the transaction currency, original amount, applied exchange rate, converted MAD amount, and rate timestamp/source when available.
- Do not use binary floating-point arithmetic for money. Use the repository's appropriate exact decimal or integer-minor-unit representation and document rounding rules.
- Do not silently change historical converted values when exchange rates update.

### Platform, localization, offline support

- Deliver the application as a Progressive Web App (PWA).
- Full offline operation is required for the supported offline workflows, with synchronization when connectivity returns.
- Queue offline changes safely and make synchronization idempotent to prevent duplicate transactions.
- Detect synchronization conflicts explicitly. Never silently overwrite conflicting financial data; provide a documented resolution path.
- Supported languages: English, French, and Arabic.
- Arabic must support right-to-left (RTL) layout, including navigation, forms, tables, and responsive layouts.

### Attachments

- Multiple attachments may be associated with a transaction.
- Supported formats: JPG, PNG, and PDF.
- Maximum file size: 10 MB per file.
- Only authorized users may view or download attachments.
- Validate file type and size on the server; do not trust client-provided MIME types alone.

### Security and auditability

- Authentication is required.
- Enforce role-based authorization on the server for every protected operation; frontend visibility is not a security boundary.
- Hash passwords using a modern password-hashing algorithm if password authentication is implemented.
- Use HTTPS in deployed environments.
- Validate and normalize input on the server.
- Record audit events for sensitive actions, including permission changes, transaction edits/deletions, financial adjustments, and account-level changes.
- Never log passwords, tokens, secrets, or full payment credentials.
- Apply least-privilege access to shared-wallet data and attachments.

### Previously established workflow decisions

- Project Discovery precedes implementation.
- The documentation-first deliverables are `AGENTS.md`, `PLAN.md`, `SPEC.md`, and `TEST.md`.
- Human review and explicit approval are required before implementation.
- A later `DESIGN.md` is expected before substantial UI implementation.
- Work should be split into small, reviewable phases with dependencies, risks, acceptance criteria, and tests.
- Verify each phase before proceeding to the next.

## 4. Decision handling and assumptions

- Treat the decisions in Section 3 as the current product baseline.
- Do not invent missing business rules and present them as user-approved facts.
- For unresolved details, propose a conservative default, label it clearly as an **assumption/proposal**, explain its impact, and record it in `PLAN.md` or `SPEC.md` under `Open Decisions`.
- Prefer secure, reversible, auditable defaults for financial operations.
- If two requirements conflict, list both, explain the consequence, and propose the smallest safe resolution. Do not silently discard either requirement.
- Keep a decision log with: ID, decision, rationale, status (`confirmed`, `proposed`, or `open`), and date if known.
- Do not re-ask questions already answered in the discovery decisions above.

## 5. Planning-first workflow

Before implementation, produce a plan that is specific enough to review and execute.

The plan must:

1. State the project goal and non-goals.
2. Describe the existing repository and current implementation state.
3. Propose an architecture that fits the repository and the product requirements.
4. Divide work into small phases and independently verifiable tasks.
5. Show task dependencies and identify critical-path items.
6. Identify security, data-integrity, offline-sync, migration, performance, accessibility, and deployment risks.
7. Define acceptance criteria for every phase.
8. Define the tests and verification commands for every phase.
9. Identify database migrations, seed data, API contracts, and compatibility concerns.
10. Include rollback/recovery considerations for risky changes.
11. Keep an explicit list of assumptions, open decisions, and items requiring human approval.

Do not produce vague tasks such as “implement dashboard” without listing the behavior, boundaries, acceptance criteria, and tests.

## 6. Approval gates

Use these gates in order:

- **Gate 1 — Discovery documentation:** create/update `PLAN.md`, `SPEC.md`, and `TEST.md`. No application code changes.
- **Gate 2 — Human review:** stop and request explicit approval. Do not interpret silence as approval.
- **Gate 3 — Design:** after approval, create/update `DESIGN.md` for the UI/UX and technical design. Stop for review if the design materially changes scope or architecture.
- **Gate 4 — Implementation:** implement only approved scope, following the approved plan and specification.
- **Gate 5 — Verification:** run the required tests, type checks, lint, build, and relevant manual checks. Report actual command output; never claim a check passed if it was not run.
- **Gate 6 — Review and handoff:** perform a code/security review, summarize changes, list remaining risks, and provide evidence.

Never bypass a gate. If the user explicitly changes the workflow, follow the latest instruction and record the change.

## 7. Implementation rules (after approval)

- Follow existing repository conventions and architecture unless an approved plan explicitly changes them.
- Keep changes focused and small. Avoid unrelated refactors.
- Use TypeScript strictness and explicit types where the repository uses TypeScript.
- Keep business logic out of UI components.
- Validate authorization and business invariants in server-side/domain layers.
- Use database transactions for operations that must update multiple financial records atomically.
- Make recurring generation, transfer posting, refund posting, and offline synchronization idempotent.
- Use exact arithmetic for currency and explicit rounding rules.
- Add or update tests with every behavior change.
- Do not weaken, skip, or delete tests merely to make the suite pass.
- Do not add dependencies without explaining why they are needed and checking whether existing dependencies already solve the problem.
- Do not introduce secrets or commit local environment files.
- Do not deploy, publish, or modify production data without explicit human approval.

## 8. Testing and verification

Use the repository's existing test stack where possible. The test strategy must cover, at minimum:

- Unit tests for money calculations, currency conversion, rounding, budgets, recurring schedules, and permission rules.
- Integration tests for transaction creation/edit/deletion, transfers, refunds, account balance calculation, and audit events.
- Authorization tests for Admin, custom roles, creators, and unauthorized family/shared-wallet members.
- Offline and synchronization tests, including retries, duplicate delivery, conflicts, and reconnect behavior.
- Attachment validation and access-control tests.
- Localization tests for English, French, Arabic, and RTL layouts.
- PWA installability and offline behavior checks.
- End-to-end tests for the most important family finance workflows.
- Backup and restore verification tests or a documented operational restore drill.

Before reporting completion, run the checks relevant to the changed scope and include:
- Exact commands executed.
- Pass/fail results.
- Tests not run and why.
- Known limitations and remaining risks.

## 9. Git and collaboration

- Do not work directly on a protected main branch when the repository has a branch/PR workflow.
- Use a focused branch for each independent task or phase, following existing naming conventions.
- Do not commit unless the user or approved workflow authorizes committing.
- Do not push, merge, open a PR, or deploy unless explicitly authorized.
- Keep commits focused and explain their purpose.
- If subagents are available, delegate only bounded, independent research or review tasks. Give each subagent the relevant requirements and require a concise evidence-based report. Avoid concurrent edits to the same files.
- The primary agent remains responsible for integration, verification, and the final report.

## 10. Communication and completion report

- Be concise, direct, and transparent.
- Ask a question only when a missing decision blocks safe progress and cannot be handled as a clearly labeled proposal.
- Never repeat a question that has already been answered.
- Distinguish confirmed facts from assumptions and recommendations.
- Report blockers with: what is blocked, what is needed, who must provide it, and since when (if known).
- At the end of each phase, report: completed work, files changed, tests/commands and results, decisions made, open decisions, and the next approval required.