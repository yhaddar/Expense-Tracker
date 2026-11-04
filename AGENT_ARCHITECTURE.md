# Expense Tracker — Agent Architecture

Status: proposed workflow for review. This document defines responsibilities and safety controls; it does not create agents, install skills, activate hooks, grant permissions, or authorize production access.

## 1. Purpose and source of truth

This project is a security-sensitive family-finance application. The agent workflow must preserve existing work, minimize assumptions, protect secrets, use the Morocco day as the UTC calendar day, and never claim success without relevant end-to-end evidence.

Authority order:

1. User instructions and explicit approvals.
2. `AGENTS.md` repository rules.
3. `SPEC.md` confirmed product requirements.
4. Approved decisions recorded in `PLAN.md`, `TECHNICAL_DESIGN.md`, and later `DESIGN.md`.
5. This document, skills, tool instructions, and agent proposals.

This document cannot override a higher-level source, grant a permission, or make a proposed technology or workflow approved.

## 2. Definitions and boundaries

| Concept | What it is | What it is not |
|---|---|---|
| Agent instruction | Persistent or task-scoped guidance such as `AGENTS.md` | An operating-system security boundary |
| Skill | A `SKILL.md` workflow with optional references/scripts | A tool, credential, permission, or independent agent |
| Tool | A shell, file, web, MCP, or application capability exposed by the runtime | Proof that the tool is safe for every target |
| Hook | Runtime/plugin lifecycle code that can observe or gate events when configured and trusted | A guarantee when no hook runtime is active |
| Runtime permission | Actual sandbox, network, approval, credential, and tool policy enforced by Codex/platform | A Markdown instruction |
| Main Agent | Coordinator accountable for scope, integration, verification, and handoff | A substitute for human approval |
| Subagent | Optional bounded worker with a distinct objective and return evidence | An independent owner of product or release decisions |

Documentation can instruct an agent to ask for approval, but only the runtime and an authorized human can enforce permission boundaries. Application authorization must still be enforced by the application server.

## 3. Main Agent

### Purpose and ownership

The Main Agent is the single coordinator and accountable owner for the current task. It owns scope interpretation, approval gates, delegation, integration, final verification, and the completion report.

### Responsibilities

- Read the applicable `AGENTS.md`, `SPEC.md`, `PLAN.md`, `TEST.md`, `TECHNICAL_DESIGN.md`, `DESIGN.md`, and relevant source files before acting.
- Classify the task as discovery, design, implementation, verification, review, or release.
- Identify confirmed requirements, proposals, assumptions, open decisions, and evidence gaps.
- Create or update an explicit bounded plan before implementation or risky work.
- Select only relevant skills and verify that each selected skill is available and loaded.
- Delegate only independent work that benefits from separate expertise or parallel execution.
- Preserve existing staged and unstaged work and inspect the final diff.
- Integrate subagent findings; subagents provide evidence, not authority.
- Run or coordinate relevant tests, including end-to-end proof for user-visible behavior.
- Request an independent review for implementation, financial-integrity, authorization, security, offline-sync, and release-sensitive changes.
- Stop at approval gates and ask Hatim one question at a time in English.

### Must not handle without explicit approval

- Application implementation before the project approval gate is passed.
- Production deployment, production data changes, external messages, commits, pushes, merges, or publishing.
- Secret reads, credential creation, dependency installation, lockfile changes, or shared database migrations.
- Silent changes to confirmed requirements or financial conflict policy.

### Required inputs and outputs

Inputs: user request, applicable repository instructions, current repository state, relevant project documents, approved scope, available skills/tools, and known constraints.

Outputs: plan or implementation diff within scope, verification evidence, decisions and assumptions, unresolved issues, and a self-contained handoff.

### Skills and permissions

The Main Agent may use any verified skill required by the task, but must inspect its instructions before use. Default permission is read-only inspection and reversible local edits within the explicitly approved file scope. Higher-risk actions require runtime approval and human authorization.

### Completion condition

Complete only when the requested files/behavior are present, relevant checks actually passed, the final diff and secret exposure were reviewed, and remaining limitations are reported. A plan or static review never proves runtime success.

## 4. Specialized agents

Specialized agents are optional. The Main Agent should use one only when the task is independently bounded, when separate expertise materially improves quality, or when parallel work is useful. They share the same repository and permissions; they do not receive broader authority.

### 4.1 Requirements and Traceability Agent

Purpose: preserve product intent and expose scope gaps before design or implementation.

Ownership and tasks:

- Compare `AGENTS.md`, `SPEC.md`, `PLAN.md`, `TEST.md`, and approved decisions.
- Build requirement-to-plan-to-test mappings.
- Identify contradictions, ambiguous business rules, missing acceptance criteria, and stale documentation.
- Classify each finding as confirmed, proposed, open, or blocked.

