# Expense Tracker — Technical Design

Status: D-01 technical foundation approved for implementation planning; provider-specific and other explicitly open decisions remain unresolved. No application code is implemented by this document.

## Analysis of the existing documents

`AGENTS.md` establishes a security-sensitive, family-finance product, a Morocco-day/UTC date rule, exact-money arithmetic, server-side authorization, auditability, offline synchronization, PWA delivery, multilingual RTL support, and approval gates. `SPEC.md` is the product baseline. The Product Owner has since approved D-01 (pnpm/Node 24/Next.js/NestJS/PostgreSQL/Drizzle/REST/OpenAPI/Dexie), D-07 browser targets, and D-14 Atlas Ledger light/dark design-system direction. Authentication, providers, offline boundary, notification channels, and export details remain open where identified in `PLAN.md`.

No repository source, package manifest, test runner, deployment configuration, or existing API contract exists. The approved D-01 foundation is therefore an approved direction, while exact version compatibility and the remaining provider-specific choices still require verification.

## Recommended stack summary

| Area | Recommendation | Status | Main reason |
|---|---|---|---|
| Frontend/PWA | Next.js App Router + React + TypeScript | Approved D-01 | Strong web UX, routing, SSR where useful, and documented PWA path |
| Backend | NestJS + TypeScript, modular monolith | Approved D-01 | Explicit modules, guards, validation, OpenAPI, and testable boundaries |
| Database | PostgreSQL | Approved D-01 | Transactions, constraints, decimal types, audit-friendly relational modeling |
| ORM/data access | Drizzle ORM plus reviewed SQL for ledger/report queries | Approved D-01 | SQL-like control, typed schema, low abstraction around financial invariants |
| API | Versioned REST/JSON with OpenAPI as the contract | Approved D-01 | Simple browser/offline clients, explicit errors, easy contract testing |
| Authentication | OIDC-first identity provider; opaque server session fallback for local-first auth | Open vendor decision | Avoid coupling the API to one provider while keeping browser sessions secure |
| Offline storage | IndexedDB, accessed through Dexie; service worker using Workbox/Serwist | Approved direction; tooling option open | Durable local queue and cache with explicit application control |
| Synchronization | Custom transactional outbox/inbox protocol with idempotency keys and version conflicts | Proposed | Financial records need explicit conflict handling, not silent merge |
| File storage | Private S3-compatible object storage with short-lived presigned URLs | Provider open | Large files stay out of the database; access remains server-authorized |
| Notifications | In-app notification table + Web Push; email provider open | Proposed | Durable in-app history plus optional device notifications |
| Jobs | PostgreSQL outbox/job tables and a worker initially; Redis/BullMQ only if needed | Proposed | Fewer services while preserving retryable jobs |
| Testing | Vitest, Playwright, API integration tests, and a Postman collection | Proposed | Fast domain tests plus real browser and contract evidence |
| Deployment | Docker containers, managed PostgreSQL, private object storage, CI/CD with approvals | Provider open | Portable deployment and no production resource commitment now |

## Frontend and PWA

### Alternatives considered

- Next.js/React: broad ecosystem, mature routing and accessibility tooling, server/client composition, and an official PWA guide. The PWA service worker and offline data layer still require deliberate implementation.
- Vite + React: smaller and simpler client build, but routing, SSR, deployment conventions, and PWA integration become more application-owned.
- SvelteKit: smaller client runtime and good web ergonomics, but introduces a second ecosystem choice without an existing repository convention.

### Recommendation

Use Next.js App Router with strict TypeScript and a thin client-side state layer. Keep financial writes in the backend API rather than Next.js Server Actions so offline clients, end-to-end tests, and other future clients share one contract. Use a web manifest, service worker, installability checks, and progressive enhancement.

Next.js documents a PWA route with a manifest, service worker, Web Push, and offline options such as Serwist. Serwist/Workbox should be treated as implementation options, not proof that offline business behavior is solved.

