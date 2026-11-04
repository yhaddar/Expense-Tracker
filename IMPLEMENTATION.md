# Expense Tracker — Complete Implementation Guide

Status: execution-ready guide for Product Owner review. This document does not itself start implementation, install dependencies, access production, publish API artifacts, deliver live notifications, deploy, commit, or push.

The complete product is in scope. The phases below are implementation and verification stages, not reduced releases or an MVP. A feature is complete only when its approved behavior, security controls, tests, localization, accessibility states, and end-to-end evidence are present.

## 1. Source of truth and completion definition

Authority order:

1. Current user instructions and explicit approvals.
2. `AGENTS.md`.
3. `SPEC.md` for product requirements.
4. Approved decisions in `PLAN.md` and this guide.
5. `DESIGN.md` for approved UI direction and flows.
6. `AGENT_ARCHITECTURE.md` for agent boundaries.
7. `TECHNICAL_DESIGN.md` for technical rationale and alternatives.
8. `TEST.md` for verification requirements.

The application is complete only when it supports the full `SPEC.md` scope: authentication, one Shared Wallet context, one financial account per user with MAD base currency, exact-money ledger operations, income, expenses, the approved transfer model, refunds, recurring transactions, budgets, statistics, reports, exports, transaction-scoped attachments, notifications, PWA/offline workflows, explicit synchronization conflicts, English/French/Arabic localization, Arabic RTL, server authorization, audit history, backups, and a verified isolated restore drill.

No requirement may be removed or indefinitely postponed because it is complex. If an unresolved decision blocks a feature, unrelated eligible work may continue, but the blocked feature may not be implemented by assumption.

## 2. Approved decisions and remaining gates

### Confirmed

- Monorepo with `pnpm` workspaces.
- Node.js 24 LTS, pinned in repository configuration.
- Strict TypeScript and exact, compatible pinned dependency versions; no floating `latest` versions.
- `apps/web`: Next.js App Router, React, TypeScript, PWA, presentation, and client experience.
- `apps/api`: NestJS modular monolith for backend business logic, authorization, financial operations, REST API, background processing, and database access.
- PostgreSQL, Drizzle ORM, reviewed SQL migrations, versioned REST/OpenAPI, and the shared packages defined below.
- Dexie/IndexedDB for approved offline capabilities.
- Latest two stable major versions of Chrome, Edge, Firefox, and Safari; supported iOS Safari and Android Chrome.
- Responsive targets: mobile from 360px, tablet from 768px, desktop from 1024px.
- Atlas Ledger identity, light and dark themes, licensed Latin/Arabic typography subject to verification, and full RTL behavior.
- Missing brand assets must use clearly marked temporary placeholders; no unapproved logo is invented.

### Open and just-in-time

| Decision | Blocks | Safe boundary |
|---|---|---|
| D-02 authentication provider/session strategy | Phase 3 identity | Shell and unauthenticated API boundaries may proceed |
| D-03 exact permission matrix | Phase 3 authorization and protected transaction actions | Creator/Admin edit/archive remains confirmed |
| D-04 transfer domain/context | Phase 4B | No transfer-specific schema, events, fields, selectors, or migrations |
| D-05 approved offline workflow boundary | Phase 7 | Contracts reserve idempotency/version metadata only |
| D-06 conflict-resolution actions | Phase 7 conflict UI | Display attempted/server state and metadata only |
| D-08 external notification providers/channels | Phase 6D | In-app notifications do not depend on providers |
| D-09 attachment storage/scanning/retention | Phase 5 | No public object URLs or storage implementation |
| D-10 report/export definitions/layouts | Phase 6B | Ledger and in-app notification work may proceed independently |
| D-11 backup frequency/retention/owner/operator interface | Phase 8B | Hardening, observability, and migration testing may proceed |
| D-12 hosting/region/deployment provider | Phase 8C | Local/disposable readiness work may proceed |
| D-13 API contract/Postman workflow | Phase 2 | No endpoint implementation before contract gate |

The Main Agent asks one focused question only when a dependency is reached. Confirmed decisions are not re-opened.

## 3. Architecture and boundaries