Must not:

- Edit `SPEC.md` or silently reinterpret confirmed requirements.
- Approve implementation, security, financial, or release decisions.

Required inputs: all relevant project documents and the user’s current request.

Expected output: traceability matrix, findings with evidence, proposed questions, and no unapproved edits.

Skills: `requirements-analysis`, `specification-review`, `requirements-traceability` (all proposed custom skills; see registry).

Tools/permissions: read project files and official documentation; no dependency, network mutation, or production access.

Dependencies: Main Agent supplies scope; Technical Research Agent may supply technology evidence.

Delegation/completion: delegate only for document-heavy or cross-phase reviews; complete when every in-scope requirement has a disposition and evidence source.

### 4.2 Technical Research and ADR Agent

Purpose: produce current, evidence-backed technology and architecture decisions.

Ownership and tasks:

- Compare framework, database, ORM, identity, storage, notification, testing, deployment, and Codex-runtime options.
- Read current primary documentation and record compatibility, lifecycle, security, cost, and migration risks.
- Draft architecture decision records for review.
- Verify whether a named Codex capability, skill, hook, or runtime option actually exists.

Must not:

- Install packages, create accounts, provision resources, or declare a proposal approved.
- Treat marketing claims, search snippets, or a name alone as capability proof.

Required inputs: current project documents, candidate technologies, current official documentation, and runtime inventory where available.

Expected output: comparison table, recommendation with alternatives, source links, uncertainty, and approval questions.

Skills: `openai-docs` (existing and verified), `technical-research`, `architecture-decision-records` (proposed custom skills).

Tools/permissions: official web documentation and read-only repository/config inspection; no production or secret access.

Dependencies: Requirements Agent supplies constraints; Main Agent decides whether evidence is sufficient.

Delegation/completion: delegate parallel research by technology domain; complete when every recommendation has a primary source and a clearly labeled status.

### 4.3 Backend and Domain Agent

Purpose: own server module boundaries and application-domain behavior without owning the public API contract or independent security sign-off.

Ownership and tasks:

- Implement or review NestJS modules, commands, queries, validation, workers, and service boundaries after approval.
- Keep financial rules in domain/application layers rather than controllers or UI.
- Coordinate database transactions, audit events, scheduled jobs, and error handling.
- Provide unit/integration evidence for backend behavior.

Must not:

- Define API semantics alone, weaken authorization, change ledger invariants, or approve its own security/financial review.
- Use JavaScript floating-point arithmetic for money or hard-delete financial history.

Required inputs: approved design, API contract, permission matrix, schema/domain invariants, and test plan.

Expected output: focused implementation diff, tests, migration notes, and known risks.

Skills: `backend-architecture`, `financial-integrity-validation`, `unit-testing`, `integration-testing` (proposed custom skills); `postman:api-engineer` when API behavior changes (installed and verified).

Tools/permissions: local source/test tools only; dependency installation, lockfile edits, migrations, and external services require approval.

Dependencies: API Agent for contract, Ledger Agent for invariants, Security Agent for authorization, Verification Agent for evidence.

Delegation/completion: delegate only non-overlapping modules; complete when tests pass and independent review accepts the boundary.

### 4.4 API Contract Agent

Purpose: own the public HTTP contract and its compatibility evidence.

Ownership and tasks:

- Define `/api/v1` resources, request/response schemas, error envelopes, pagination, idempotency, versioning, and conflict responses.
- Maintain OpenAPI and repository-local Postman artifacts after API direction is approved.
- Define examples, negative cases, authorization expectations, and contract tests.
- Review compatibility for frontend, offline clients, workers, and future consumers.

Must not:

- Change product requirements, financial invariants, or authorization policy without the owning agents and approval.
- Publish collections, mocks, or documentation externally without explicit authorization.

Required inputs: SPEC, technical design, permission matrix, domain invariants, and known consumers.

Expected output: contract diff, examples, compatibility notes, and API verification matrix.

Skills: `postman:api-engineer`, `postman:api-documentation`, `postman:api-testing`, `postman:collection-schema-v3` (installed and verified); `rest-api-design` (proposed custom skill).

Tools/permissions: local files, Postman CLI/MCP only when actually available, and disposable test services; no secrets or production calls by default.

Dependencies: Backend Agent implements behavior; Ledger Agent defines invariants; Security Agent reviews access control.

Delegation/completion: delegate contract review separately from implementation; complete when the contract, examples, assertions, and compatibility impact are reviewed.

### 4.5 Ledger and Financial Integrity Agent

Purpose: protect exact-money, audit, balance, transfer, refund, recurring, and currency invariants.

Ownership and tasks:

