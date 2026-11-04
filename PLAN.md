# Expense Tracker — Implementation Plan

Status: implementation plan approved for execution planning. The UI/UX design in `DESIGN.md` is approved. Application implementation may proceed only through the task-level gates below; production access, live delivery, commits, pushes, and deployment remain separately unauthorized.

## 1. Goal and confirmed boundaries

Build a secure, family-oriented Expense Tracker PWA for one Shared Wallet context and each user’s financial account. The application supports income, expenses, transfers, recurring transactions, refunds, budgets, reports, notifications, transaction attachments, approved offline workflows, synchronization, English/French/Arabic localization, Arabic RTL, auditability, and backup/restore verification as required by `SPEC.md` and designed in `DESIGN.md`.

Confirmed boundaries preserved from the project documents:

- Authentication and server-side authorization are required.
- Admin is the secure default role; custom roles and permissions are explicit.
- The transaction creator and Admin may edit/archive transactions when authorized.
- Archive/soft-delete is the reversible/auditable deletion behavior; irreversible deletion is not the baseline.
- Each user has one financial account with MAD as the base currency.
- Transfers create linked debit/credit records and are excluded from income/expense totals.
- Refunds reference original transactions where possible and support full/partial refunds.
- Historical converted MAD values do not change when exchange rates update.
- Money uses exact decimal or integer minor-unit arithmetic, never binary floating point.
- The product has one Shared Wallet context; no multiple-wallet functionality is introduced.
- Transaction attachments are in scope; no standalone attachment library is introduced.
- Offline conflicts are explicit; no silent overwrite or unapproved merge policy is introduced.
- English, French, and Arabic with complete Arabic RTL are required.
- A backup is not considered restorable until a restore test passes.

## 2. Current repository and approval state

- Repository: `/Users/mac/Desktop/Expense Tracker`.
- Planning/design documents present: `AGENTS.md`, `SPEC.md`, `PLAN.md`, `TECHNICAL_DESIGN.md`, `AGENT_ARCHITECTURE.md`, `DESIGN.md`, and `TEST.md`.
- `TEST.md` exists and is the current verification baseline.
- Application source now exists under `apps/` and `packages/`, with a pnpm lockfile, reviewed PostgreSQL migrations, local OpenAPI/Postman artifacts, and disposable PostgreSQL/Keycloak resources.
- Verified slices include the API health boundary, OIDC JWT validation, first-user Admin bootstrap, single-wallet membership provisioning, one-account setup, income/expense ledger, edit/archive, refunds, recurring generation, budgets, and durable in-app notification read state.
- The repository remains incomplete: browser session/revocation, full member workflows, attachment storage/scanning, transfer semantics, reports/exports, event-driven notification delivery, offline sync/conflict actions, PWA installability, localization/RTL, backup/restore, and release evidence are not complete.
- D-01, D-02, D-03, D-07, D-13, and D-14 are recorded as confirmed in the execution tracker; provider/storage, transfer, report/export, attachment, offline/conflict, notification-channel, backup, and hosting decisions remain gated.

## 3. Approved technical direction and application boundaries

### D-01 technical direction

- Frontend: Next.js App Router + React + TypeScript in `apps/web`.
- Backend: NestJS + TypeScript modular monolith in `apps/api`.
- PostgreSQL with Drizzle and reviewed SQL for financial/report queries.
- Versioned REST/JSON with OpenAPI and local Postman contract artifacts.
- IndexedDB/Dexie local projection and outbox; service worker via an approved PWA approach.

Next.js and NestJS are separate applications with distinct responsibilities. NestJS owns backend business logic, authorization, financial operations, REST API endpoints, background processing, and database access. Next.js owns the frontend, presentation layer, PWA, and client-facing application experience.

The frontend and backend communicate through a versioned REST API with an OpenAPI contract. Next.js must not implement a second backend through API route handlers or duplicate NestJS domain logic. Any Next.js server-side functionality is limited to frontend-related concerns such as rendering, metadata, or presentation support.

NestJS remains a modular monolith rather than a microservices system. Its background processing may run through a separate process or entrypoint, but it remains NestJS-owned and uses the same approved backend/domain boundaries. API and background processing may initially deploy together if operationally simpler.

Repository boundaries are: `apps/web` for Next.js PWA/UI; `apps/api` for NestJS HTTP, authentication, authorization, domain application services, background-processing entrypoints, and database access; `packages/contracts` for shared API types; `packages/domain` for reusable financial rules; `packages/db` for persistence/schema/migrations; and `packages/localization` for locale resources. No second backend implementation is introduced under `apps/web`.

## 4. Just-in-time decision gates

Phase 0 does not require every decision to be closed before implementation planning or all future work. Each decision must be resolved immediately before the first task that depends on it.