### Risks and compatibility

- Service-worker caching can expose stale or unauthorized data. Cache only public shell assets and carefully scoped, encrypted/authorized local data.
- Browser support for Background Sync and Push varies. The application must provide foreground retry and in-app notifications as fallbacks.
- Arabic RTL and responsive financial tables need browser-based visual tests, not just component snapshots.

## Backend and application architecture

### Alternatives

- NestJS: structured modules, guards, dependency injection, testing utilities, and OpenAPI integration; more ceremony than a small Hono/Fastify service.
- Fastify/Hono: lower framework overhead and good performance; more architecture and authorization conventions must be assembled by the project.
- Next.js-only backend was considered and rejected for this implementation: it would couple the API and PWA lifecycle and be less convenient for offline sync workers, scheduled recurring generation, and independent API clients. It is not an implementation option.

### Recommendation

Use a NestJS modular monolith behind a versioned REST API. Deploy the API and worker as separate processes from the same codebase so domain rules are shared without starting with microservices.

Proposed modules:

1. Identity and sessions.
2. Users, wallets, roles, and permissions.
3. Accounts and exact-money calculations.
4. Ledger transactions, transfers, refunds, and recurring templates.
5. Categories, budgets, statistics, and reports.
6. Attachments and object-storage access.
7. Notifications and notification preferences.
8. Synchronization and idempotency.
9. Audit log and operational administration.
10. Health, metrics, and readiness checks.

Each protected command must pass through authentication, authorization, input validation, domain invariant checks, a database transaction where needed, and an audit event. Controllers map HTTP to application commands; domain services own financial rules; repositories own persistence; workers own retryable scheduled/outbox work.

Nest's official documentation supports OpenAPI generation, authentication guards, authorization patterns, and end-to-end HTTP testing. Those features help, but they do not replace review of the permission matrix or financial invariants.

## Database and ORM

### Database comparison

- PostgreSQL: recommended. It provides ACID transactions, foreign keys, check constraints, indexing, JSONB for bounded metadata, and strong reporting/query support.
- MySQL: viable for ordinary CRUD, but PostgreSQL is a better fit for complex constraints, reporting, and future audit/query needs.
- MongoDB: flexible documents and easy local modeling, but weaker fit for linked transfer legs, relational authorization, audit queries, and atomic financial workflows.
- SQLite: excellent for unit tests and local prototypes, but not the production source of truth for shared multi-user synchronization.

Use PostgreSQL as the authoritative server database. Use integer minor units for currencies with fixed minor-unit rules, or PostgreSQL `numeric` for exchange-rate and converted-value precision; define rounding per currency in the domain layer. Do not use JavaScript `number` for money.

### ORM comparison

- Drizzle: SQL-like, typed schema/query APIs, small abstraction surface, and direct access to PostgreSQL features. Best fit for a ledger where query shape and constraints must remain visible.
- Prisma: strong typed model workflow, migrations, and agent-readable schema. Current Prisma documentation has a moving major-version boundary, so version pinning and migration workflow validation would be mandatory before adoption.
- TypeORM: familiar decorators and broad database support, but more runtime behavior and historical ambiguity around generated SQL make it a weaker default for this finance ledger.
- Kysely/raw SQL: maximum SQL control, but more hand-written mapping and migration discipline.

Recommend Drizzle with explicit SQL migrations and a small reviewed raw-SQL escape hatch for reports/ledger queries. If the team values Prisma's contract tooling more than SQL visibility, Prisma remains a viable alternative, but it requires a separate version decision before implementation.

Core relational invariants should be enforced in both domain code and the database: unique idempotency keys, linked transfer constraints, nonnegative/allowed amounts, immutable exchange-rate snapshots, optimistic version columns, and audit references.

## Authentication and authorization

### Alternatives