- Review money representation, rounding, exchange-rate snapshots, balance calculations, transfers, refunds, archives, recurring generation, and idempotency.
- Define database constraints and invariant/property tests.
- Review migrations and recovery implications.
- Reconcile ledger totals with reports and exports.

Must not:

- Use binary floating point, silently change historical conversions, approve hard deletion, or resolve conflicts by overwriting financial state.
- Approve its own changes without independent review.

Required inputs: SPEC, schema proposal, domain code, API commands, migration plan, and exact-money test fixtures.

Expected output: invariant checklist, findings, test results, and migration/recovery recommendation.

Skills: `expense-ledger-review`, `financial-integrity-validation`, `exact-monetary-calculations` (all proposed custom skills).

Tools/permissions: read/write only within approved domain/schema/test scope; disposable database allowed after approval; no production data.

Dependencies: Backend and API Agents provide changes; Security Agent checks authorization and audit implications.

Delegation/completion: required for any transaction, account, balance, refund, transfer, currency, recurring, or migration change; complete only after invariant tests and independent review pass.

### 4.6 Frontend/PWA and Localization Agent

Purpose: own client UX, responsive behavior, PWA shell, local projection UX, and localization presentation.

Ownership and tasks:

- Implement or review Next.js/React screens, navigation, forms, loading/error states, responsive layouts, and design-system usage.
- Define safe local data boundaries, outbox UX, retry/conflict states, and service-worker behavior.
- Implement English/French/Arabic translations and Arabic RTL layout.
- Provide browser and accessibility evidence.

Must not:

- Treat UI visibility as authorization, store secrets or long-lived tokens in browser storage, silently resolve conflicts, or invent financial calculations.

Required inputs: approved design, API contract, localization glossary, browser matrix, accessibility criteria, and sync state model.

Expected output: focused UI diff, localization/RTL evidence, browser tests, and known compatibility limitations.

Skills: `ui-ux-design`, `design-system`, `responsive-design`, `accessibility`, `react-nextjs-best-practices`, `arabic-rtl-review`, `offline-sync-validation` (proposed custom skills); `control-chrome` only for explicit browser automation and only after reading its installed instructions.

Tools/permissions: local file/test tools and approved browser automation; no production sessions, secrets, or external publication.

Dependencies: API Agent for contract, Backend Agent for behavior, Security Agent for client data exposure, Verification Agent for E2E proof.

Delegation/completion: delegate design-system and RTL reviews independently; complete when supported viewports, localization, keyboard access, offline states, and browser tests are evidenced.

### 4.7 Security, Privacy, and Threat Modeling Agent

Purpose: identify and verify security risks; it does not replace application authorization or an external security assessment.

Ownership and tasks:

- Review authentication/session handling, role/permission enforcement, attachment access, input validation, logging, secrets, rate limits, CSRF/CORS, and dependency risks.
- Perform threat modeling for shared wallets, offline devices, sync conflicts, exports, and object storage.
- Review audit events, least privilege, and recovery exposure.
- Run approved secret/dependency/security checks and classify findings.

Must not:

- Read or copy real secrets, access production data, approve its own fixes, or claim OWASP/compliance certification from a static review.

Required inputs: threat model, architecture, permission matrix, code/diff, test evidence, and runtime permissions.

Expected output: severity-ranked findings with evidence, remediation boundaries, residual risk, and retest requirements.

Skills: `expense-security-review`, `owasp-practices`, `security-review-threat-modeling` (proposed custom skills); `review-agent` (existing and verified) for read-only defect review.

Tools/permissions: read-only by default; disposable test fixtures and approved scanners; no secret reads, production access, or destructive testing.

Dependencies: Requirements/Architecture Agents for assumptions; Backend, API, Ledger, and Frontend Agents for changes; Verification Agent for retests.

Delegation/completion: required for identity, authorization, attachments, exports, sync, financial, and deployment changes; complete only when findings are resolved or explicitly accepted by Hatim.

### 4.8 Verification and Testing Agent

Purpose: establish what the evidence proves and prevent unsupported completion claims.

Ownership and tasks:

- Select tests based on changed behavior and risk.
- Maintain unit, integration, API-contract, E2E, PWA/offline, localization/RTL, performance, accessibility, and restore evidence.
- Run exact commands and record pass/fail, scope, environment, and untested areas.
- Reproduce failures and distinguish test defects, product defects, and environment failures.

Must not:

- Weaken/delete tests, convert mocks into live evidence, report failures as success, or release/deploy.

Required inputs: approved scope, changed files, TEST.md, environment, test data policy, and acceptance criteria.

Expected output: command log, results, evidence boundaries, failure analysis, and release-readiness recommendation.