| ID | Decision | Must be resolved before | Current status and safe boundary |
|---|---|---|---|
| D-01 | Stack, package manager, runtime, and versions | Phase 1 foundation | Confirmed: pnpm workspaces; Node.js 24 LTS pinned in repository configuration; strict TypeScript; exact compatible dependency versions selected and pinned after compatibility verification; Next.js in `apps/web`; NestJS in `apps/api` |
| D-02 | Authentication provider and session strategy | Phase 3 identity implementation | Confirmed: Keycloak OIDC with server-validated API tokens; browser session/revocation proof remains incomplete |
| D-03 | Exact permission matrix | Phase 3 authorization and Phase 4 transaction actions | Confirmed: Admin full access; default Member least privilege; custom roles use explicit permission subsets |
| D-04 | Transfer domain meaning and linked-record model | Transfer slice in Phase 4 | Confirmed 2026-11-04: connect the existing financial accounts of two users in the same Shared Wallet; do not add extra accounts or wallets |
| D-05 | Minimum offline workflow scope | Phase 7 offline implementation | Open; earlier contracts must reserve sync/idempotency/version fields |
| D-06 | Conflict-resolution actions | Phase 7 conflict UI implementation | Open; earlier UI may show status/metadata only |
| D-07 | Browser/device matrix | Phase 1 shell and Phase 6/7 E2E | Confirmed: latest two stable major versions of Chrome, Edge, Firefox, and Safari; supported iOS Safari and Android Chrome; mobile 360px, tablet 768px, desktop 1024px; capability fallbacks required |
| D-08 | Notification providers/channels | Phase 6D external notification delivery | Open; required in-app notification records/UI do not depend on a provider decision |
| D-09 | Attachment storage/scanning/retention | Phase 5 attachment implementation | Confirmed 2026-11-04: private AWS S3 bucket, ClamAV `clamd`, and retention until seven years after transaction archival. Local adapter contract is available for development; live AWS/ClamAV proof remains required. |
| D-10 | Report/export definitions and layouts | Phase 6B report/export implementation | Open; budget and in-app notification work do not depend on this decision; gross expenses, refunds, and net expenses remain distinct |
| D-11 | Backup frequency, retention, owner, operator interface | Phase 8B backup/restore work | Open; security hardening, observability, and migration testing do not depend on this decision; no end-user backup screen is assumed |
| D-12 | Hosting/region/deployment provider | Phase 8C provider-specific deployment configuration | Open; security hardening, observability, and disposable/local verification do not depend on this decision |
| D-13 | API contract location and Postman workflow | Phase 2 contract gate | Proposed REST/OpenAPI plus local Postman artifacts; no publishing |
| D-14 | Approved design tokens, fonts, assets, and theme scope | Phase 1 design-system foundation | Confirmed: Atlas Ledger identity, light and dark themes, licensed Latin/Arabic fonts subject to licensing/rendering verification, complete RTL tokens; missing brand assets require clearly marked placeholders |

Unresolved decisions are blockers only for their dependent tasks. The Main Agent must stop at that dependency, ask one focused question, and record the answer before continuing.

## 5. Traceability identifiers

- `R-ACC`: authentication, account setup, opening balance, MAD base currency.
- `R-AUTH`: Admin/custom roles, creator/Admin edit/archive, server authorization, audit events.
- `R-LEDGER`: income, expense, transfer, recurring, refund, balances, exact money, currency snapshots.
- `R-BUDGET`: global/category budgets, statistics, weekly/monthly reports, notifications.
- `R-ATTACH`: transaction attachments, allowed formats/size, server validation, access control.
- `R-PWA`: PWA installability, offline shell, approved offline work, durable queue, sync, conflicts.
- `R-I18N`: English/French/Arabic, full RTL, date/number/currency formatting.
- `R-OPS`: backups, restore test, observability, rollback, deployment controls.
- `UX-*`: approved proposals in `DESIGN.md`, including the Atlas Ledger direction, singular Shared Wallet context, transaction composer, refund presentation, responsive layout, and accessibility behavior.
- `V-*`: verification requirements in `TEST.md`.

## 6. Skill registry audit

Every skill reference in this plan uses one of these labels:

- **Installed and verified:** a matching `SKILL.md` exists in the inspected runtime/plugin inventory and is available to be loaded before use.
- **Proposed custom skill:** the workflow is project-specific and no matching installed skill was found; it must not be claimed as active.
- **Missing / fallback:** no suitable installed skill was verified; use repository instructions, direct primary documentation, and available test tools, and report the fallback.

### Installed and verified

- `openai-docs` — current OpenAI/Codex capability documentation.
- `review-agent` — read-only defect-first review.
- `skill-creator` — custom skill creation only after explicit approval.
- `postman:api-engineer` — API engineering entry point.
- `postman:api-documentation` — API contract/documentation workflows.
- `postman:api-testing` — saved API request/assertion testing.
- `postman:collection-schema-v3` — local Postman collection schema.
- `postman:application-testing` — Playwright traffic capture against Postman contracts.
- `postman:ci-integration` — API CI gates.
- `postman:performance-testing` — approved API load testing.
- `postman:variables` — safe variable/secret references.
- `postman:workspaces` — Postman repository/workspace setup and status.
- `control-chrome` — browser automation only when explicitly required; not a Playwright testing skill.

### Proposed custom skills

`requirements-analysis`, `specification-review`, `requirements-traceability`, `technical-research`, `architecture-decision-records`, `planning-task-breakdown`, `backend-architecture`, `rest-api-design`, `database-schema-design`, `sql-orm-review`, `expense-ledger-review`, `financial-integrity-validation`, `exact-monetary-calculations`, `permission-matrix-review`, `expense-security-review`, `owasp-practices`, `security-review-threat-modeling`, `ui-ux-design`, `design-system`, `responsive-design`, `accessibility`, `react-nextjs-best-practices`, `arabic-rtl-review`, `offline-sync-validation`, `bug-investigation-root-cause`, `unit-testing`, `integration-testing`, `e2e-testing-playwright`, `accessibility-testing`, `performance-review`, `verification-before-completion`, `documentation-maintenance`, `release-readiness`, and `deployment-rollback-review`.

### Missing / fallback

- No installed React/Next.js implementation skill was verified.
- No installed NestJS/backend architecture skill was verified.
- No installed PostgreSQL/Drizzle/SQL/ledger/exact-money skill was verified.
- No installed permission-matrix, OWASP, threat-modeling, or finance-security skill was verified.
- No installed Playwright authoring skill was verified; Postman application testing requires an approved Playwright command but does not author/debug all Playwright behavior.
- No installed generic accessibility, RTL, offline-sync, release-readiness, or restore-drill skill was verified.

Missing custom skills must never be described as loaded. If a proposed custom skill has not actually been created and validated, the Main Agent uses an approved documented fallback and records that fallback in the phase report. Execution stops for human intervention only when neither a suitable verified skill nor an approved/documented fallback exists, or when using the fallback itself requires approval that has not been granted. No Skill or Hook is created in this planning phase.