```text
apps/web        Next.js App Router PWA, UI, localization, RTL, client sync presentation
apps/api        NestJS REST API, authz, domain/application services, workers, DB access
packages/contracts  OpenAPI-aligned request/response and shared contract types
packages/domain     Exact money, ledger rules, permissions, event definitions, invariants
packages/db         Drizzle schema, reviewed SQL migrations, repositories, transactional helpers
packages/localization  English, French, Arabic messages and locale metadata
tests             Unit, integration, contract, browser, accessibility, and operational evidence
postman           Local API collections/environments/mocks only when approved
docs               Runbooks, ADRs, evidence, and maintenance documentation
```

Next.js and NestJS are separate applications. Next.js does not implement API route handlers that duplicate backend behavior. Financial writes, authorization, event creation, database transactions, and background processing belong to NestJS. Next.js may provide rendering, metadata, client presentation, and PWA behavior only.

The architecture remains a modular monolith, not a distributed messaging system. PostgreSQL domain-event and transactional-outbox tables are the initial reliability mechanism. A separate NestJS worker process may run the same `apps/api` codebase when needed; Redis, BullMQ, or another broker requires a separate evidence-based architecture decision.

### Event and notification ownership

1. The owning business module creates its domain event.
2. The business change and its domain-event outbox record commit atomically in the same PostgreSQL transaction whenever applicable.
3. A failed business transaction creates no event. A successful commit leaves the event available after a crash.
4. Phase 6C consumes domain events idempotently and creates durable in-app notification records plus the Phase 6D external-delivery outbox. It does not recreate or own source business events.
5. Phase 6D consumes the 6C external-delivery outbox and owns provider attempts, provider idempotency, retry state, and terminal failure status.
6. In-app state (`created/persisted`, `read/unread`, approved `archived`) is independent of external state (`pending/queued`, `attempted`, `delivered`, `failed/terminal failure`).

## 4. Agents, ownership, skills, and allowed changes

`AGENT_ARCHITECTURE.md` is authoritative. The Main Agent assigns one writer per file, prevents concurrent edits, integrates changes, and owns final evidence.

| Role | Primary ownership | Independent review boundary |
|---|---|---|
| Main Agent | Scope, gates, delegation, integration, final report | Reconciles all findings; cannot waive required review |
| Backend and Domain Agent | `apps/api`, application services, workers, domain integration | Does not self-approve security or financial integrity |
| API Contract Agent | `packages/contracts`, OpenAPI, local Postman artifacts | Reviews compatibility and negative cases |
| Ledger and Financial Integrity Agent | Financial invariants, `packages/domain`, migration review | Independently reviews Backend changes |
| Frontend/PWA and Localization Agent | `apps/web`, design system, RTL, client sync UI | Does not enforce server authorization or calculate authoritative balances |
| Security Agent | Threat model, authorization, data exposure, secrets, attachments | Independent security approval |
| Verification Agent | Test execution, evidence, acceptance mapping | Cannot convert partial/mock evidence into success |
| Release and Operations Agent | Observability, backup/restore, rollback, release readiness | Does not deploy or access production |

### Skill status and fallback

Installed and verified skills include `openai-docs`, `review-agent`, `skill-creator`, `postman:api-engineer`, `postman:api-documentation`, `postman:api-testing`, `postman:collection-schema-v3`, `postman:application-testing`, `postman:ci-integration`, `postman:performance-testing`, `postman:variables`, and `postman:workspaces`, subject to loading their current instructions before use.

Project-specific skills such as `financial-integrity-validation`, `expense-ledger-review`, `permission-matrix-review`, `expense-security-review`, `backend-architecture`, `rest-api-design`, `database-schema-design`, `offline-sync-validation`, `e2e-testing-playwright`, `accessibility-testing`, `performance-review`, `release-readiness`, and `deployment-rollback-review` are proposed custom skills and do not exist unless a validated `SKILL.md` is actually created and approved.

When no suitable verified skill is available, use the approved fallback: repository instructions, the relevant primary official documentation, focused task checklists in this guide, available local test tools, and an evidence report. Do not claim a proposed skill was loaded. Stop for human intervention only when no suitable verified skill or approved fallback exists, or when the fallback requires ungranted approval.

## 5. Bounded task loop

For every task:

1. Select the next eligible task from the phase sequence.
2. Read applicable instructions, requirements, design, contracts, and existing files.
3. Check dependencies, open decisions, approval gates, and allowed file scope.
4. Prepare a small task plan with acceptance criteria and commands.
5. Implement only that task with one writer per file.
6. Run required unit, integration, contract, browser, security, or operational checks.
7. Obtain independent review for security, financial, migration, API, offline, or release-sensitive work.
8. Fix findings and rerun verification.
9. Record changed files, exact commands, results, evidence scope, failures, and limitations.
10. Mark complete only when evidence satisfies the task criteria; then select the next eligible task.