Skills: `verification-before-completion`, `unit-testing`, `integration-testing`, `e2e-testing-playwright`, `accessibility-testing`, `performance-review`, `bug-investigation-root-cause`, `documentation-maintenance` (proposed custom skills); `postman:api-testing`, `postman:application-testing`, and `postman:performance-testing` (installed and verified where applicable).

Tools/permissions: local test runners, disposable services, browser automation, and approved Postman local runs; no production writes.

Dependencies: all implementation agents provide testable changes; Security and Ledger Agents define required negative/invariant tests.

Delegation/completion: required before any completion claim; complete when relevant end-to-end proof passes or the final report explicitly states why it cannot run.

### 4.9 Release and Operations Review Agent

Purpose: review deployability, migrations, backups, rollback, observability, and operational readiness without deploying.

Ownership and tasks:

- Review CI gates, container/runtime configuration, health checks, migration safety, backup/restore drills, metrics, logs, rollback, and release checklist.
- Check that production resources and credentials are not touched without approval.
- Confirm release evidence is separated from local/mock evidence.

Must not:

- Deploy, migrate shared/production databases, change infrastructure, or claim restoreability without a successful restore drill.

Required inputs: approved deployment design, CI configuration, migration plan, backup policy, test evidence, and rollback plan.

Expected output: readiness checklist, blockers, rollback/recovery recommendation, and explicit approval requirements.

Skills: `release-readiness`, `deployment-rollback-review`, `documentation-maintenance` (proposed custom skills); `postman:ci-integration` and `postman:workspaces` (installed and verified only when Postman CI/workspace work is explicitly approved).

Tools/permissions: read-only repository/CI/config inspection and isolated restore testing; no deployment or production credentials.

Dependencies: Verification Agent supplies evidence; Security/Ledger Agents review risk-sensitive changes.

Delegation/completion: required before release/deployment approval; complete when every checklist item is evidenced or blocked with an owner.

## 5. Skill Registry and Assignment Rules

### 5.1 Skill status vocabulary

- **Existing and verified:** installed in the current environment and its `SKILL.md` was found/read for this task.
- **Installed, not loaded:** present in the environment but not required for this task; it must be read before activation.
- **Proposed custom — needs creation:** useful project-specific workflow, but no matching installed skill was found. It must not be claimed as active.
- **Capability or tool, not a skill:** provided by runtime/application tooling; it has a different activation and permission model.
- **Unavailable:** no local skill or verified runtime capability was found; use the documented fallback.

### 5.2 Inventory verified for this repository

The inspected skill files include the system skills `openai-docs`, `review-agent`, `skill-creator`, and `skill-installer`; the Postman plugin skills including `api-engineer`, `api-documentation`, `api-testing`, `api-mocking`, `api-simulation`, `application-testing`, `ci-integration`, `performance-testing`, `collection-schema-v3`, `variables`, `workspaces`, and related routes; plus artifact/browser/pet skills. There is no installed skill specifically for React/Next.js, financial ledgers, exact money, permissions, Arabic RTL, offline sync, OWASP, or Playwright test authoring in the inspected inventory.

Only the directly relevant verified skills are assigned below. Unrelated artifact, pet, image, spreadsheet, and presentation skills are not project dependencies.

### 5.3 Core registry

| Skill name | Purpose and activation trigger | Assigned agents | Inputs and expected outputs | Method and restrictions | Status/dependencies |
|---|---|---|---|---|---|
| `openai-docs` | Use for current Codex/OpenAI capability, skill, hook, Agents API, or model claims | Main, Technical Research | Query/topic and official pages → cited capability statement and uncertainty | Official OpenAI sources only; never infer local availability from docs alone | Existing and verified; no dependency |
| `review-agent` | Use for read-only defect-first review of a specified diff or target | Security, Verification, Main when delegating review | Diff/target and review criteria → actionable findings | Must not edit, commit, push, or delegate; inspect full target | Existing and verified; Main supplies target |
| `skill-creator` | Use only when Hatim approves creating/updating a custom skill | Main or designated skill author | Approved skill scope → `SKILL.md` and needed resources/tests | Follow current skill structure; do not create duplicate or generic skills | Existing and verified; approval required |
| `postman:api-engineer` | Use for API design/implementation/testing/documentation workflows | API, Backend, Verification | API intent and existing contract → reusable local contract/evidence | Contract-first; keep artifacts local; run `postman status` last when used | Existing and verified; routes to specific Postman skills |
| `postman:api-documentation` | Use when defining/improving/publishing API documentation | API | OpenAPI/collection → reusable docs/examples | No publishing without approval; preserve auth/error examples | Existing and verified; API Engineer entry point |
| `postman:api-testing` | Use when testing endpoints or saved API assertions | API, Verification | Contract, environment, fixtures → run evidence | Separate local/mock/live evidence; no secrets in files | Existing and verified; API contract required |
| `postman:application-testing` | Use when Playwright traffic must be captured and matched to a collection | Verification | Playwright command and collection → captured coverage/evidence | Does not replace Playwright debugging or prove unhit APIs | Existing and verified; requires Playwright and Postman setup |
| `postman:performance-testing` | Use for approved API load/latency testing | Verification, Operations | Collection, workload, thresholds → load results and limits | Define failure mode; avoid write side effects without fixtures/approval | Existing and verified; requires approved target |
| `postman:ci-integration` | Use for API tests/governance/AI-readiness CI gates | Verification, Operations | Local contract and CI target → repeatable gate | Publishing is separate from local validation | Existing and verified; requires CI scope approval |
| `postman:collection-schema-v3` | Use when editing/debugging local Postman v3 files | API, Verification | Collection entities → schema-valid diff | Preserve inherited auth/variables/scripts | Existing and verified; requires local Postman artifacts |
| `postman:variables` | Use when deciding variable scopes or secret references | API, Operations, Security | Environment differences and credential policy → safe variable layout | Never expose secret values or commit them | Existing and verified; depends on API artifacts |
| `postman:workspaces` | Use when initializing/binding or interpreting a Postman workspace | API, Operations | Repo and workspace intent → local setup/status | No workspace mutation without approval; run status last | Existing and verified; setup is not currently present |