## 7. Applying the existing agent architecture

`AGENT_ARCHITECTURE.md` remains the source of truth for agent responsibilities. This plan assigns phase work to those existing roles; it does not redefine them.

- The **Main Agent** owns scope, approval gates, cross-agent integration, final file/diff review, evidence synthesis, and escalation of unresolved product decisions. It is the only agent that integrates overlapping findings into the project plan or implementation result.
- The **Backend and Domain Agent** owns NestJS implementation in `apps/api`, including backend business logic, authorization integration, financial operations, REST endpoints, background processing, and database access after approval.
- Business-module owners within Backend and Domain create and atomically persist their own domain events with the applicable business transaction; the 6C notification workflow consumes those events and owns durable in-app notification creation and notification-delivery-outbox creation.
- The **API Contract Agent** owns `packages/contracts`, OpenAPI/Postman artifacts, and public-interface compatibility; it does not own financial invariants or authorization policy.
- The **Ledger and Financial Integrity Agent** owns review of `packages/domain` financial rules, schema invariants, migrations, and reconciliation; it does not independently approve its own changes.
- The **Frontend/PWA and Localization Agent** owns `apps/web`, design-system composition, localization, RTL, and client sync presentation; it does not enforce authorization or invent financial calculations.
- The **Security, Privacy, and Threat Modeling Agent** owns independent security findings and threat-model review; it does not access secrets/production or self-approve remediation.
- The **Verification and Testing Agent** owns evidence selection/reporting and test execution review; it does not convert partial/mock evidence into success claims.
- The **Release and Operations Review Agent** owns release, backup/restore, rollback, observability, and deployment-readiness review; it does not deploy.

File ownership is bounded accordingly: `apps/web` belongs to Frontend, `apps/api` belongs to Backend, `packages/contracts` to API Contract, `packages/domain` is written by Backend and independently reviewed by Ledger for financial portions, and `packages/db` is written by Backend and independently reviewed by Ledger for schema, invariant, and migration portions. Next.js route handlers must not become an alternative owner of backend behavior. `tests/` is maintained by Verification with behavior-specific cases supplied by the owning agent. The Main Agent assigns one writer per file, integrates cross-cutting changes, and prevents concurrent edits to the same file.

Independent review is mandatory for financial integrity, authorization, identity, attachment, synchronization, migration, and release changes. If agents disagree, the Main Agent records the disagreement and escalates a product/architecture decision; no subagent may resolve a product-policy conflict unilaterally. Data synchronization conflicts follow only the approved API/domain policy; this planning document does not define merge actions.

## 8. Revised phase sequence

### Phase 0 — Just-in-time decisions and implementation-plan approval

Purpose: approve the execution model without forcing unrelated future decisions prematurely.

Tasks:

1. Product owner approves this revised plan and the first implementation gate.
2. Verify the approved D-01 setup (pnpm workspace, Node.js 24 LTS pin, strict TypeScript, compatible exact versions, and repository setup) before any repository/package foundation work; the Next.js + NestJS direction is fixed.
3. Verify D-07 and D-14 acceptance evidence before visual shell implementation; do not reopen these decisions.
4. Resolve D-13 before API contract work.
5. Resolve D-02 and D-03 before identity/authorization implementation.
6. Resolve D-04 only immediately before the transfer slice.
7. Resolve D-05 and D-06 immediately before offline implementation.
8. Resolve D-08, D-09, D-10, D-11, and D-12 before their dependent feature/operations slices.

Responsible agents: Main Agent; Requirements and Traceability Agent `[Proposed custom skill; fallback]`; Technical Research and ADR Agent `[Proposed custom skills; fallback]`.

Acceptance criteria:

- The plan and first gate are explicitly approved.
- D-01 setup verification, D-07, D-14, and D-13 have owners and evidence requirements before their dependent phases start.
- Later open decisions remain visibly open rather than silently selected.

Gate: no code or dependency changes. Product-owner approval is required before Phase 1.

### Phase 1 — Repository foundation, design system, and application shell

Dependency: confirmed D-01 direction and setup verification, confirmed D-07/D-14 decisions, D-13 approval, and Phase 0 approval.

Purpose: establish the shared visual and runtime foundation early, before feature slices.

Tasks:

1. Create the approved pnpm workspace/package structure and safe scripts; pin Node.js 24 LTS and exact compatible dependency versions after compatibility verification.
2. Create Atlas Ledger design tokens, typography, spacing, focus, motion, and theme primitives.
3. Create the authenticated-shell composition: singular Shared Wallet context indicator, period control, notification placeholder, connection-state placeholder, navigation, responsive rail/bottom bar, and locale direction root.
4. Create English/French/Arabic message structure and RTL-safe layout primitives without implementing financial behavior.
5. Create API health/readiness placeholders and a web-to-API client boundary without production endpoints.
6. Add lint, formatting, type-check, unit, integration, E2E-runner, build, and secret-check scripts after the approved stack is known. Configure the E2E runner/CI entry point only; do not add or claim feature-flow E2E coverage before those flows exist.

Expected files/modules: package manifest/lockfile, workspace config, Next.js `apps/web/app`, `apps/web/components`, NestJS `apps/api` bootstrap/health and background-processing entrypoint boundaries, `packages/localization`, design tokens, test config, CI skeleton, `.env.example` placeholders, and development documentation.

Responsible agents: Frontend/PWA Agent; Backend and Domain Agent; Verification Agent; Security Agent.

Skills: `react-nextjs-best-practices` `[Proposed custom; fallback]`, `design-system` `[Proposed custom; fallback]`, `responsive-design` `[Proposed custom; fallback]`, `accessibility` `[Proposed custom; fallback]`, `arabic-rtl-review` `[Proposed custom; fallback]`, `unit-testing` `[Proposed custom; fallback]`, `verification-before-completion` `[Proposed custom; fallback]`.