Maximum delegation depth is one level below the Main Agent. Concurrent delegation is limited by `AGENT_ARCHITECTURE.md`; dependent tasks and overlapping files are serialized. Retry transient tool failures at most twice. Do not retry policy, permission, credential, or unresolved-decision failures.

## 6. Phase 0 — Decisions, compatibility, and implementation setup

Owner: Main Agent with Requirements, Technical Research, and API Contract roles.

Tasks:

- Verify pnpm workspace behavior, Node.js 24 LTS pinning, strict TypeScript, and exact version compatibility using official documentation and local tool checks.
- Select and record exact compatible versions for Next.js, React, NestJS, Drizzle, PostgreSQL client, test tools, and PWA tooling. Do not use floating versions.
- Record D-07 browser/OS matrix and capability fallbacks: foreground retry where Background Sync is unavailable, in-app notifications where Push is unavailable, and clear offline freshness states.
- Verify D-14 font licensing/rendering suitability for Latin and Arabic; define both theme token sets; identify missing brand assets as placeholders.
- Confirm D-13 local OpenAPI/Postman artifact location without publishing.

Allowed files: `PLAN.md`, `IMPLEMENTATION.md`, compatibility ADRs, and later approved configuration files. No application code or dependency installation in this phase.

Acceptance: decisions are recorded, exact version-selection evidence exists, browser and theme acceptance matrices are explicit, and no unresolved decision is silently assumed.

Verification: official documentation review, local runtime checks, `git diff --check`, and Main Agent approval of the Phase 1 prerequisite packet.

## 7. Phase 1 — Monorepo, design system, shell, and tooling

Dependencies: Phase 0 complete; D-01, D-07, and D-14 verified; no D-02/D-03 integration yet.

### 1A — Workspace and applications

Owner: Main Agent and Backend/Frontend Agents.

Allowed files: root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, Node version file, `tsconfig` files, `apps/web/**`, `apps/api/**`, package manifests, approved config files, and the scaffolding-only paths `packages/contracts/**`, `packages/domain/**`, `packages/db/**`, and `packages/localization/**`. These shared-package paths are limited to scaffolding, manifests, configuration, and neutral foundations; they do not authorize features gated by later phases or unresolved decisions.

Tasks: create `apps/web` Next.js application, `apps/api` NestJS application, shared package scaffolds, safe scripts, environment templates without secrets, and health/readiness boundaries. Keep NestJS background entrypoint boundaries within `apps/api`.

Acceptance: clean setup uses Node 24 LTS and pnpm; web and API start locally; health/readiness does not access production; no Next.js backend duplicate exists.

Verification: install using the approved lockfile workflow, lint, format check, type check, clean build, local web/API smoke, and secret scan.

### 1B — Atlas Ledger design system and shell

Owner: Frontend/PWA and Localization Agent; Security and Verification review.

Allowed files: `apps/web/app/**`, `apps/web/components/**`, `packages/localization/**`, design tokens, font declarations/licensing notes, manifest, and service-worker shell configuration.

Tasks: implement light/dark tokens, typography with verified licensed Latin/Arabic fonts, spacing, focus, motion/reduced-motion, shell navigation, Shared Wallet context indicator, responsive rail/bottom bar, locale direction root, loading/error/empty/offline shell states, and clearly labeled asset placeholders.

Acceptance: mobile 360px, tablet 768px, and desktop 1024px layouts work; English/French/Arabic direction switching works; Arabic navigation/forms/tables/dialogs mirror correctly; both themes meet contrast requirements; no financial behavior is implemented.

Verification: keyboard/focus review, accessibility checks, RTL visual checks, browser matrix smoke checks, responsive screenshots, and E2E-runner/CI boot validation only. No feature-flow E2E is claimed yet.

### 1C — Test and CI infrastructure

Owner: Verification Agent; Security review.

Allowed files: test configuration, CI skeleton, scripts, fixtures with synthetic data, and documentation.

Tasks: configure unit, integration, API contract, Playwright runner, lint, type-check, build, dependency/security-check entrypoints. This task creates infrastructure, not feature E2E coverage.