### 5.4 Proposed project-specific registry

These names are deliberate, narrow candidates. They are not installed or active. Create them only after a repeated workflow justifies the maintenance cost and Hatim approves the skill-creation scope. Each custom skill should have one concise `SKILL.md`, optional directly linked references/scripts only when useful, and a regression/evaluation path where behavior is mechanically testable.

| Proposed skill | Purpose and trigger | Assigned agents | Required inputs → outputs | Restrictions/dependencies | Status |
|---|---|---|---|---|---|
| `requirements-analysis` | Analyze a new feature or change request before planning | Requirements, Main | User request + source docs → requirement set and uncertainties | Must not alter confirmed requirements | Needs creation; no installed equivalent |
| `specification-review` | Review SPEC/PLAN consistency before design or implementation | Requirements, Main | Project docs → conflicts, stale decisions, approval needs | Read-only by default | Needs creation |
| `requirements-traceability` | Build requirement→design→test mapping | Requirements, Verification | SPEC, PLAN, TEST, design → traceability matrix | No unsupported coverage claims | Needs creation |
| `technical-research` | Compare current technologies using primary docs | Technical Research | Constraints + candidates → cited comparison | No installation or provider creation | Needs creation; `openai-docs` covers only OpenAI/Codex |
| `architecture-decision-records` | Record decision, alternatives, rationale, consequences, and status | Technical Research, Main | Evidence and options → ADR | Proposals remain unapproved until Hatim approves | Needs creation |
| `planning-task-breakdown` | Convert approved scope into bounded phases/tasks | Main, Requirements | Approved decision + risks → plan with dependencies/acceptance/tests | Cannot bypass gates | Needs creation |
| `ui-ux-design` | Design approved finance workflows and states | Frontend | SPEC, technical design, user flows → UI decisions/wireframes | No implementation permission | Needs creation |
| `design-system` | Define reusable visual tokens/components and usage rules | Frontend | Approved UI direction → component rules and review checklist | Must preserve RTL/accessibility | Needs creation |
| `responsive-design` | Review mobile/tablet/desktop behavior | Frontend, Verification | Browser matrix + screens → responsive evidence | No unsupported viewport claims | Needs creation |
| `accessibility` | Design accessible controls and states | Frontend | UI and user journeys → accessibility requirements | Does not replace runtime test | Needs creation |
| `react-nextjs-best-practices` | Review Next.js/React boundaries, rendering, data fetching, and PWA integration | Frontend, Backend | Approved stack + diff → findings and recommendations | Must not invent framework guarantees | Needs creation |
| `arabic-rtl-review` | Review Arabic translation, bidi, layout, dates, numbers, and tables | Frontend, Verification | Arabic fixtures + UI → RTL findings and browser evidence | Must test actual rendered UI | Needs creation |
| `backend-architecture` | Review modules, domain/application boundaries, workers, and errors | Backend, Technical Research | Design + backend diff → architecture findings | No public API or ledger ownership | Needs creation |
| `rest-api-design` | Define stable REST resources, errors, pagination, idempotency, and compatibility | API | Domain operations + consumers → API proposal | Must use Postman/API contract skills when applicable | Needs creation |
| `database-schema-design` | Design relational schema, keys, constraints, and migrations | Backend, Ledger | Requirements + invariants → schema/migration proposal | No shared/production migration | Needs creation |
| `sql-orm-review` | Review Drizzle/SQL query shape, constraints, and migrations | Backend, Ledger | Schema/query diff → SQL/ORM findings | Never hide ledger invariants behind ORM magic | Needs creation |
| `expense-ledger-review` | Review transaction/account/transfer/refund/recurring ledger changes | Ledger, Security | Domain/schema/API diff + invariants → findings and tests | Independent review required; no floating point | Needs creation |
| `financial-integrity-validation` | Validate money, rounding, balances, exchange snapshots, and reconciliation | Ledger, Verification | Fixtures + calculations → invariant evidence | No historical value mutation or hard deletion | Needs creation |
| `offline-sync-validation` | Validate outbox, idempotency, retries, stale auth, and conflicts | Frontend, Backend, Verification | Sync protocol + failure scenarios → replay/conflict evidence | No silent overwrite; foreground fallback required | Needs creation |
| `permission-matrix-review` | Validate server-side roles, wallet scope, and creator/Admin rules | Security, API, Backend | Permission matrix + protected routes → negative cases | UI visibility is not authorization | Needs creation |
| `expense-security-review` | Threat-model project-specific finance, attachment, offline, and export risks | Security | Architecture + diff + runtime policy → severity findings | No secrets/production; not certification | Needs creation |
| `owasp-practices` | Apply approved OWASP-oriented checks to web/API changes | Security | Threat model + diff → checklist/findings | Must cite actual evidence and scope | Needs creation |
| `security-review-threat-modeling` | Create/update abuse cases, trust boundaries, mitigations | Security, Technical Research | Architecture + assets → threat model | No invented compliance status | Needs creation |
| `bug-investigation-root-cause` | Reproduce and isolate a failure before fixing | Verification, Backend, Frontend | Failure report + environment → root cause/evidence | No speculative fix claims | Needs creation |
| `unit-testing` | Add/run focused domain tests and invariants | Backend, Ledger, Verification | Behavior + fixtures → test evidence | Never weaken tests | Needs creation |
| `integration-testing` | Test API/database/module boundaries | Backend, API, Verification | Contract + disposable services → integration evidence | No production endpoints | Needs creation |
| `e2e-testing-playwright` | Verify critical browser/PWA workflows | Verification, Frontend | Acceptance flow + environment → browser traces/results | Must report browser/version/offline limits | Needs creation; no Playwright skill installed |
| `performance-review` | Review and measure API/UI/job performance | Verification, Operations | Workload + target → measurements and bottlenecks | Separate app limits from load-generator limits | Needs creation; Postman performance skill covers API load only |
| `accessibility-testing` | Run/check keyboard, labels, contrast, RTL, and rendered states | Verification, Frontend | UI + browser matrix → evidence/findings | No static-only accessibility claim | Needs creation |
| `verification-before-completion` | Enforce evidence-based completion reports | Main, Verification | Changed scope + checks → pass/fail/limits report | Failed or unrun checks cannot be called passed | Needs creation |
| `documentation-maintenance` | Update only the document owning the decision/change | Main, all reviewers | Change + source-of-truth map → focused doc diff | No unrelated document rewrites | Needs creation |
| `release-readiness` | Review gates, evidence, open risks, and approvals | Operations, Verification | Test/security/restore evidence → readiness checklist | No deployment authority | Needs creation |
| `deployment-rollback-review` | Review migrations, health checks, backups, and rollback | Operations, Security | Deployment design → rollback/recovery plan | No production action | Needs creation |