Acceptance criteria:

- Clean local setup and documented toolchain checks run without production credentials.
- Shell and design primitives match approved `DESIGN.md` without adding wallet/account capabilities.
- RTL direction and locale switching boundaries are established.
- No financial data or feature behavior is implemented, and no application-flow E2E result is claimed.

Verification/review gate: lint, type-check, empty-test/toolchain smoke, clean build, secret scan, responsive shell review, keyboard/focus review, E2E-runner/CI boot validation only, and independent Security/Verification review. Feature-level E2E begins with the first implemented feature slice.

### Phase 2 — API contract, database schema, and offline-compatible data model

Dependency: Phase 1 boundaries; confirmed D-01 direction and remaining setup prerequisites; D-13 approval. This phase precedes feature implementation.

Purpose: define contracts and data shapes that can support the approved offline scope without implementing offline sync yet.

Tasks:

1. Define versioned REST/OpenAPI resources, stable error envelopes, request IDs, cursor pagination, idempotency keys, optimistic versions, and conflict metadata.
2. Create local, diffable Postman/OpenAPI artifacts before endpoint implementation; do not publish them.
3. Prepare PostgreSQL schema proposals for identity, Shared Wallet membership, roles/permissions, the single financial account per user, ledger records, currency snapshots, transaction attachments, budgets, reports, notifications, outbox/idempotency, sync metadata/conflicts, and audit events. Transfer-specific schema is excluded at this stage.
4. Define migration conventions, foreign keys, unique constraints, archive fields, audit references, seed fixtures, and the PostgreSQL-based domain-event and transactional-outbox model. Each owning business module persists its event in the same database transaction as the applicable business change; failed business transactions publish no event, and committed events remain retryable after a crash. Identity/authorization schema proposals may be prepared here, but final authorization constraints and migrations must respect the approved D-02 authentication/session strategy and D-03 permission matrix.
5. Define the client/server data contract for local projection, sync cursor, client operation ID, base version, schema version, retry state, and conflict metadata. Do not choose conflict actions yet.
6. Leave all transfer-specific fields, relationships, constraints, and migrations out until D-04 is resolved; the schema may reserve neutral extensibility only and must not imply multiple financial accounts per user.

Transfer-specific schema, relationships, constraints, and migrations remain deferred until D-04 is approved. Phase 2 may reserve extensibility but must not define or enforce an assumed transfer model.

Expected files/modules: `packages/contracts`, `packages/db/schema`, `packages/db/migrations`, local `postman/`, `packages/domain/money`, sync contract types, and schema ADRs.

Responsible agents: API Contract Agent; Backend and Domain Agent; Ledger Agent; Security Agent; Frontend/PWA Agent for offline contract compatibility.

Skills: `postman:api-engineer` `[Installed and verified]`, `postman:api-documentation` `[Installed and verified]`, `postman:collection-schema-v3` `[Installed and verified]`, `rest-api-design` `[Proposed custom; fallback]`, `database-schema-design` `[Proposed custom; fallback]`, `sql-orm-review` `[Proposed custom; fallback]`, `offline-sync-validation` `[Proposed custom; fallback]`, `financial-integrity-validation` `[Proposed custom; fallback]`.

Acceptance criteria:

- API contract covers authorization failures, idempotent mutation behavior, pagination, versions, and conflict metadata.
- Database proposal preserves one financial account per user, refund/audit relationships, and neutral extensibility for future transfers; it does not define or enforce transfer-specific relationships or constraints.
- Offline-compatible fields exist without implementing an unapproved offline scope or conflict action.
- The domain-event outbox has producer ownership, atomic-commit requirements, idempotency keys, processing status, retry state, and failure handling without introducing a distributed messaging system.
- Money/date rules are represented by executable test cases.

Verification/review gate: contract lint, schema proposal review, disposable PostgreSQL migration dry run only for approved/non-authorization portions, money invariants, API negative examples, and independent API/Ledger/Security review. Final identity/authorization constraints and migrations remain blocked until D-02/D-03 are approved, and all transfer-specific schema/migrations remain blocked until D-04 is approved.

### Phase 3 — Identity, account setup, Shared Wallet access, and authorization

Dependency: Phase 2 contract/schema; D-02 and D-03 approval.

Tasks:

1. Implement approved authentication/session integration, sign-in/sign-out, expiry, and revocation.
2. Implement the user’s single financial account with opening balance and fixed MAD base currency.
3. Implement singular Shared Wallet membership and Admin bootstrap; no wallet switching.
4. Implement explicit custom roles and permission assignment/revocation.
5. Apply server-side authorization guards to protected resources.
6. Add audit events for permission changes, account changes, and security/session events.
7. Connect the approved shell to authenticated/loading/unauthorized/session-expired states.

Expected files/modules: `apps/api/src/modules/identity`, `wallet-access`, `accounts`, `audit`, guards/policies, web auth/setup routes, locale strings, and authorization fixtures.

Responsible agents: Backend and Domain Agent; Security Agent; API Contract Agent; Frontend/PWA Agent; Verification Agent.

Skills: `permission-matrix-review` `[Proposed custom; fallback]`, `expense-security-review` `[Proposed custom; fallback]`, `security-review-threat-modeling` `[Proposed custom; fallback]`, `backend-architecture` `[Proposed custom; fallback]`, `rest-api-design` `[Proposed custom; fallback]`, `postman:api-testing` `[Installed and verified]`, `integration-testing` `[Proposed custom; fallback]`, `e2e-testing-playwright` `[Proposed custom; fallback]`.

Acceptance criteria:

- Approved users authenticate through the selected strategy.
- Every protected operation is server-authorized.
- Admin/custom-role behavior matches the approved matrix.
- Creator/Admin edit/archive permissions are encoded for transaction work.
- Unauthorized users cannot infer protected wallet, transaction, or attachment data.