Acceptance: commands fail correctly on intentional fixture failures, use no secrets, and distinguish local, mocked, disposable, and live evidence.

Verification: command smoke tests and CI configuration review.

## 8. Phase 2 — Contracts, schema, and offline-compatible foundations

Dependencies: Phase 1; D-13; D-02/D-03 constraints remain provisional until approved; D-04 transfer schema remains deferred.

Owner: API Contract, Backend, Ledger, Security, and Frontend/PWA Agents.

Allowed files: `packages/contracts/**`; `packages/db/schema/**` and `packages/db/migrations/**` only for neutral proposals, shared primitives, and explicitly non-provider/non-permission-specific scaffolding; `packages/domain/money/**`; `packages/domain/events/**` for generic event envelopes/outbox types; local `postman/**`; sync contract types; ADRs; and schema/test fixtures. No executable D-02/D-03 provider/session or permission-matrix migrations, and no transfer-specific files, may be added in Phase 2.

Tasks:

- Define `/api/v1` REST/OpenAPI resources, errors, request IDs, cursor pagination, idempotency keys, optimistic versions, conflict metadata, notification state vocabularies, and compatibility rules.
- Define PostgreSQL/Drizzle schema proposals for identity, Shared Wallet membership, roles, one account per user, ledger records, currency snapshots, attachments, budgets, reports, notification records, domain-event outbox, notification-delivery outbox, idempotency, sync metadata, conflicts, and audit events.
- Define transactional-outbox rules: source business modules write their event in the same transaction as the business change; consumers track idempotency/status/retry; no distributed broker is introduced.
- Prepare migration conventions, constraints, archive fields, audit references, seed-fixture plans, clean/upgrade migration plans, and migration review documentation without creating executable migrations or executing any migration.
- Define offline-compatible client operation ID, base version, cursor, schema version, retry state, and conflict metadata without choosing unapproved conflict actions.
- Explicitly exclude transfer-specific fields, relationships, constraints, migrations, and events until D-04 approval; reserve only neutral extensibility.

D-02/D-03/D-04 boundary: neutral identity, membership, role, permission, session, and transfer-extensibility schema proposals may be prepared for review, but authentication-provider/session-specific migrations and implementation remain blocked until D-02 approval; permission-matrix-specific constraints, authorization policies, protected-route implementation, seeds, and migrations remain blocked until D-03 approval; and transfer-specific migrations remain blocked until D-04 approval. Neutral proposals do not constitute implementation or approval, and no provider, session strategy, permission matrix, authorization behavior, or transfer model may be silently assumed in Phase 2.

Acceptance: contracts are reviewable and diffable; one-account and exact-money invariants are represented; event loss/crash cases have test scenarios; transfer model is not assumed; offline metadata supports later approved workflows.

Verification: OpenAPI/collection lint, API negative examples, non-executing schema validation, migration-plan/document review, money tests, and independent API/Ledger/Security review. Do not create or execute migrations, run PostgreSQL migration dry runs, or apply schema changes in Phase 2.

## 9. Phase 3 — Identity, account, Shared Wallet, and authorization

Dependencies: Phase 2; D-02 and D-03 approval.

Owner: Backend, Security, API Contract, Frontend, and Verification Agents.

Allowed files: `apps/api/src/modules/identity/**`, `wallet-access/**`, `accounts/**`, `audit/**`, guards/policies, contracts, web auth/setup routes, localization, and authorization fixtures.

Tasks: implement approved authentication/session strategy; account setup and opening balance; one financial account per user with MAD base currency; singular Shared Wallet membership; Admin bootstrap; custom roles/permissions; server guards; audit events; authenticated/loading/unauthorized/expired states.

Acceptance: every protected operation is server-authorized; Admin/custom-role behavior matches approved D-03; creator/Admin transaction edit/archive rules are enforceable; account balance starts from opening balance; unauthorized data is not inferable.

Verification: auth/session integration, positive/negative permission matrix, account setup E2E, audit assertions, API contract tests, and independent Security review.

## 10. Phase 4 — Ledger vertical slices

Dependencies: Phase 3 authorization, Phase 2 schema/contracts, independent Ledger review. D-04 is required only immediately before 4B.

Allowed files: `packages/domain/**`, `packages/db/**` for approved non-transfer structures, `apps/api/src/modules/ledger/**`, transaction contracts, `apps/web/**` transaction features, and corresponding tests. Transfer-specific files remain prohibited until D-04.