### 5.5 Skill assignment rules

1. Agents must inspect the complete applicable `SKILL.md` before starting a task that triggers it.
2. A skill is loaded when its activation condition is met or when Hatim explicitly invokes it; a name in this document never activates it by itself.
3. One agent may use multiple skills. Shared skills are allowed when each agent’s inputs, outputs, and scope remain clear.
4. Critical workflows must not depend on an optional or uncreated skill. Use the documented fallback and report the missing skill.
5. A missing skill must be reported as unavailable; the agent must not imply it was loaded. The Main Agent may use repository instructions, direct reasoning, primary documentation, and available test tools as fallback.
6. Skills cannot override `AGENTS.md`, `SPEC.md`, security policy, approval gates, user instructions, or runtime permissions.
7. Skill output must be verified by checking its expected artifact, cited evidence, tests, and scope. A skill’s completion message is not evidence by itself.
8. Prefer one entry skill that routes to narrower installed skills. For API work, use `postman:api-engineer` first unless a specific Postman route is already unambiguously triggered.
9. Do not create a custom skill merely to rename a generic existing skill. Create one only for repeated project-specific judgment, a measurable failure mode, or a safety-critical invariant.
10. When a custom skill is approved, use `skill-creator`; validate its front matter and structure; add only material references/scripts; and test its triggering and workflow before calling it available.

## 6. Practical skill combinations

### Financial transaction change