Verification/review gate: auth/session integration, role positive/negative matrix, account setup E2E, audit assertions, API contract assertions, and independent Security review. D-02/D-03 must be closed before implementation starts.

### Phase 4 — Ledger feature slices with paired API and UI

Dependency: Phase 3 authorization; Phase 2 schema/contract; Ledger review. Resolve D-04 immediately before the transfer slice only.

Purpose: implement each financial feature as a vertical slice so its domain rules, API contract, UI, and tests evolve together.

#### 4A — Income and expense

Traceability: `R-LEDGER`, `R-AUTH`, `UX-004`, `UX-005`, `V-*`.

Tasks: exact-money/MAD balance utilities; income/expense create/read/update/archive; categories/payment methods; transaction list/detail/composer; creator/Admin edit/archive controls; audit events.

Financial business operations that produce notification-relevant domain events persist the business change and its domain-event outbox record atomically in the same PostgreSQL transaction whenever applicable. The owning ledger, budget, report, or other business module creates and persists its own event; notification processing consumes it and does not recreate the original domain event.

Expected modules: `packages/domain/ledger`, `apps/api/src/modules/ledger`, transaction contracts, web transaction features, and unit/integration/E2E tests.

Acceptance: opening balance plus posted activity is exact; creator/Admin can edit/archive; unauthorized users are rejected; server-authoritative detail and sync status are displayed.

#### 4B — Transfer

Traceability: `R-LEDGER`, `R-AUTH`, `V-*`; D-04.

Required domain question: **What does “transfer” mean in this product, and which approved ledger records or contexts, if any, are linked by its required debit/credit records?** `SPEC.md` requires linked debit/credit records but defines one financial account per user and does not define source/destination accounts, user-to-user transfers, or Shared-Wallet-to-account transfers. The product owner must define the transfer domain without changing the one-financial-account-per-user rule. Until answered, no source/destination selectors, fields, or transfer implementation are allowed.

Tasks after D-04: atomic linked debit/credit records, transfer detail with linked legs, exclusion from income/expense totals, API assertions, and E2E flow.

Only after D-04 approval may the transfer workflow define or persist transfer-specific domain events; any approved transfer business change and its event must use the same PostgreSQL transaction.

Acceptance: no change to the one-financial-account-per-user rule; linked records are atomic and auditable; transfer totals reconcile.

#### 4C — Refunds

Traceability: `R-LEDGER`, `UX-008`, `V-*`.

Tasks: original-transaction reference, remaining refundable amount, full/partial refund, refund detail/history, and report projection.

Acceptance: refund increases balance according to the approved model, is not income, and reporting distinguishes gross expenses, refunds, and net expenses without double-counting.

#### 4D — Recurring transactions

Traceability: `R-LEDGER`, `R-PWA`, `V-*`.

Tasks: recurring template UI/API, schedule state, pause/edit/cancel, idempotent generation, retry/failure status, and reminders placeholder.

Recurring generation follows the same atomic domain-change plus domain-event-outbox rule whenever it produces a domain event; a failed generation persists neither the generated business change nor its event.

Acceptance: duplicate generation is prevented, failures are observable/retryable, and future-occurrence semantics are clear.

Responsible agents: Ledger Agent; Backend Agent; API Contract Agent; Frontend Agent; Security Agent; Verification Agent.

Skills: `expense-ledger-review` `[Proposed custom; fallback]`, `financial-integrity-validation` `[Proposed custom; fallback]`, `exact-monetary-calculations` `[Proposed custom; fallback]`, `permission-matrix-review` `[Proposed custom; fallback]`, `postman:api-testing` `[Installed and verified]`, `unit-testing` `[Proposed custom; fallback]`, `integration-testing` `[Proposed custom; fallback]`, `e2e-testing-playwright` `[Proposed custom; fallback]`.

Verification/review gate: money/property tests, ledger integration, transfer/refund/recurring tests, authorization negatives, saved API assertions, critical E2E, mandatory independent Ledger review, and Security review for authorization/audit changes.

### Phase 5 — Transaction attachments

Dependency: Phase 3 authorization, Phase 4 transaction detail, D-09 approval.

Tasks:

1. Add transaction-scoped attachment initiation, upload completion, metadata, authorized preview/download, progress, retry, and failure states.
2. Enforce JPG/PNG/PDF and 10 MB per file server-side; validate detected content type rather than trusting client MIME.
3. Add approved private storage/scanner adapters and audit events.
4. Do not add a standalone attachment library or public object URLs.

Expected modules: `apps/api/src/modules/attachments`, storage/scanner adapters, attachment contract, transaction attachment components, and fixtures/tests.

Responsible agents: Backend; Security; API Contract; Frontend; Verification.

Skills: `expense-security-review` `[Proposed custom; fallback]`, `permission-matrix-review` `[Proposed custom; fallback]`, `postman:api-testing` `[Installed and verified]`, `integration-testing` `[Proposed custom; fallback]`, `e2e-testing-playwright` `[Proposed custom; fallback]`, `accessibility-testing` `[Proposed custom; fallback]`.

Verification/review gate: file validation, upload/download integration, authorization negatives, attachment E2E, scanner/storage failure tests, and Security approval.

### Phase 6 — Budgets, reports, exports, and notifications

Dependency: Phase 4 authoritative ledger. The workstreams below are independently gated; D-08 blocks only 6D and D-10 blocks only 6B.

#### 6A — Budgets

Dependency: Phase 4 ledger; no D-08 or D-10 dependency.

Tasks: implement global monthly and category budgets with threshold states, paired API/UI, localized budget feedback, and budget domain events for threshold changes. Persist each event in the domain-event outbox atomically with the applicable budget change whenever a single business transaction produces both.

Acceptance criteria: budget usage reconciles with the authoritative ledger, respects authorization, and has unit/integration/E2E evidence.