All financial mutations use exact arithmetic, server authorization, audit events, idempotency where applicable, and a database transaction. Business changes that emit domain events atomically persist the corresponding domain-event outbox record.

### 4A — Income and expense

Owner: Backend/Ledger; Frontend; API Contract; Security; Verification.

Allowed files: `packages/domain/ledger/**`, `apps/api/src/modules/ledger/**`, transaction contracts, web transaction features, and tests.

Tasks: exact-money/MAD balance utilities, categories/payment methods, create/read/update/archive, transaction list/detail/composer, attachments reference points, and audit events.

Acceptance: balances reconcile exactly; historical conversion snapshots remain immutable; creator/Admin edit/archive works; unauthorized operations fail; authoritative server values are displayed.

Verification: unit/property money tests, API integration, authorization negatives, audit tests, and critical Playwright flow.

### 4B — Transfer

Owner: Backend/Ledger; API Contract; Frontend; Security; Verification.

Gate: resolve D-04 domain meaning before any transfer schema, event, field, selector, migration, or implementation. Do not invent source/destination accounts, user-to-user contexts, or additional wallets.

After approval: implement atomic linked debit/credit records, linked detail, transfer exclusion from income/expense totals, idempotency, audit, API assertions, and UI/E2E.

Acceptance: approved transfer model preserves one financial account per user, linked legs are atomic/auditable, totals reconcile, and transfers never enter income/expense totals.

### 4C — Refunds

Owner: Ledger/Backend; API Contract; Frontend; Security; Verification.

Tasks: original reference, remaining refundable amount, full/partial refunds, history, balance effect, and report projection.

Acceptance: refunds are not income; gross, refund, and net values are distinct; no double-counting; authorization and audit evidence pass.

### 4D — Recurring transactions

Owner: Ledger/Backend; Worker; API Contract; Frontend; Security; Verification.

Tasks: templates, schedule, pause/edit/cancel, idempotent generation, retry/failure status, reminders, and future-occurrence semantics.

Acceptance: duplicate generation is impossible under retries; failures are observable/retryable; authorized controls and audit events work.

## 11. Phase 5 — Transaction-scoped attachments

Dependencies: Phase 3 authorization, Phase 4 transaction detail, D-09.

Owner: Backend, Security, API Contract, Frontend, Verification.

Allowed files: `apps/api/src/modules/attachments/**`, private-storage/scanner adapters, attachment contracts, transaction attachment components, and tests.

Tasks: initiate/upload/complete flow; JPG/PNG/PDF and 10 MB server validation using detected content type; private storage; scanner integration boundary; authorized preview/download; audit events; retry/failure states.

Acceptance: no public object URLs; unauthorized access fails; storage/scanner failures are safe and retryable; no standalone attachment library is introduced.

Verification: validation unit tests, upload/download integration, authorization negatives, attachment E2E, scanner/storage failure tests, and Security review.

## 12. Phase 6 — Budgets, reports, exports, and notifications

Dependencies: Phase 4 authoritative ledger. 6A, 6B, 6C, and 6D are independently gated.

Allowed files: `apps/api/src/modules/budgets/**`, `reports/**`, and `notifications/**`; `packages/domain/**` and `packages/db/**` for approved event/notification structures; `packages/contracts/**`; `apps/web/**` feature routes/components; NestJS background-processing entrypoints; and corresponding tests. Provider-specific files are excluded from 6A–6C.

### 6A — Budgets

Owner: Backend/Ledger; API Contract; Frontend; Security; Verification.

Implement global monthly and category budgets, threshold states, paired API/UI, and localized feedback. When a ledger transaction produces a committed source domain event, the ledger transaction and source event are committed atomically. The budget module consumes that committed event idempotently, calculates threshold crossings, and atomically persists the resulting budget state together with its corresponding budget domain event. The Phase 6C notification consumer then processes the budget event idempotently. Consumer idempotency keys, transactional state/event writes, bounded retries, and crash recovery must prevent duplicate threshold notifications.

Verification: threshold unit tests, reconciliation, authorization, API, and Playwright evidence.

### 6B — Reports and exports

Dependencies: Phase 4 and D-10.

Owner: Backend/Ledger; API Contract; Frontend; Verification; Security.

Implement weekly/monthly statistics, gross/refund/net presentation, transfer exclusion, report-ready events, and approved CSV/Excel/PDF exports. Refunds must not be double-counted.