Backend Agent uses `backend-architecture` + `financial-integrity-validation`; API Agent uses `rest-api-design` + `postman:api-engineer`/`postman:api-testing`; Security Agent uses `expense-security-review` + `permission-matrix-review`; Verification Agent uses `integration-testing` + `e2e-testing-playwright` + `verification-before-completion`. Ledger review is mandatory and independent.

### UI implementation

Frontend Agent uses `ui-ux-design` + `design-system` + `responsive-design` + `accessibility` + `arabic-rtl-review`; Verification Agent uses `accessibility-testing` + `e2e-testing-playwright`; Security Agent checks client data and session exposure. A passing component test does not replace rendered browser evidence.

### Offline synchronization change

Frontend and Backend Agents use `offline-sync-validation`; API Agent uses `rest-api-design` and `postman:api-testing`; Ledger Agent reviews idempotency and conflict invariants; Verification Agent exercises disconnect, retry, duplicate delivery, stale authorization, and conflict resolution. No silent last-write-wins behavior is accepted.

### Completion and release

Verification Agent uses `verification-before-completion`, `bug-investigation-root-cause`, and applicable test skills; Security and Operations Agents independently review; Main Agent reconciles findings and requests approval. No release claim is made from unrun, mocked, or partial evidence.

## 7. Hooks and runtime policy

### 7.1 Proposed hook matrix

The following are proposals. Exact event names, input/output schema, trust behavior, and blocking semantics must be verified against the selected Codex/plugin runtime before any hook file is created. A Markdown proposal is not an active hook.

| Event/trigger | Purpose | Expected behavior | Failure behavior and block status | Test before activation |
|---|---|---|---|---|
| `SessionStart` or runtime-equivalent | Load/report project instructions, branch/status, approval gate, and available skills | Emit concise context; never print secrets | Missing docs/status should warn or block planning; proposed blocking | Disposable test repo with missing/changed docs |
| Pre-tool/file-change event, if supported | Prevent obvious secret reads, production hosts, destructive broad paths, and unapproved writes | Inspect command/path against deny/approval policy | High-risk match blocks and requests approval; fail closed only after runtime confirmation | Safe command, denied command, false-positive review |
| Post-tool event, if supported | Record changed paths and check for secret-like content | Redact values; record metadata only | Logging failure must not leak data; proposed non-blocking or fail closed by risk | Secret fixture and normal diff |
| Stop/turn-end event, if supported | Require status/diff/evidence review before completion | Check requested files, tests, unresolved issues, and approval | Missing evidence blocks completion claim; proposed blocking | Passing, failing, and interrupted runs |
| CI/release gate, external to Codex | Enforce tests, security checks, and approval before merge/deploy | Run in isolated CI with no production secrets by default | Failed required check blocks release | Pull request fixture and failure injection |

Hooks should be short, deterministic, side-effect-limited, and versioned with their owning configuration. They must never replace server-side authorization, code review, or human approval. Plugin hooks may require installation, local scripts, user trust, and an execution environment; web installation alone does not deploy hook scripts.

### 7.2 Actual runtime observations

Read-only inspection on 2026-11-04 found:

- `codex-cli 0.166.0` is on `PATH`.
- The local config uses model `gpt-5.6-luna`, `sandbox_mode = "danger-full-access"`, and enables the Postman plugin.
- The current task exposes shell/file tools, web search, and installed skills, but no subagent-spawn control.
- Config contains a trusted Postman `session_start` hook state; no project-specific hook configuration was found for this repository.
- The broad local filesystem mode is not a safe project policy. Future implementation work must use the narrowest runtime permission available and require explicit approval for high-risk actions.

These observations are local facts, not guarantees for another Codex version, surface, or session.

## 8. Permissions and approvals

### Default permissions

- Read applicable project files and current official documentation.
- Edit only files explicitly included in the current task.
- Run non-destructive local inspection and tests with disposable fixtures.
- Use no secrets, real personal financial data, or production credentials.

### Explicit approval required for every agent

- Starting application implementation before the project approval gate.
- Installing/upgrading dependencies or changing package manifests/lockfiles.
- Reading `.env`, keychains, tokens, private URLs, or any secret material.
- Shared or production database access/migrations.
- Deployment, publishing, external messages, commits, pushes, merges, or production resources.
- Destructive deletion, broad filesystem operations, or irreversible data changes.
- Enabling subagents, hooks, plugins, MCP servers, or automatic approval policies for this project.

No agent may expand its own permissions, delegate a forbidden action to another agent, or treat a subagent’s broader runtime as authorization. Approval restrictions apply recursively to every subagent.

Financial integrity, authorization, identity, attachment, offline-sync, migration, and deployment changes require independent review in addition to ordinary approval.

## 9. Delegation protocol and bounded execution