#### 6B — Reports and exports

Dependency: Phase 4 ledger and D-10 report/export definitions and layouts.

Tasks: implement weekly/monthly statistics and reports with paired API queries/UI tables/charts; emit report-ready/report-period domain events from the owning report workflow and persist them through the approved domain-event outbox; distinguish gross expenses, refunds, and net expenses; exclude transfers from income/expense totals; implement CSV, Excel, and PDF exports only after exact schemas/layouts are approved.

Acceptance criteria: report totals reconcile with the ledger, refunds are not double-counted, exports respect filters/permissions/locale, and report/export evidence passes.

#### 6C — Durable in-app notifications

Dependency: Phase 4 domain events and notification requirements; the budget-threshold portion depends on 6A, and weekly/monthly report notifications and report-ready events depend on 6B. Transaction, recurring, low-balance, and other notification types depend on the corresponding approved domain events from their owning phases. No external provider decision is required.

Tasks: establish the internal notification model, durable notification records, and the durable external-delivery outbox. Owning business workflows generate and persist their domain events atomically with the applicable business transaction in the domain-event outbox. The 6C notification workflow consumes those events, records consumer idempotency and processing status, retries recoverable failures with bounded backoff, records terminal failures for review, and creates the appropriate durable in-app notification plus external-delivery outbox record. Phase 6C never recreates or takes ownership of the original business-domain event. Implement budget-threshold notifications after 6A, and weekly/monthly report notifications and report-ready events after 6B. Keep in-app persistence independent of external provider configuration or credentials.

Acceptance criteria: domain events cannot be lost after a successful business commit; a failed business transaction creates no event; committed but unprocessed events remain available after a crash; consumption is idempotent and retryable; and terminal failures are observable. In-app state is modeled independently as `created/persisted`, `read/unread`, and `archived` only if approved product behavior supports archiving. External delivery state is not represented by the in-app state and is modeled separately as `pending/queued`, `attempted`, `delivered`, or `failed/terminal failure`. In-app records survive external delivery failure and are covered by integration/API/E2E evidence for each completed dependency; unrelated notification types are not blocked by 6A or 6B.

Responsible agents: each Backend and Domain business-module owner writes its own domain event and atomic domain-event-outbox persistence; Backend and Domain Agent writes the NestJS 6C notification consumer, in-app persistence, and external-delivery-outbox model in `apps/api`/`packages/db`; API Contract Agent owns public notification contracts and both state vocabularies; Frontend/PWA Agent writes the in-app notification UI; Verification Agent owns evidence; Security Agent reviews authorization and sensitive-data handling; Ledger Agent reviews budget/report event semantics where applicable. 6C owns notification records and notification-consumer state, not the source business events.

#### 6D — External notification delivery

Dependency: Phase 6C durable notification events/outbox and D-08 provider/channel approval. 6D consumes the durable events/outbox established by 6C; it does not recreate notification records or become their source of truth.

Tasks: add approved Web Push/email adapters that consume 6C durable external-delivery-outbox records; persist provider delivery attempts, provider idempotency keys, retry state, and terminal failure status without exposing credentials or sensitive payloads. External delivery state is independent of in-app `created/persisted`, `read/unread`, and `archived` state. Provider configuration, credentials, and delivery are not prerequisites for 6C in-app notifications.

Acceptance criteria: provider failures do not change or erase in-app notifications; each delivery attempt is idempotent, retryable where recoverable, and observable through the independent external state; terminal failure does not falsely mark an in-app notification as undelivered; and external delivery is tested only against approved disposable/mock targets unless separate live approval exists.

Responsible agents: Backend and Domain Agent writes NestJS provider adapters and delivery workers in `apps/api`; Release and Operations Review Agent reviews provider/outbox operations; Security Agent reviews credentials and payload boundaries; Verification Agent owns provider-failure, retry, and idempotency evidence. No agent duplicates 6C notification persistence.

Expected modules: `apps/api/src/modules/budgets`, `reports`, and `notifications`, NestJS background-processing/outbox entrypoints, export adapters, and `apps/web` feature routes/components.

Skills: `financial-integrity-validation` `[Proposed custom; fallback]`, `postman:api-testing` `[Installed and verified]`, `unit-testing` `[Proposed custom; fallback]`, `integration-testing` `[Proposed custom; fallback]`, `e2e-testing-playwright` `[Proposed custom; fallback]`, `performance-review` `[Proposed custom; fallback]`.

Verification/review gates: 6A budget tests and authorization review; 6B report reconciliation, export, API, and E2E tests plus independent Ledger review; 6C atomic business-event/outbox tests, crash/retry and idempotent-consumption tests, persistence/state-transition tests, integration/API, and in-app E2E tests for each available event source; 6D provider failure/retry/idempotency tests, independent external-state assertions, and Security/Operations review. No workstream may claim evidence from another workstream’s unrun tests.

### Phase 7 — Offline storage, synchronization, PWA, and conflict review

Dependency: Phase 2 offline-compatible contracts; Phase 4 idempotent ledger API; Phase 1 shell; D-05 and D-06 approval.

Purpose: implement offline behavior only after feature contracts and data models are compatible with it.

Tasks:

1. Implement service-worker shell caching and installability.
2. Implement IndexedDB local projection and durable outbox for the approved offline scope.
3. Implement idempotency keys, client operation IDs, sync cursor, retry states, stale-session handling, and reconnect behavior.
4. Implement conflict review showing attempted operation, server state/version, and resolution metadata.
5. Implement only the approved conflict actions; do not invent merge/keep-local/keep-server policies.
6. Test cache invalidation, logout/session expiry, local schema upgrades, quota failures, and sensitive-data boundaries.

Expected modules: service worker/PWA files, IndexedDB/sync adapters, `apps/api/src/modules/sync`, conflict-review components, sync contract, and failure fixtures.

Responsible agents: Frontend; Backend; Ledger; Security; Verification.