Verification: ledger reconciliation, report fixtures, export schema/layout tests, permission/locale tests, API contract tests, and E2E.

### 6C — Durable in-app notifications

Dependencies: Phase 4 domain events; budget notifications additionally depend on 6A; report-ready/weekly/monthly notifications additionally depend on 6B. No external provider decision is required.

Owner: Backend/Domain writes the notification consumer, in-app records, and external-delivery outbox; API owns contracts; Frontend owns notification UI; Security, Ledger, and Verification independently review.

Implement idempotent domain-event consumption, consumer status, bounded retry/backoff, terminal failure visibility, durable in-app records, and the 6D delivery outbox. Source business modules own and persist their domain events; 6C never recreates them. In-app states are `created/persisted`, `read/unread`, and approved `archived`.

Acceptance: successful business commits cannot lose events; failed transactions create none; crash recovery retries committed events; budget threshold crossings and budget events are atomic; the notification consumer is idempotent; retries and crashes cannot create duplicate threshold notifications; provider configuration is unnecessary; in-app records survive external failure; state transitions are explicit and idempotent.

Verification: transactional-outbox tests, ledger-event atomicity tests, budget consumer idempotency and threshold-crossing tests, atomic budget-state/event tests, crash/retry tests, duplicate-notification tests, event-consumer integration/API tests, notification-state contract tests, and in-app E2E.

### 6D — External notification delivery

Dependencies: Phase 6C external-delivery outbox and D-08.

Owner: Backend writes NestJS provider adapters/workers; Operations reviews delivery; Security reviews credentials/payloads; Verification owns failure evidence.

Consume 6C outbox records for approved Web Push/email. Persist independent `pending/queued`, `attempted`, `delivered`, and `failed/terminal failure` state, provider idempotency, bounded retries, and terminal failures. Do not duplicate 6C notification persistence.

Acceptance: external failure never changes or deletes in-app records; attempts are observable and idempotent; only approved mock/disposable targets are used unless live delivery is separately approved.

## 13. Phase 7 — Offline, synchronization, PWA, and conflicts

Dependencies: Phase 2 contracts, Phase 4 idempotent API, Phase 1 shell, D-05 and D-06.

Owner: Frontend/PWA; Backend; Ledger; Security; Verification.

Allowed files: service worker/PWA files, IndexedDB/Dexie adapters, `apps/api/src/modules/sync/**`, conflict UI, sync contracts, and fixtures.

Tasks: shell caching/installability; approved local projection and durable outbox; client operation IDs; sync cursor; retries; stale-session handling; reconnect; explicit conflict display with attempted/server version and resolution metadata; only approved conflict actions; quota/schema/session safety.

Acceptance: approved offline writes survive refresh/reconnect without duplicates; replay returns original authoritative result; conflicts never silently overwrite; unauthorized offline data is not exposed; browser capability fallbacks are clear.

Verification: disconnect/reconnect E2E, duplicate replay, timeout/partial sync, conflict, stale auth, quota/schema migration, service-worker, cross-locale, Security, and Ledger reviews.

## 14. Phase 8 — Hardening, operations, and release readiness

Allowed files: security and operations documentation, CI configuration, migration and backup/restore runbooks, observability modules, release checklist, provider-readiness configuration review, and tests. No deployment, production resource, or production credential changes are allowed.

### 8A — Security, observability, migrations

Dependencies: relevant feature slices; no D-11/D-12 dependency.

Owner: Security leads; Operations, Ledger, Verification review.

Implement threat model, secret/dependency scanning, authorization/audit review, safe errors, structured logs, request IDs, health/readiness, metrics, migration forward/rollback limits, clean/upgrade tests, and no-sensitive-payload logging.

### 8B — Backup and isolated restore

Dependencies: 8A and D-11.

Owner: Operations leads; Verification and Ledger review.

Configure approved backup policy, operator runbook, isolated restore drill, data-integrity verification, and application-compatibility verification. This is operational evidence, not Playwright feature E2E and not an end-user backup screen.

### 8C — Provider-specific readiness

Dependencies: 8A and D-12.

Owner: Operations; Security; Verification.

Review provider configuration, region, external secret references, rollback, CI approvals, and deployment artifacts without deploying.

### 8D — Final release readiness

Dependencies: all feature gates, 8A/8B/8C, and explicit release approval.