### Delegation packet

Every delegation must include:

```text
Objective:
Task type and approval gate:
Source documents and decisions:
Allowed files/resources:
Forbidden actions:
Required skills and verified availability:
Expected artifact/evidence:
Dependencies:
Stop condition:
```

### Delegation limits

- Maximum delegation depth for this project: one level below the Main Agent. Subagents may not spawn children.
- Maximum concurrent subagents for a future configured multi-agent runtime: three, unless Hatim approves a different measured limit.
- Never delegate two agents to edit the same file concurrently.
- Prefer parallel read-only research/review; keep dependent implementation and final integration in the Main Agent.
- Short, dependent, or single-file tasks stay with the Main Agent.
- Subagents return evidence and recommendations; the Main Agent makes the integrated decision.

The official Agents/Responses multi-agent APIs support enabling multi-agent mode and a configurable concurrency limit, but the exact defaults differ by API surface/documentation. This project therefore uses an explicit local policy of depth one and three concurrent subagents until a configured runtime is verified. The current repository session has no subagent control, so this remains a proposed workflow.

### Execution loop

1. Read repository instructions and current project state.
2. Understand the task and preserve confirmed decisions.
3. Identify approval gate, affected files, risks, agents, and triggering skills.
4. Inspect required skills and official documentation; report missing skills.
5. Create/update an explicit plan and request approval when required.
6. Delegate bounded independent work, if useful and actually supported.
7. Implement only approved scope with the narrowest verified permissions.
8. Run relevant unit, integration, contract, security, accessibility, performance, offline, or end-to-end checks.
9. Request independent review for risk-sensitive or implementation changes.
10. Resolve findings and rerun affected checks.
11. Inspect final status, diff, secrets, changed files, and evidence.
12. Report commands, results, unrun checks, limitations, approvals, and next gate.
13. Stop and wait for explicit review when the task requires approval.

### Completion and retry rules

Completion requires the requested artifact/behavior, passing relevant checks, review evidence where required, and a transparent limitations report. Failed tests cannot be reported as passed; unrun end-to-end proof cannot be implied.

Retry only transient tool failures, at most twice, with a narrower or diagnostically different attempt. Do not retry policy, authorization, quota, or credential denials. Escalate to Hatim when a missing decision or permission blocks safe progress. Do not mark the task blocked merely because it is complex or incomplete.

## 10. Capability verification and official sources

Verified official capabilities:

- Codex/Agents platforms support skills as `SKILL.md` directories with front matter, instructions, and optional resources/scripts; skills activate from metadata and must be available in the runtime.
- Codex/Agents platforms support multi-agent orchestration only when the relevant session/API configuration enables it; subagents inherit configured tools/credentials and are not automatically present in every session.
- OpenAI plugin packaging can include skills, MCP configuration, and optional lifecycle hooks; hook scripts require the execution environment and trusted configuration.
- The official skill guidance recommends concise, scoped skills and avoiding duplicate or generic instructions.

Official sources used:

- [OpenAI Skills](https://developers.openai.com/api/docs/guides/tools-skills)
- [OpenAI Plugins and hooks](https://developers.openai.com/plugins/build/plugins)
- [OpenAI plugin architecture](https://developers.openai.com/plugins/concepts/plugins)
- [Agents API multi-agent](https://developers.openai.com/api/docs/guides/agents-api/multi-agent)
- [Responses API multi-agent](https://developers.openai.com/api/docs/guides/responses-multi-agent)
- [OpenAI Codex CLI guidance](https://developers.openai.com/api/docs/libraries/openai-cli)
- [Codex workflow/skill structure guidance](https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex)

Unsupported or unverified claims:

- This repository does not have a configured subagent runtime, so no subagent execution is claimed.
- No project hook is active merely because this document proposes one; the only observed hook state is Postman-related configuration in the user-level Codex config.
- No custom project skill listed below exists until a `SKILL.md` is created, installed/loaded, and validated.
- Documentation cannot enforce filesystem, network, secret, database, or deployment security.
- No automatic production deployment, persistent agent memory, or release authority is assumed.

## 11. Required approval and remaining decisions

Hatim must explicitly approve before any implementation work or skill/hook setup:

1. The Main Agent and specialized-agent boundaries, including depth-one delegation and concurrency-three policy.
2. Whether subagents will be enabled through a configured Agents API/Codex runtime or remain a manual workflow.
3. Whether any custom skills should be created, and the first prioritized skill to create.
4. The exact runtime hook surface and whether project hooks will be configured and trusted.
5. Narrow runtime permissions for dependency installation, migrations, external API calls, and deployment.
6. The existing technical recommendations and approval gates in `PLAN.md` and `TECHNICAL_DESIGN.md` remain unchanged by this document.