Skills: `offline-sync-validation` `[Proposed custom; fallback]`, `financial-integrity-validation` `[Proposed custom; fallback]`, `expense-security-review` `[Proposed custom; fallback]`, `postman:api-testing` `[Installed and verified]`, `integration-testing` `[Proposed custom; fallback]`, `e2e-testing-playwright` `[Proposed custom; fallback]`, `performance-review` `[Proposed custom; fallback]`.

Acceptance criteria:

- Approved offline writes survive refresh/reconnect without duplicates.
- Replayed idempotency keys return the original authoritative result.
- Conflicts preserve attempted/server state and remain explicit.
- No unapproved resolution policy is exposed.
- Offline data obeys approved session/authorization rules.
- PWA installability and offline-shell checks pass.

Verification/review gate: disconnect/reconnect E2E, duplicate replay, timeout/retry, conflict, stale auth, quota/schema migration, service-worker, cross-locale, Security, and Ledger reviews.

### Phase 8 — Hardening, operations, and release readiness

The workstreams below avoid making D-11 or D-12 prerequisites for unrelated hardening and verification. No deployment or production access is performed.

#### 8A — Security, observability, and migration readiness

Dependency: the relevant feature slices from Phases 1–7; no D-11 or D-12 dependency.

Tasks: complete threat modeling, secret/dependency scanning, authorization and audit-log review, safe-error review, structured logs/request IDs/health/readiness/metrics, and migration forward/rollback-limit review with clean/upgrade disposable-database tests.

Acceptance criteria: findings are resolved or explicitly risk-accepted; logs contain no sensitive payloads; migration behavior and rollback limits are evidenced; Security, Ledger, and Verification reviews pass for affected areas.

#### 8B — Backup and isolated restore

Dependency: 8A migration readiness and D-11 backup frequency/retention/owner/operator-interface approval.

Tasks: configure the approved backup policy, document the operator runbook, and perform the mandatory isolated restore drill. This does not create an end-user backup screen.

Acceptance criteria: the isolated restore succeeds, restored data integrity and application compatibility are verified, and the exact procedure/results are recorded separately from feature E2E evidence.

#### 8C — Provider-specific deployment readiness

Dependency: 8A and D-12 hosting/region/deployment-provider approval.

Tasks: review provider-specific container/deployment configuration, secret references, region, rollback, and CI approvals without deploying.

Acceptance criteria: provider-specific configuration is reviewable, secrets remain external, rollback limits are documented, and no deployment occurs without separate explicit approval.

#### 8D — Final release readiness

Dependency: 8A, 8B, 8C, all required feature gates, and product-owner release approval.

Tasks: run the full relevant verification suite and assemble release-readiness evidence, keeping the operational restore drill separate from Playwright application-flow results.

Acceptance criteria: relevant `TEST.md` checks pass with exact commands/results; no high/critical unresolved security or financial-integrity findings remain without explicit risk acceptance; release evidence is complete.

Expected files/modules: security/operations documentation, CI gates, migration runbooks, backup/restore runbook, observability modules, provider configuration review, and release checklist.

Responsible agents: Security Agent leads 8A; Release and Operations Review Agent leads 8B/8C/8D; Verification Agent owns evidence; Ledger Agent independently reviews financial migrations/integrity; Main Agent integrates and enforces gates.

Skills: `expense-security-review` `[Proposed custom; fallback]`, `security-review-threat-modeling` `[Proposed custom; fallback]`, `release-readiness` `[Proposed custom; fallback]`, `deployment-rollback-review` `[Proposed custom; fallback]`, `verification-before-completion` `[Proposed custom; fallback]`, `postman:ci-integration` `[Installed and verified]`, `postman:performance-testing` `[Installed and verified; only if approved]`.

Verification/review gates: 8A security/observability/migration evidence; 8B separate isolated operational restore drill; 8C provider-readiness review; and 8D full unit/integration/API/Playwright E2E/accessibility/offline/security/performance evidence. Independent Security and Operations reviews plus product-owner release approval are required.

## 9. Approval and verification gates by risk

### API contract gate

Before endpoint implementation: API Contract Agent provides OpenAPI/Postman artifacts, examples, error/idempotency/conflict semantics, notification in-app state (`created/persisted`, `read/unread`, and approved `archived`) and independent external-delivery state (`pending/queued`, `attempted`, `delivered`, `failed/terminal failure`), plus compatibility notes. Backend, Ledger, and Security review the contract. Verification runs contract lint and negative examples. No publishing or live credentials.

### Database schema/migration gate

Before applying migrations: Ledger and Backend Agents review exact-money, one-account-per-user, refund, audit, idempotency, archive, domain-event, and transactional-outbox constraints. Transfer-specific schema, relationships, constraints, migrations, and events remain deferred until D-04 is approved; the confirmed eventual requirement for linked debit/credit records is not implemented or enforced before then. Verification runs clean/upgrade migration tests against disposable PostgreSQL. No shared/production migration.

### Security gate

Before identity, authorization, attachment, export, offline, or deployment work proceeds: Security Agent reviews threat model, permission matrix, session/data boundaries, logs, and negative tests. Findings must be resolved or explicitly risk-accepted.

### Financial-integrity gate

Before ledger/report release: Ledger Agent independently verifies money representation, rounding, balance, transfer exclusion, refund accounting, recurring idempotency, report reconciliation, and migration safety. Passing UI tests alone is insufficient.

### Release-readiness gate

Before deployment approval: 8A security/observability/migration readiness, 8B backup/restore, and 8C provider-readiness gates are complete; Verification, Security, Operations, and Ledger reviews are complete; full relevant tests pass; the mandatory isolated restore drill and rollback plan are evidenced as operational verification separate from feature E2E; production access remains separately approved.

## 10. Verification model and reporting

### Unit