- OIDC provider: delegates credential lifecycle, MFA, recovery, and federation; adds provider and availability dependency.
- Auth.js/Next-only authentication: convenient for a single Next.js app, but less natural for an independent NestJS API and offline sync worker.
- First-party email/password: no vendor dependency, but the project owns password hashing, recovery, MFA, abuse controls, and security review.
- JWT-only browser auth: portable, but revocation, rotation, and secure browser storage are harder than opaque sessions.

### Recommendation

Use Keycloak as the approved OIDC provider for the current implementation. The API validates issuer, audience, signature/JWKS, and expiry. Application roles and wallet permissions remain in PostgreSQL and are never inferred from frontend visibility or provider claims alone. Browser callback/session persistence and revocation are still unfinished and must not be claimed from bearer-token validation alone.

For a local or provider-unavailable development mode, use an opaque server-side session cookie backed by PostgreSQL, with `Secure`, `HttpOnly`, and appropriate `SameSite` settings. Do not store access tokens in localStorage. A first-party password path, if approved, must use a modern password hash and dedicated rate limiting.

Approval is still required for account-recovery channel, MFA policy, and final session lifetime/revocation rules.

## API contract

Use `/api/v1` REST resources with JSON error envelopes containing a stable code, human-safe message, field details where applicable, request ID, and retryability classification.

Contract principles:

- OpenAPI is generated/maintained as a reviewable artifact.
- Postman collection requests and assertions should be kept in the repository once implementation begins.
- Mutating operations accept an idempotency key; retries return the original result.
- List endpoints use cursor pagination and explicit filters/sort order.
- Financial writes return the authoritative server record and version.
- Conflicts return a distinct response with current version and resolution metadata; they are not silently overwritten.
- Attachments use an authorized initiate/upload/complete flow rather than accepting arbitrary public URLs.

The Postman API-engineering workflow recommends establishing the contract before implementation, keeping collections/specs/mocks local and diffable, and testing changed behavior against saved requests. This project should follow that approach after the stack is approved.

## Offline storage and synchronization

### Recommendation

Use IndexedDB through Dexie for a local projection, mutation outbox, sync cursor, conflict records, and metadata. Use a service worker for shell caching and network interception. Use foreground retry universally; use Background Sync opportunistically because browser support is not uniform.

Do not attempt a CRDT for the financial ledger. A mutation includes a client operation ID, aggregate ID, base version, operation type, payload, created-at timestamp, and schema version. The server atomically records the idempotency key, validates authorization and invariants, applies the command, records an audit event, and advances the aggregate version.

Synchronization states are `queued`, `sent`, `accepted`, `conflict`, `retryable_failure`, and `permanent_failure`. A conflict is user-visible and preserves both the attempted operation and server state for explicit resolution.

Risks include device loss, stale authorization, local data leakage, quota eviction, and schema upgrades. Minimize cached sensitive data, encrypt where the approved threat model requires it, expire sessions, version migrations, and provide recovery from the server projection.

## Attachments and file storage

Store file metadata and authorization ownership in PostgreSQL; store bytes in a private S3-compatible bucket. The API validates file size, extension, detected content type, malware scanning policy, and transaction authorization before issuing a short-lived presigned upload/download URL. The client never receives bucket credentials.

S3 documentation confirms that presigned URLs grant time-limited access and are bearer capabilities, so expiry, scope, checksum, key naming, and logging controls are required. The exact object-storage provider and malware-scanning service remain open.

## Notifications and background work

- In-app notifications are durable database records with read state, event type, locale, and link target.
- Web Push is optional per device and delivered through a service worker over HTTPS.
- Email remains a provider decision; queue it through an outbox and record delivery attempts without logging message secrets or tokens.
- Recurring generation, reports, budget checks, notification fan-out, attachment scanning, and cleanup run as retryable worker jobs.
- Use PostgreSQL outbox/job tables first. Move to Redis/BullMQ only when observed throughput or scheduling needs justify another stateful dependency.