Run full unit, integration/API, contract, Playwright, accessibility, offline, security, performance, migration, and separate restore verification. No production deployment occurs in this guide.

## 15. Verification matrix

| Layer | Required evidence |
|---|---|
| Unit | Exact money, rounding, Morocco-day dates, balances, budgets, permissions, idempotency, attachment validation, report reconciliation, recurring schedules |
| Integration/API | Auth/session, authorization, account setup, ledger, approved transfers, refunds, recurring recovery, attachments, budgets, reports, exports, notifications, audit, sync, migrations |
| Contract | OpenAPI/Postman schemas, error/idempotency/conflict semantics, notification state vocabularies, negative authorization examples |
| Playwright E2E | Sign-in/setup, roles, income/expense, foreign currency, approved transfer, refund, recurring, budgets, attachments, offline sync/conflict, localization/RTL |
| Accessibility | Keyboard, focus, labels, contrast, reduced motion, screen-reader states, chart alternatives, RTL, 360/768/1024 layouts |
| Security | Server authorization negatives, session boundaries, attachment access, input validation, secret/log review, dependency scanning, threat model |
| Performance | API/report/worker measurements against approved targets; distinguish application limits from load-generator limits |
| Operations | Clean/upgrade migrations, observability, backup policy, isolated restore drill, rollback limits |

Every report includes exact commands, environment/evidence scope, pass/fail results, tests not run, changed files, review status, risks, and next gate. No mocked, local, or partial result is reported as live success.

## 16. CI/CD and release controls

CI must run formatting, lint, strict type checking, unit tests, integration tests against disposable services, contract checks, security/dependency checks, build, and relevant Playwright suites. CI must not contain secrets or production data. Deployment jobs require explicit approval and remain disabled for this documentation task.

Release requires complete relevant evidence, independent Security/Ledger/Operations/Verification reviews, clean/upgrade migration evidence, the isolated restore drill, documented rollback limits, and explicit Product Owner release approval. No public API collection publishing, live notification, production credential use, or deployment is allowed without separate approval.

## 17. Risks and recovery

- Unresolved decisions: stop only the dependent task; continue independent work.
- Transfer ambiguity: preserve neutral extensibility and stop before transfer schema/events/UI.
- Financial drift: stop at Ledger review, preserve evidence, correct invariants, rerun reconciliation.
- Authorization failure: block the affected feature until server negative tests pass.
- Offline conflict ambiguity: show state/version/metadata only until D-06 is approved.
- Event loss risk: require atomic business transaction plus domain-event outbox and crash/retry tests.
- Provider failure: retain in-app notification state and retry external delivery independently.
- Migration failure: stop, preserve disposable evidence, apply only approved reversible recovery; never promise rollback for irreversible transformations.
- Browser capability gap: use foreground retry/in-app fallbacks and document the unsupported capability.

## 18. Final completion checklist

- [ ] Full `SPEC.md` scope is implemented; no feature was silently removed or indefinitely deferred.
- [ ] Next.js `apps/web` and NestJS `apps/api` boundaries are preserved.
- [ ] Exact pinned versions, lockfile, strict TypeScript, and reproducible setup are verified.
- [ ] One Shared Wallet context and one financial account per user are enforced.
- [ ] Authentication, server authorization, creator/Admin edit/archive, audit, and data isolation pass negative tests.
- [ ] Exact money, immutable currency snapshots, transfers, refunds, recurring idempotency, reports, and reconciliation pass Ledger review.
- [ ] Domain events and transactional outbox survive failures and retries without duplication.
- [ ] In-app and external notification states remain independent.
- [ ] Attachments are private, transaction-scoped, validated, and authorized.
- [ ] Approved offline workflows, idempotent synchronization, explicit conflicts, and browser fallbacks pass.
- [ ] English/French/Arabic, RTL, light/dark themes, accessibility, and responsive targets pass.
- [ ] OpenAPI/contract evidence, unit, integration, E2E, security, performance, migration, and operational evidence are complete.
- [ ] Backup restore drill passes in isolation.
- [ ] No unresolved high/critical security or financial findings remain without explicit risk acceptance.
- [ ] Product Owner release approval is recorded before deployment or public release.

## 19. Current task boundary

This document rebuild creates the implementation guide only. No application implementation, dependency installation, migration, production access, live delivery, deployment, commit, push, or publish operation is authorized by this file alone.