Exact money, rounding, currency snapshots, Morocco-day dates, balances, budgets, transfer/refund/recurring invariants, permissions, idempotency, attachment validation, and report reconciliation.

### Integration/API

Authentication, authorization, account setup, ledger writes, linked transfers, refunds, recurring generation, attachments, budgets, reports, exports, domain-event atomicity, outbox crash/retry behavior, idempotent notification consumption, independent in-app/external notification state transitions, notifications, audits, sync replay, conflict classification, and migrations.

API work follows the contract-first Postman/OpenAPI workflow: establish the intended contract, keep local artifacts diffable, run saved assertions against disposable targets, and distinguish local/mock/live evidence.

### E2E application workflows

Playwright E2E tests cover application user workflows. At minimum, prove the `TEST.md` flows for sign-in/setup, role assignment, income/expense, foreign currency, the approved transfer flow once D-04 is resolved, partial refund, recurring generation, budgets, attachments, offline sync/conflict, and English/French/Arabic RTL. Backup/restore is not a feature-level E2E test.

### Operational restore verification

Backup/restore verification is an Operations/Release integration or operational exercise, not a Playwright application-user workflow. Phase 8 must perform the isolated restore drill, verify data integrity and application compatibility, record the exact procedure/results, and keep the evidence separate from feature-level E2E results.

### Per-phase report

- Exact commands and environment.
- Pass/fail results and evidence scope: local, mocked, disposable integration, or live.
- Tests not run and why.
- Changed files and review status.
- Open decisions, limitations, residual risks, and next approval gate.
- Separate feature-level E2E results from operational restore-drill evidence.

## 11. Cross-cutting risks and mitigations

| Risk | Mitigation | Evidence/gate |
|---|---|---|
| D-01 setup details drift from the confirmed split | Confirm package manager, runtime, versions, and repository setup before Phase 1; keep Next.js presentation separate from NestJS backend behavior | Phase 0/1 gate |
| Phase overlap or UI/API drift | Use vertical feature slices after early shell/contract/schema foundations | Per-slice API/UI/test gate |
| Unsupported transfer accounts | Resolve D-04 domain question; omit selectors/fields until then | Phase 4B gate |
| Offline incompatibility discovered late | Define idempotency/version/outbox/conflict metadata in Phase 2 | Phase 2 contract/schema gate |
| Money drift/refund double-counting | Exact arithmetic, ledger invariants, gross/refund/net fixtures | Financial-integrity gate |
| UI-only authorization | Server guards and negative API/E2E tests | Security gate |
| Duplicate offline writes | Unique idempotency keys and replay tests | Phase 7 gate |
| Invented conflict policy | Display state/version/metadata only until D-06 | Phase 7 gate |
| Attachment exposure | Transaction-scoped authorization, private storage, short-lived URLs | Phase 5 Security gate |
| RTL/browser regressions | Approved matrix, logical CSS, locale fixtures, browser evidence | Phase 1/7 gates |
| Backup mistaken for restore proof | Isolated restore drill and operator runbook | Phase 8B gate |
| Notification/report decisions block unrelated work | Split Phase 6 into budgets, reports/exports, in-app notifications, and external delivery; gate only 6B/6D on D-10/D-08 | Phase 6 workstream gates |
| Backup/deployment decisions block unrelated readiness work | Split Phase 8 into 8A hardening/migration, 8B backup/restore, and 8C provider readiness | Phase 8 workstream gates |
| Missing skills misrepresented | Status labels, pre-use inspection, fallback reporting | Every phase report |
| Agent/runtime overreach | Bounded delegation, explicit permissions, final diff review | Agent Architecture rules |
| API contract drift | Local OpenAPI/Postman artifacts and saved assertions | Phase 2/per-change gate |

## 12. Rollback and recovery

- Use reversible or forward-only migrations with explicit rollback limits; never promise rollback for irreversible data transformations.
- Archive financial records rather than hard-delete them.
- Preserve audit history through corrections and migrations.
- Make transfer, refund, recurring generation, notification, attachment completion, and synchronization idempotent where applicable.
- Pair deployment artifacts with schema versions.
- Restore only into isolated environments unless separate production approval exists.
- If a phase fails, stop at its gate, preserve the diff, report evidence, and revert only approved reversible changes.

## 13. Revised execution order and stop condition

1. Approve this plan and resolve only the decisions required for the next phase.
2. Verify the approved D-01 setup and D-07/D-14 evidence, then build the Next.js `apps/web` foundation, design system, and application shell alongside the NestJS `apps/api` bootstrap.
3. Resolve D-13, then establish API contracts, database proposals, and offline-compatible metadata; keep D-02/D-03/D-04-dependent constraints deferred.
4. Resolve D-02/D-03, then implement identity, the single account, and singular Shared Wallet authorization.
5. Implement the income/expense slice; resolve D-04 immediately before and then implement the approved transfer slice; implement refunds and recurring transactions with their paired API/UI/tests.
6. Resolve D-09, then implement transaction-scoped attachments.
7. Implement 6A budgets; establish the independent 6C notification model and event/outbox workflow; add budget-threshold notification handling after 6A and report-ready/weekly/monthly notification handling after 6B; resolve D-10 before 6B reports/exports and D-08 before 6D external notification delivery.
8. Resolve D-05/D-06, then implement offline storage, synchronization, PWA, and approved conflict review against the earlier contracts.
9. Complete 8A hardening/observability/migration readiness; resolve D-11 before 8B backup/restore; resolve D-12 before 8C provider-specific readiness; complete 8D final release readiness.

Implementation must stop before the first task whose required decision, permission, test environment, or approval is missing. For skills, use an installed and verified skill when available; otherwise proceed with the approved documented fallback. Stop and request human intervention only when neither exists or when the fallback itself requires ungranted approval. The Product Owner has approved this plan and the D-01/D-07/D-14 prerequisites; implementation still proceeds only through the task-level gates above.
