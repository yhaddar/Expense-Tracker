# Expense Tracker — Code Review

Review date: 2026-11-04 (Africa/Casablanca)

## A. Executive summary

The repository is a well-contained pnpm monorepo with a NestJS/Fastify API, Next.js frontend, Drizzle/PostgreSQL data layer, shared domain rules, OpenAPI/Postman artifacts, and disposable PostgreSQL/Keycloak infrastructure. The project has meaningful verified slices for identity provisioning, exact-money ledger operations, transfers, refunds, recurring generation, budgets, notifications, and local attachment workflows.

The review completed three categories of work:

- Hardened API input boundaries and error behavior.
- Added regression coverage for invalid financial inputs and safe error responses.
- Reworked the frontend across the application route surface and added a separate public `/welcome` marketing experience with a domain-oriented Atlas Ledger visual system.

The project is not production-ready. The largest remaining risks are incomplete browser authentication/session integration, unavailable real AWS/ClamAV verification, absent offline/PWA/synchronization runtime, unresolved report/export, notification-provider, backup, and hosting decisions, incomplete translated copy/RTL visual QA, and no CI/security scanning pipeline.

No production resources, credentials, customer data, deployments, commits, or pushes were used.

## B. Architecture review

### Existing architecture

- Root pnpm workspace with Node 24.11.1 project pins and pnpm 10.12.4.
- `apps/api`: NestJS modular monolith on Fastify. Modules cover OIDC, identity/wallet/account, ledger, refunds/recurring, budgets/notifications, and attachments.
- `apps/web`: Next.js App Router application with a shared shell, route-level pages, and an isolated public marketing route.
- `packages/db`: Drizzle schema and reviewed SQL migration artifacts for PostgreSQL.
- `packages/domain`: exact money/account/permission primitives.
- `packages/contracts`: OpenAPI and synchronization/conflict types.
- `packages/localization`: supported locale and direction primitives.
- Private S3-compatible object storage is the production attachment design; local filesystem storage is explicitly selectable for isolated development/test work.

### Findings and changes

| Finding                                                                 | Risk   | Change                                                                                                                                  |
| ----------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime request bodies were typed only at compile time                  | High   | Added service-layer validation for ledger, transfer, refund, recurring, budget, category, and account inputs where reviewed.            |
| Impossible calendar dates could pass the `YYYY-MM-DD` regex             | High   | Added UTC calendar-day validation and regression coverage.                                                                              |
| Malformed input frequently returned `409 Conflict`                      | Medium | Changed confirmed malformed-input paths to `400 Bad Request`; conflicts remain for idempotency, stale versions, and business conflicts. |
| Generic exceptions could expose inconsistent Nest error shapes          | High   | Added a global safe error filter with stable code/message/requestId/retryable fields and no internal detail disclosure.                 |
| Attachment object could remain after final metadata transaction failure | High   | Finalization now deletes the object on metadata/audit/idempotency failure before rethrowing.                                            |
| Frontend was a single dashboard with placeholder links                  | High   | Added navigable application routes, shared shell, stateful interactions, auth states, not-found behavior, and route smoke evidence.     |
| No public product/marketing surface existed                             | Medium | Added `/welcome`, keeping it separate from authenticated routes and limiting claims to verified capabilities.                           |

### Remaining architectural concerns

- The frontend has no authenticated API client/session bridge yet; demo state is selected only through `NEXT_PUBLIC_USE_DEMO_DATA=true` and must not be treated as persistence.
- The OpenAPI/Postman surface is still smaller than the complete controller surface and needs a deliberate contract expansion before frontend API wiring.
- API services still contain application validation and persistence orchestration together. This is acceptable for the current modular-monolith slice but should be separated into DTO/application/domain boundaries as the API grows.
- There is no worker/outbox process, service worker, IndexedDB mutation queue, or conflict-resolution runtime.
- No CI workflow, structured logging/metrics, or production deployment configuration exists.

## C. API review

### Endpoints reviewed

The review inspected the controllers and services behind:

- `GET /api/v1/health`
- `GET /api/v1/me`
- `POST|GET /api/v1/account` and `GET /api/v1/account/balance`
- `GET /api/v1/wallet/members`
- `GET|POST /api/v1/wallet/roles`
- `PATCH /api/v1/wallet/members/:memberId/role`
- `POST /api/v1/wallet/members/:memberId/revoke`
- `GET|POST /api/v1/categories`
- `GET|POST /api/v1/transactions`
- `PATCH /api/v1/transactions/:id`
- `POST /api/v1/transactions/:id/archive`
- `POST /api/v1/transfers`
- `POST /api/v1/transactions/:id/refunds`
- `POST /api/v1/recurring` and `POST /api/v1/recurring/generate`
- `GET|POST /api/v1/budgets` and `POST /api/v1/budgets/:id/evaluate`
- `GET /api/v1/notifications` and `PATCH /api/v1/notifications/:id/read`
- `POST /api/v1/transactions/:transactionId/attachments`
- `GET /api/v1/attachments/:attachmentId/download`

### Contract and validation findings

- OIDC guard validation is server-side and fail-closed using issuer, audience, JWKS, and a required subject.
- Shared Wallet membership and permission checks are server-side in the identity and feature services.
- Ledger values use integer minor units/BigInt paths and retain currency/rate snapshots.
- Idempotency is used for transaction, transfer, refund, and attachment writes.
- Transfer writes create linked debit/credit legs atomically and are excluded from ordinary income/expense sign semantics.
- Attachment validation detects JPG/PNG/PDF from bytes, enforces 10 MB, scans before storage, and permits downloads only for clean authorized records.
- The OpenAPI error schema already described `code`, `message`, `requestId`, and `retryable`; the new global filter makes that behavior real for API requests.

### Bugs fixed

1. `validateTransactionInput` now validates transaction type, positive minor units, uppercase currency, positive decimal exchange rate, valid Morocco UTC date, allowed payment method, note length, rate timestamp, and rate-source length.
2. Transfer targets are checked for UUID shape before database work.
3. Refunds validate positive amounts and valid dates.
4. Recurring templates validate the shared transaction fields and daily/weekly/monthly frequency.
5. Budget and account malformed input paths use `BadRequestException` instead of conflict semantics.
6. `ApiExceptionFilter` generates a request ID, returns a stable safe envelope, and suppresses internal exception details for 5xx responses.
7. Clean attachment finalization removes the stored object if its final database transaction fails.

### Remaining API issues

- DTO decorators or a schema-validation library are not installed; validation is currently explicit in services rather than generated from DTO schemas.
- Controllers still accept structural TypeScript interfaces instead of reusable runtime DTOs.
- Pagination, filtering, and sorting are not implemented on the API transaction/notification list endpoints; the current frontend filters only its local demo collection.
- The complete controller surface is not represented in the OpenAPI/Postman artifacts.
- Browser session creation/revocation is not implemented; current protected proof uses disposable OIDC service-token validation.
- Error-envelope behavior was unit-tested but not re-run through a live authenticated API after this change.

## D. Security review

### Controls present

- OIDC JWT verification checks issuer, audience, JWKS signature, and subject.
- Protected controllers use the OIDC guard.
- Wallet membership and permissions are checked server-side.
- Exact financial arithmetic avoids binary floating-point amounts.
- Idempotency, optimistic versions, SQL constraints, audit events, and transactional linked transfer writes protect financial consistency.
- Attachments use byte signatures, size limits, scanner-before-storage, clean-only downloads, private S3 configuration, local path traversal protection, and seven-year post-archive retention logic.
- The project examples use placeholders and `.gitignore` excludes environment files.
- The new error filter prevents stack/database detail from being returned to callers.
- The auth UI no longer collects local passwords or displays fake success. A standards-based PKCE transaction helper validates callback state and stores only transient verifier/state data in `sessionStorage`; no token is stored there.

### Unverified or incomplete controls

- No live AWS S3 IAM, bucket policy, encryption, network failure, or deletion drill.
- No live ClamAV daemon verification after the new application changes.
- No browser login/callback/session-revocation proof. The real flow is blocked by missing disposable Keycloak browser-client configuration; the API audience is intentionally not reused as a browser client ID.
- No dependency/security scan or CI gate.
- No production backup/isolated restore drill.
- No formal rate limiting, request tracing, or structured operational logging.
- No browser-based accessibility, contrast, or RTL matrix proof.

## E. Frontend and design review

### Pages and routes reviewed

Implemented and smoke-checked routes include:

- `/` overview
- `/transactions`, `/transactions/new`, `/transactions/[id]`, `/transactions/[id]/edit`
- `/budgets`, `/budgets/new`, `/budgets/[id]/edit`
- `/reports`
- `/notifications`
- `/wallet`
- `/profile`
- `/settings`
- `/login`, `/register`, `/forgot-password`
- `/welcome` public marketing page
- Next.js not-found route

### UX and interaction changes

- Replaced placeholder `href="#"` navigation with route-aware Next.js links and active states.
- Added mobile drawer navigation with scrim and close controls.
- Added table, badge, card, form, empty, error, success, notification, and destructive-action patterns.
- Added search, type filtering, sorting, form validation, local demo writes, notification read actions, theme selection, language/direction switching, and explicit API/demo status messaging.
- Added keyboard-visible focus states, labels, semantic tables, status roles, and reduced-motion handling.
- Financial display uses MAD formatting from integer minor units; transfer rows remain distinct from income/expense semantics.

### Visual identity

The implemented Atlas Ledger system uses a trustworthy ink/blue foundation, saffron attention accents, mint positive activity, coral expense/error semantics, and violet refund/automation support.

| Token      | Light     | Dark      | Use                   |
| ---------- | --------- | --------- | --------------------- |
| Ink        | `#18222D` | `#F5F7F8` | Primary text          |
| Canvas     | `#F3F6F8` | `#11171D` | Page background       |
| Surface    | `#FFFFFF` | `#1A222A` | Cards/panels          |
| Accent     | `#BF5B3F` | `#BF5B3F` | Primary action        |
| Focus/info | `#2E5B73` | `#86B8D1` | Links and information |
| Income     | `#2E806A` | `#64C5A6` | Income/success        |
| Expense    | `#C65B50` | `#F08A7E` | Expense/error         |
| Transfer   | `#2E5B73` | `#86B8D1` | Account movement      |
| Refund     | `#7562A8` | `#B8A8F0` | Refund/automation     |
| Warning    | `#B7791F` | `#F0B95C` | Budget attention      |
| Border     | `#DCE3E8` | `#33404A` | Separators            |

Typography currently uses Arial, matching the existing implementation. Inter/Noto Sans Arabic loading, full translated copy, and formal contrast review are still pending. Responsive CSS covers mobile drawer behavior and 480/800/900px layout transitions, but the approved browser/device matrix has not been executed.

## F. Marketing experience

`/welcome` is a separate public-facing page with:

- Clear household-finance value proposition.
- Product preview card showing balance and budget context.
- Feature positioning for ledger clarity, budgets, and privacy boundaries.
- Security messaging limited to implemented or explicitly bounded controls.
- Sign-in/create-account calls to action.
- Responsive layout and footer.

It deliberately contains no invented testimonials, customer counts, ratings, certifications, or live-integration claims. Authentication and account creation remain boundary screens until the approved OIDC/session flow is connected.

## G. Testing evidence

Commands executed during this review:

| Command                                                                            | Result                                                                | Evidence / limitation                                                                                         |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npx --yes prettier@3.6.2 --write 'apps/api/src/**/*.ts'`                          | PASS                                                                  | API sources formatted.                                                                                        |
| `npx --yes pnpm@10.12.4 --filter @expense-tracker/api test`                        | PASS                                                                  | 8 files, 19 tests, including validation and error-filter tests.                                               |
| `npx --yes pnpm@10.12.4 --filter @expense-tracker/api typecheck`                   | PASS                                                                  | Strict API TypeScript check.                                                                                  |
| `npx --yes pnpm@10.12.4 --filter @expense-tracker/api build`                       | PASS                                                                  | API production TypeScript build.                                                                              |
| `npx --yes prettier@3.6.2 --write 'apps/web/app/**/*.ts*' 'apps/web/app/**/*.css'` | PASS                                                                  | Frontend sources formatted.                                                                                   |
| `npx --yes pnpm@10.12.4 --filter @expense-tracker/web test`                        | PASS                                                                  | 3 files, 7 tests, including callback-state validation.                                                       |
| `npx --yes pnpm@10.12.4 --filter @expense-tracker/web typecheck`                   | PASS                                                                  | Strict web TypeScript check.                                                                                  |
| `npx --yes pnpm@10.12.4 --filter @expense-tracker/web build`                       | PASS with an Autoprefixer warning before the final `flex-end` cleanup | 17 route entries including `/welcome`; Node 26 engine warning remains.                                        |
| `npx --yes pnpm@10.12.4 typecheck`                                                 | PASS                                                                  | All workspace packages.                                                                                       |
| `npx --yes pnpm@10.12.4 test`                                                      | PASS                                                                  | All workspace tests; package placeholder tests remain placeholders.                                           |
| `npx --yes pnpm@10.12.4 build`                                                     | PASS                                                                  | All workspace builds.                                                                                         |
| `npx --yes pnpm@10.12.4 format:check`                                              | PASS                                                                  | Repository formatting clean after changes.                                                                    |
| `npx --yes pnpm@10.12.4 contract:check`                                            | PASS                                                                  | Local collection structure: 7 requests.                                                                       |
| Disposable dev server + Node `fetch` route smoke                                   | PASS                                                                  | Application routes returned 200; unknown route returned 404. Browser console/visual evidence was unavailable. |
| `git diff --check`                                                                 | PASS                                                                  | No whitespace errors in tracked diffs; untracked-file whitespace was checked separately.                      |

The repository was checked under Node `26.8.1`, while the project pins Node `24.11.1`; engine warnings mean Node 24 compatibility is not proven here.

No Playwright/browser E2E runner is installed in the repository, and the browser automation host was unavailable. No AWS, ClamAV daemon, production database, production credentials, or live notification provider was used.

## H. Remaining issues

### Critical

- None newly introduced by this review. Production release remains blocked by the combined incomplete security, identity, operations, and decision-gated scope.

### High

- Browser authentication/session lifecycle and revocation are incomplete and blocked by missing browser client configuration.
- Real AWS S3/IAM/bucket policy/encryption and live ClamAV verification are pending.
- Offline/PWA/synchronization/conflict runtime is not implemented.
- Backup/restore policy and isolated restore drill are not implemented.

### Medium

- OpenAPI/Postman contract does not cover every controller endpoint.
- API list endpoints lack pagination/filtering/sorting.
- Frontend has no authenticated API client/session bridge; populated flows are demo-only until that boundary is completed.
- Full translated EN/FR/AR copy, RTL visual QA, accessibility matrix, and contrast review are incomplete.
- Reports/exports and external notification delivery remain decision-gated.
- CI, dependency scanning, rate limiting, structured logs, and metrics are absent.

### Low

- API validation is explicit service code rather than reusable runtime DTO schemas.
- Typography uses Arial pending approved font licensing/rendering verification.
- Some UI actions intentionally explain their API/decision boundary through browser feedback rather than performing persistence.

### Blocked

- Report/export behavior and layouts: D-10.
- External notification providers/channels: D-08.
- Offline workflow boundary and conflict actions: D-05/D-06.
- Backup frequency/retention/owner/interface: D-11.
- Hosting/region/deployment provider: D-12.

### External verification pending

- Node 24 runtime.
- Browser/device matrix: latest two Chrome/Edge/Firefox/Safari, iOS Safari, Android Chrome.
- AWS S3 and live ClamAV.
- Browser OIDC/session/revocation and full authorization-negative matrix.
- Production backup restore drill.

### Authentication-specific blocker

The existing `infra/keycloak/README.md` requires an operator to create a
browser client, but the repository provides no client ID, redirect URI, logout
redirect, realm export, or configured client access mode. The current AuthPage
therefore refuses to simulate success and reports the missing configuration.
The PKCE helper and callback-state test are independent safety work; they do
not prove a live Keycloak flow.

## I. Final assessment

The project has a verified technical foundation and substantially improved frontend/API quality. The API now rejects several classes of malformed financial input predictably, returns safer errors, and cleans up attachment objects when finalization fails. The frontend is no longer only an overview shell: it has a complete navigable route surface, coherent shared styling, local interactions, a public marketing experience, light/dark behavior, and explicit demo/API boundaries.

The project must still be classified as **partially complete** rather than production-ready. The remaining blockers are not cosmetic: identity/session lifecycle, live attachment infrastructure, offline synchronization, operational restore, complete API contract coverage, browser verification, and unresolved Product Owner decisions all affect release safety.