Push notifications are not the source of truth. Users must still see relevant events in-app, and failed push/email deliveries must be retryable and observable.

## Testing and verification technology

- Vitest for domain, API-service, and component-adjacent tests; use exact-money fixtures and property/invariant tests.
- Nest integration tests against a disposable PostgreSQL instance or isolated test database.
- Playwright for browser, PWA, localization/RTL, offline/reconnect, attachment, and critical family-finance flows.
- Postman collection/OpenAPI contract tests for API request/response behavior, auth, retries, and error semantics.
- Accessibility checks in browser tests plus manual keyboard/RTL review.
- Security/dependency scanning in CI after the package manager and hosting are approved.
- Backup restore drill against an isolated environment; backup creation alone is not evidence of restoreability.

Vitest and Playwright official documentation support the proposed unit and browser-test roles. Exact commands will be added to `TEST.md` when the repository has a package manifest.

## Deployment and operations

### Recommendation

Use Docker for local parity and CI. Deploy the Next.js web app, NestJS API, and worker as independently scalable processes from one repository. Use managed PostgreSQL, private S3-compatible object storage, HTTPS, secret-manager references, scheduled backups, and CI environments with preview/test data only.

The deployment provider remains open. Evaluate a conventional container host, a managed TypeScript platform, and a cloud-native setup against cost, Morocco/Europe region availability, backups, object storage, logs, and rollback support. Do not select a provider from this document alone.

Required operational controls:

- No production credentials in Git or test fixtures.
- Migration backups and forward-compatible migrations.
- Health/readiness endpoints that do not reveal secrets.
- Structured logs with request IDs and no sensitive financial payloads.
- Metrics for sync failures, job retries, auth failures, attachment errors, and database health.
- Tested restore procedure and an explicit owner.

## Main component flow

```text
Browser/PWA
  ├─ Next.js UI and localization/RTL
  ├─ Service worker: shell cache, push, opportunistic background sync
  └─ IndexedDB: local projection + mutation outbox
          │ HTTPS REST/OpenAPI
          ▼
NestJS API (modular monolith)
  ├─ Auth/session + authorization guards
  ├─ Ledger/account/budget/report domain services
  ├─ Sync/idempotency/conflict service
  ├─ Attachment authorization + presigned URL service
  └─ In-app notifications + audit service
          │ transactions / outbox
          ▼
PostgreSQL ─── worker jobs ─── Web Push/email providers
      │
      └── private S3-compatible object storage
```

## Official documentation consulted

- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction), [authentication](https://docs.nestjs.com/security/authentication), and [authorization](https://docs.nestjs.com/security/authorization)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM overview](https://orm.drizzle.team/docs/overview)
- [Prisma ORM documentation](https://docs.prisma.io/docs/orm)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) and [Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [AWS S3 presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [Vitest guide](https://vitest.dev/guide/) and [Playwright test running](https://playwright.dev/docs/running-tests)
- [OpenAI official Agents API overview](https://developers.openai.com/api/docs/guides/agents-api/overview), [multi-agent guide](https://developers.openai.com/api/docs/guides/responses-multi-agent), [skills](https://developers.openai.com/api/docs/guides/tools-skills), [Codex CLI guidance](https://developers.openai.com/api/docs/libraries/openai-cli), and [plugin hooks](https://developers.openai.com/plugins/build/plugins)

## Decisions still requiring approval

1. Confirm account-recovery/MFA policy and final browser session lifetime/revocation behavior; Keycloak OIDC is already selected.
2. Choose deployment provider/region, object storage, email provider, and malware scanning approach.
3. Confirm the minimum offline workflow boundary and conflict actions.
4. Confirm notification channels, report definitions, export layouts, and related provider-specific details.

The Product Owner has already approved the D-01 technical foundation, D-07 browser/device targets, and D-14 Atlas Ledger light/dark design-system direction. Exact compatible package versions still require compatibility verification before pinning.
