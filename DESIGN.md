# Expense Tracker — UI and UX Design

Status: approved UI/UX design direction. D-07 browser targets and D-14 Atlas Ledger/light-and-dark design-system decisions are approved by the Product Owner. Remaining open product decisions stay explicitly marked below. This document defines the user experience and visual direction only; it does not create application code or change `SPEC.md`.

## Implementation update — 2026-11-04

The current implementation now includes a shared Next.js application shell, responsive navigation, authenticated-area route surfaces, a separate public `/welcome` marketing page, local demo-mode interactions, and immediate light/dark theme plus document language/direction switching. The demo adapter is enabled only when `NEXT_PUBLIC_USE_DEMO_DATA=true`; it is not a persistence layer and must remain disabled for API-backed environments.

Implemented CSS tokens are maintained in `apps/web/app/styles.css` and preserve the Atlas Ledger domain language: deep ink/blue for trust and information, saffron for attention and planned limits, mint for income/success, coral for expenses/errors, and violet for refunds/automation. The current concrete token set is:

| Token        | Light value | Dark value | Meaning                                 |
| ------------ | ----------- | ---------- | --------------------------------------- |
| `--ink`      | `#18222D`   | `#F5F7F8`  | Primary text and dark-theme contrast    |
| `--canvas`   | `#F3F6F8`   | `#11171D`  | App background                          |
| `--surface`  | `#FFFFFF`   | `#1A222A`  | Cards and panels                        |
| `--accent`   | `#BF5B3F`   | `#BF5B3F`  | Primary action                          |
| `--focus`    | `#2E5B73`   | `#86B8D1`  | Links, focus-adjacent data, information |
| `--income`   | `#2E806A`   | `#64C5A6`  | Income and positive activity            |
| `--expense`  | `#C65B50`   | `#F08A7E`  | Spending and critical expense state     |
| `--transfer` | `#2E5B73`   | `#86B8D1`  | Movement between accounts               |
| `--refund`   | `#7562A8`   | `#B8A8F0`  | Refund and automation support           |
| `--warning`  | `#B7791F`   | `#F0B95C`  | Budget attention                        |
| `--line`     | `#DCE3E8`   | `#33404A`  | Borders and separators                  |

The public marketing page intentionally makes only verified product claims: exact MAD display, explicit access, auditable history, private attachment/scanning boundaries, and transfer classification. It does not claim certifications, live integrations, customer counts, or production readiness.

The implementation status remains partial: complete translated copy, authenticated API wiring, browser-matrix visual proof, full RTL visual QA, service-worker/PWA behavior, and unresolved product decisions remain outside the verified surface.

## 1. Design intent

Expense Tracker should feel like a calm household financial cockpit: clear enough for a quick phone entry, trustworthy enough for a detailed monthly review, and welcoming enough for family members who are not finance specialists.

The central design principle is **confidence before cleverness**. Every amount should have a visible meaning, every financial mutation should communicate its state, and every permission or synchronization boundary should be understandable without exposing security details.

### Experience goals

- See the household financial position in seconds.
- Add an income, expense, transfer, or refund with minimal friction.
- Understand why a balance or budget changed.
- Make shared-wallet access visible and predictable.
- Continue supported work offline without pretending it is synchronized.
- Make English, French, and Arabic feel native rather than translated after the fact.
- Preserve a calm, auditable tone for sensitive actions.

### Non-goals

- No bank aggregation, payment processing, or mandatory approval workflow is introduced.
- No irreversible deletion interaction is designed; the UI uses archive/soft-delete language.
- No new product capability is added beyond `SPEC.md`.
- No technical proposal in `TECHNICAL_DESIGN.md` is treated as approved by this document.

## 2. Traceability to existing requirements

| Requirement source                           | UX response                                                                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Shared Wallet and custom permissions         | Singular Shared Wallet context, member/role management, permission-aware actions, and clear read-only states                |
| Income, expense, transfer, recurring, refund | One transaction composer with an explicit type selector and type-specific fields; linked transfer/refund context            |
| Exact MAD balance and foreign currencies     | MAD is the primary display amount; original amount, rate, timestamp/source, and conversion are shown in detail              |
| Soft deletion and auditability               | Archive confirmation explains reversibility; history/audit surfaces show who changed what and when                          |
| Budgets and reports                          | Monthly overview, category budget cards, trend charts, filters, and export actions                                          |
| Notifications                                | Notification center with event type, severity, read state, and deep links                                                   |
| PWA/offline/synchronization                  | Persistent connection state, queued/syncing/conflict labels, offline-safe actions, and conflict resolution screens          |
| English/French/Arabic and RTL                | Locale switcher, translated content, mirrored layout rules, locale-aware dates/numbers, and RTL QA                          |
| Attachment restrictions                      | File picker guidance, size/type validation, upload progress, and authorized preview/download states                         |
| Authentication and server authorization      | Secure sign-in states, permission-aware controls, explicit unauthorized responses, and no client-only security claims       |
| Backup/restore requirement                   | Operational backup/restore evidence is kept outside the end-user UI proposal; never labels an untested backup as restorable |

## 3. Information architecture

### Primary navigation

Desktop uses a persistent left rail. Tablet uses a collapsible rail. Mobile uses a bottom navigation bar for the four highest-frequency areas plus a prominent central add action.

```text
Workspace
├── Overview
├── Transactions
│   ├── All transactions
│   ├── Recurring
│   ├── Transfers
│   └── Refunds
├── Budgets
├── Reports
├── Notifications
└── More
    ├── Shared Wallet
    ├── Categories
    ├── Account and opening balance
    ├── Language and appearance
    ├── Security and sessions
    └── Admin / audit (permission-gated)
```

### Global shell

- **Shared Wallet context:** shows the singular Shared Wallet name/context and member count. The baseline supports a Shared Wallet, not multiple-wallet management; there is no wallet switcher or wallet list in this proposal.
- **Period control:** defaults to the current Morocco day/month context; offers month selection and a clear reset to current period.
- **Connection status:** compact status pill with `Online`, `Offline`, `Syncing`, `Action needed`, or `Sync paused`.
- **Notification bell:** unread count and last-seen marker.
- **Profile menu:** account, language, appearance, sessions, and sign out.
- **Global add action:** opens the transaction composer and remembers the last-used type only as a convenience; it never changes the financial meaning of a transaction silently.

### Navigation rules

- Hide or disable controls only when the server-provided permission state supports that decision; an unavailable control must have an explanatory tooltip or read-only message.
- Never hide a record merely because the user cannot edit it. Show the record with read-only context.
- Keep filters in the URL/state model so a report, transaction list, or detail view can be shared within the authorized application context.
- In RTL, the navigation rail, directional icons, breadcrumbs, and table actions mirror. Currency symbols, digits, dates, and file extensions retain locale-appropriate reading behavior.

## 4. Core user journeys

### 4.1 First sign-in and workspace orientation

1. User signs in.
2. The user sees a concise account setup flow for their required financial account: opening balance and MAD base currency (fixed and explained).
3. The user lands on an orientation dashboard with one clear next action: add the first transaction.
4. The dashboard explains the Shared Wallet context, the user’s role, and what they can do.

Success: user understands the current balance context and can add a transaction.

### 4.2 Add an expense or income

1. User activates `Add transaction`.
2. The composer opens with type tabs: Expense, Income, Transfer, Refund, Recurring.
3. Required fields are shown first: amount, currency, date, category/type context, and payment method as applicable.
4. Optional details are grouped under `More details`: note, attachments, exchange-rate source, and tags if later approved.
5. User sees a live summary: `You are recording an expense of X [currency], stored as Y MAD`.
6. User submits; the screen confirms `Saved` or `Queued offline`, never a vague success message.
7. The detail view provides `Edit`, `Archive`, `Add refund`, or `View audit` only when authorized. `Edit` and `Archive` are available to the transaction creator or an Admin; other members receive a read-only view when permitted.

### 4.3 Transfer record

1. User selects Transfer.
2. The user enters the approved transfer fields: amount/currency, date, and note.
3. The UI does not introduce multiple bank accounts, source accounts, destination accounts, or account-to-account capabilities not defined by `SPEC.md`.
4. The review step explicitly states: `This creates linked debit and credit records and is excluded from income and expense totals.`
5. On success, the detail view shows both linked legs and a transfer badge.

The source/destination domain for a transfer remains an open product decision. Until it is approved and represented by the backend contract, this design shows only a linked transfer context supplied by the system; it does not invent account selectors.

### 4.4 Refund

1. User opens an eligible original transaction.
2. User selects `Add refund`.
3. The composer pre-fills the original transaction reference and shows the remaining refundable amount.
4. User chooses full or partial amount, date, note, and optional attachment.
5. The review state explains the effect on the balance and original transaction.

### 4.5 Shared-wallet permissions

1. Admin opens Shared Wallet → Members and roles.
2. Admin sees a member table with role, access scope, last activity, and status.
3. Admin opens a role to view permissions grouped by domain: transactions, budgets, reports, transaction attachments, members, audit, and account settings.
4. Admin creates or edits a custom role using explicit checkboxes and a permission impact summary.
5. Admin assigns/revokes a role with a confirmation that names the affected member and scope.
6. The result creates an audit event and shows a reversible next step where applicable.

The UI does not imply a permission exists just because a control is visible. The server response remains authoritative.

### 4.6 Offline work and synchronization

1. Connection status becomes Offline; the shell remains usable.
2. Supported offline actions show an `Offline-safe` hint before submission.
3. On save, the user sees `Queued on this device` with a local operation reference.
4. A sync tray lists queued, syncing, completed, retryable, and conflict items.
5. On reconnect, the app syncs idempotently and reports the actual result.
6. A conflict opens a side-by-side comparison of the attempted change and the server state, including the current version and resolution metadata supplied by the synchronization contract. There is no silent overwrite. The actual resolution actions remain a proposal until the conflict policy is approved.

### 4.7 Monthly review and reporting

1. User selects a month.
2. Overview highlights income, gross expenses, refunds, net expenses, transfers excluded from income/expense totals, current balance, and budget health.
3. User drills into a category, time range, or transaction list.
4. Reports provide weekly/monthly views and export choices.
5. Export progress and completion are visible, with errors that explain retry or permission requirements.

## 5. Screen inventory

### Authentication and setup

- Sign in.
- Session expired / sign-in required.
- Financial account setup and opening balance.
- Unauthorized / insufficient permission.
- Password recovery or identity-provider return states, depending on approved authentication design.

### Core finance

- Overview dashboard.
- Transactions list.
- Transaction detail.
- Create/edit transaction composer.
- Transfer detail with linked records.
- Refund composer and refund history.
- Recurring transaction list.
- Recurring transaction editor, pause/cancel confirmation, and generation status.

### Budgets and reporting

- Budget overview.
- Global monthly budget editor.
- Category budget editor.
- Budget detail with threshold history.
- Reports overview.
- Report detail with weekly/monthly filters.
- Export dialog and export status.

### Shared wallet and administration

- Wallet overview.
- Members list.
- Role list.
- Role editor and permission impact preview.
- Categories list/editor.
- Audit event list/detail.
- Account settings and opening-balance adjustment flow.
- No backup/restore screen is included in the end-user product proposal. Backup and restore remain an operational interface concern for system operators, subject to a separate approved operations design.

### System and support states

- Notification center.
- Transaction attachment preview/download state.
- Offline/sync center.
- Conflict review and any approved resolution flow.
- Language and appearance settings.
- Security/session management.
- Empty, loading, error, offline, stale, queued, conflict, and success variants for every relevant screen.

## 6. Dashboard design

The Overview is a **monthly command surface**, not a wall of charts.

### Layout

1. **Header band:** active wallet, selected month, connection status, notification count, and primary add action.
2. **Balance hero:** current MAD balance with opening-balance context and a compact `as of` timestamp. Use a calm dark-slate card with a subtle Morocco-inspired horizon line rather than a generic gradient.
3. **Four metric cards:** income, gross expenses, refunds, and net expenses for the selected period. Refunds are shown as a reconciliation adjustment and are not added to income. Transfers are shown separately as movement, never blended into income/expense totals.
4. **Budget pulse:** global budget progress plus top category budgets; progress state changes from neutral to attention to exceeded without relying on color alone.
5. **Cash-flow ribbon:** a low-noise weekly line/area visualization with income and expense layers, tooltips, and a table alternative.
6. **Recent activity:** five to eight authorized transactions with type badge, category icon, relative date, amount, sync state, and quick view.
7. **Action-needed rail:** conflicts, failed syncs, recurring reminders, budget thresholds, and low-balance notifications.

### Dashboard behavior

- The selected month changes all period-scoped cards and displays the active period prominently.
- Cards link to filtered lists; charts always have accessible tabular summaries.
- First-use empty state uses a guided example with no fake financial data persisted.
- Offline dashboard clearly labels data freshness and pending local changes.

## 7. Transaction design

### Composer structure

Use a wide desktop dialog/page and a full-height mobile sheet. Keep the composer focused on one transaction.

```text
Transaction type tabs
Amount + currency
MAD conversion preview / rate source
Date
Category or linked original transaction
Payment method
Note
Attachments
Review summary
Save / Save and add another / Cancel
```

### Type-specific behavior

| Type      | Required emphasis                                 | Special explanation                                      |
| --------- | ------------------------------------------------- | -------------------------------------------------------- |
| Expense   | Category, payment method, amount                  | Reduces balance; original and MAD values stay visible    |
| Income    | Source/category, amount                           | Increases balance; never shown as an expense             |
| Transfer  | Approved transfer context, amount                 | Creates linked legs; excluded from income/expense totals |
| Refund    | Original transaction, remaining refundable amount | Full/partial refund and resulting effect                 |
| Recurring | Schedule, next occurrence, pause/cancel controls  | Generation is automatic and duplicate-protected          |

### Detail view

- Hero row: type badge, MAD amount, original amount if foreign currency, status, and date.
- Context panel: category, payment method, Shared Wallet context, note, creator, and transaction attachments.
- Conversion panel: original amount, exchange rate, converted MAD amount, timestamp/source.
- Related activity: linked transfer legs, original transaction/refunds, recurring template.
- Audit panel: changes and archive events for authorized users.
- Action bar: edit/archive for the creator or Admin, refund where permitted, retry sync, review conflict metadata, or access transaction attachments according to permission and state. Archive is the auditable soft-delete behavior; it is not irreversible deletion.

### Form states

- Inline validation appears beside the field and in a summary at the top after submit.
- Amount input uses locale-aware separators but stores exact values; conversion preview is labeled as a preview until saved.
- Date input presents the Morocco-day rule in help text when relevant.
- A pending network request disables duplicate submission and shows progress.
- Offline save uses a distinct queued state rather than green saved styling.

## 8. Shared wallet and permissions UX

### Member list

Columns on desktop: member, role, Shared Wallet access, status, last activity, and actions. Mobile becomes stacked member cards with the same fields.

Use role chips with text labels, never color alone. A read-only member sees `View only` and can inspect permitted records without edit controls.

### Role editor

Group explicit permissions into:

- View transactions
- Create transactions
- Edit own transactions
- Edit all transactions
- Archive transactions
- Manage recurring transactions
- Manage budgets and reports
- View/download transaction attachments
- Manage categories
- Manage members and roles
- View audit events
- Manage account settings

The exact matrix remains an open product decision. The UI should show only approved permission names and an impact summary such as `2 members will gain access to transaction attachments` before saving. No standalone attachment library is proposed; attachments are accessed through authorized transaction detail views.

### Safety patterns

- Destructive/revoking actions use a confirmation dialog with named target and effect.
- Role changes show a review step and audit notice.
- Last-Admin protections, if required by the final permission policy, must be server-enforced and surfaced as an explanatory error.
- Unauthorized states preserve context and provide a safe route back; they do not reveal hidden record details.

## 9. Budgets, reports, recurring transactions, and notifications

### Budgets

- Budget cards show amount used, amount remaining, percentage, period, category, and threshold state.
- Global and category budgets are visually related but never merged into one ambiguous total.
- Threshold notices use icon + label + pattern/contrast + text, not color alone.
- Editing a budget previews the period impact before saving.

### Reports

- Report header contains period, Shared Wallet context, filters, and export action.
- Summary begins with reconciled totals, then charts, then drillable tables.
- Expense reporting distinguishes gross expenses, refunds, and net expenses. A refund references the original expense where possible, increases the balance, and is not counted as income. Net expenses are presented as `gross expenses - refunds`; refunds are not added again as a separate expense or income total.
- Every chart has a table view and a screen-reader summary.
- Transfers are explicitly separated from income/expense totals.
- Export dialog lists format, period, filters, and permission scope before starting.

### Recurring transactions

- List shows template name, type, amount, schedule, next occurrence, status, and last generated result.
- Paused and failed states are explicit.
- Canceling requires confirmation; editing explains whether it affects future occurrences only.
- Duplicate prevention and failure recovery are described in the UI as `generation status`, not hidden automation.

### Notifications

- Notification center groups by Today, Earlier, and category when useful.
- Event types: budget threshold, low balance, transaction event, recurring reminder, report ready, sync issue, permission/security event.
- Each item includes timestamp, severity, read state, and deep link.
- Push/email preferences are separate from the in-app record and follow the approved notification channels.

## 10. System states and feedback

| State                    | Visual treatment                                           | Copy pattern                                                    |
| ------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Loading                  | Skeleton matching final layout; preserve navigation        | Avoid fake numbers; say what is loading when delay is material  |
| Empty                    | One calm illustration/shape + explanation + primary action | Explain why empty and what the user can do next                 |
| Saved                    | Checkmark + authoritative server timestamp/status          | `Saved` only after server acceptance                            |
| Queued offline           | Amber/blue queue badge + local operation reference         | `Queued on this device. It will sync when you reconnect.`       |
| Syncing                  | Animated but reduced-motion-safe progress indicator        | `Syncing 2 changes`                                             |
| Conflict                 | High-visibility action-needed panel; no success color      | Explain both states and offer explicit resolution               |
| Retryable error          | Inline retry + preserved input                             | Explain that no duplicate was created if idempotency is known   |
| Permission denied        | Neutral locked state with reason                           | Do not reveal unauthorized data                                 |
| Archived                 | Muted record with archive label and audit link             | Avoid deletion language unless the action is truly irreversible |
| Offline shell            | Persistent status bar and cached-content freshness         | Never imply current server freshness                            |
| Destructive confirmation | Modal with named target and consequence                    | Require deliberate confirmation, no ambiguous `Continue`        |

All feedback must support keyboard focus, screen-reader announcement where appropriate, and reduced motion.

## 11. Visual direction

### Concept: Atlas Ledger

The design combines the confidence of a ledger with the warmth of a household tool. It uses deep ink surfaces for trust, warm sand neutrals for paper-like context, and a restrained saffron accent for actions and attention. A thin horizon motif references the Atlas without becoming decorative clutter.

The visual language should feel authored: rounded but not bubbly, data-dense but breathable, with strong numerals and quiet surfaces. Avoid the common fintech pattern of neon gradients, oversized abstract charts, or excessive green/red semantics.

### Color tokens

These are design proposals, not brand approvals.

| Token      | Light value | Dark value | Use                                  |
| ---------- | ----------- | ---------- | ------------------------------------ |
| Ink 950    | `#17202A`   | `#F5F7F8`  | Primary text / inverse text          |
| Ink 700    | `#46515C`   | `#C5CED6`  | Secondary text                       |
| Paper 50   | `#FBFAF7`   | `#11171D`  | App background                       |
| Paper 100  | `#F2F0EA`   | `#1A222A`  | Panels and table rows                |
| Atlas blue | `#2E5B73`   | `#86B8D1`  | Informational/primary data           |
| Saffron    | `#D89028`   | `#F0B95C`  | Primary action and attention         |
| Mint       | `#2E806A`   | `#64C5A6`  | Positive/saved/income support        |
| Coral      | `#C65B50`   | `#F08A7E`  | Expense/critical/error support       |
| Violet     | `#7562A8`   | `#B8A8F0`  | Recurring/automation support         |
| Border     | `#D9D6CE`   | `#33404A`  | Dividers and focus-adjacent surfaces |

Rules:

- Never communicate meaning with color alone; pair with labels, icons, shapes, or position.
- Validate contrast for text, icons, focus, charts, and disabled states.
- Expense coral is a semantic indicator, not a moral judgment; use neutral language.
- Light and dark themes are required for the complete product and must preserve contrast and chart legibility.

### Typography

- Latin: `Inter` or another approved humanist sans for UI and tabular numerals.
- Arabic: `Noto Sans Arabic` or another approved Arabic UI family with matched x-height and weight range.
- Use tabular numerals for balances and comparisons.
- Recommended scale: 12, 14, 16, 18, 20, 24, 32, 44 px with responsive clamp only for the balance hero.
- Body text remains at least 16 px on mobile for finance forms; captions may be 13–14 px when contrast and readability remain strong.
- Do not mix Arabic and Latin glyphs in a way that changes numerical meaning; test currency and date rendering in all locales.

### Spacing, shape, and elevation

- Base spacing unit: 4 px; primary rhythm uses 8, 12, 16, 24, 32 px.
- Radius: 10 px for controls, 16 px for cards, 20 px for hero surfaces, full pill only for status chips.
- Use one soft shadow family for elevated dialogs; prefer borders and surface contrast for ordinary cards.
- Keep dense transaction tables aligned with generous row height and clear separators.

### Iconography

- Use one rounded, stroke-based icon family with consistent 1.75–2 px stroke.
- Icons support labels and do not replace them in primary navigation or financial actions.
- Directional icons mirror in RTL; non-directional category icons do not.
- Financial type icons: arrow-down Expense, arrow-up Income, split arrows Transfer, circular return Refund, calendar-repeat Recurring.

## 12. Component system

### Foundations

- Color, typography, spacing, radius, elevation, motion, focus, and RTL tokens.
- Locale-aware number/date/currency formatting utilities.
- Motion preference and reduced-motion tokens.

### Core components

- App shell, navigation rail, mobile bottom bar, Shared Wallet context indicator, period picker.
- Connection status pill, sync tray, notification badge, permission badge.
- Button, icon button, link, segmented transaction-type control, tabs, menu, tooltip.
- Text/amount/date/currency fields, select, combobox, file picker, textarea, checkbox, switch, radio group.
- Card, metric card, budget meter, chart frame, data table, filter bar, pagination/cursor controls.
- Dialog, drawer, full-screen mobile sheet, confirmation dialog, toast, inline alert, empty state, skeleton.
- Timeline/audit event, transaction row, transaction attachment tile, conflict comparison panel.

### Interaction patterns

- Primary action is one per screen region; secondary actions remain visible but quieter.
- Destructive actions are never adjacent to primary submit without separation.
- Forms preserve typed data when validation or network errors occur.
- Dialogs trap focus, close predictably, and return focus to the trigger.
- Tables provide mobile cards or horizontal scroll with a visible affordance; never shrink financial amounts until unreadable.

## 13. Responsive behavior

The approved browser matrix is the latest two stable major versions of Chrome, Edge, Firefox, and Safari, plus supported iOS Safari and Android Chrome. The design targets three layout modes rather than device brands:

### Mobile

- Single-column cards and full-height composers.
- Bottom navigation: Overview, Transactions, Add, Budgets, More.
- Sticky submit action in forms; attachment and conversion details collapse into sections.
- Transaction rows become cards with amount and type first.
- Avoid hover-only affordances; use tap-safe targets of at least 44×44 CSS pixels.

### Tablet

- Collapsible navigation rail.
- Two-column overview where room allows.
- Composer can use a side drawer; detail and list can coexist in landscape.

### Desktop

- Persistent rail and wider content frame with a max reading width for forms.
- Overview uses a 12-column grid: hero 7, action rail 5; recent activity spans the lower grid.
- Transaction list supports dense table view with a persistent filter bar and detail side panel.

### Wide language content

- Components must tolerate longer French labels and Arabic line height without truncation.
- Buttons expand to content; do not hard-code English widths.
- Currency, dates, and numeric columns remain aligned independently of text direction.

## 14. RTL and localization rules

- Direction is set at the document/app root from the active locale, not per isolated component.
- Use logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`, `border-start`) rather than left/right assumptions.
- Mirror navigation, drawers, breadcrumbs, directional arrows, chart axes where semantically directional, and table action placement.
- Do not mirror currency symbols, numbers, file previews, or non-directional category icons.
- Arabic uses a tested line-height and may need larger vertical rhythm than Latin locales.
- Translation keys describe meaning, not English sentence fragments.
- Dates use locale-aware display while date-only financial behavior follows the Morocco-day/UTC rule.
- Plurals and gendered language must be handled through the approved localization system, not string concatenation.
- Allow labels to wrap; test empty, long, error, and mixed-script content.

## 15. Accessibility requirements

- Keyboard navigation reaches every interactive control in logical order.
- Visible focus is never removed; focus styling meets contrast requirements.
- Form labels, descriptions, errors, and required states are programmatically associated.
- Modal/dialog focus is trapped and restored; toasts do not steal focus.
- Charts have text summaries and tabular alternatives.
- Status changes such as queued, syncing, conflict, and saved are announced appropriately.
- Color is never the sole status channel.
- Touch targets are at least 44×44 CSS pixels where practical.
- Respect reduced motion, zoom, high contrast, and text enlargement.
- Test with keyboard, screen reader, contrast tooling, RTL, and at least one small viewport.

## 16. UX decisions, proposals, and open questions

### Approved design decisions

- **D-UX-001:** Use the Atlas Ledger visual direction with deep ink, warm paper, Atlas blue, saffron action, mint positive, coral warning, and violet recurring accents.
- **D-UX-002:** Use a persistent desktop rail, tablet collapsible rail, and mobile bottom navigation with a central add action.
- **D-UX-003:** Make the monthly Overview the default authenticated landing screen.
- **D-UX-004:** Use one transaction composer with explicit type tabs rather than five disconnected forms.
- **D-UX-005:** Make online/offline/sync/conflict state persistent in the shell and never represent queued work as saved work.
- **D-UX-006:** Support both light and dark themes in the complete product with shared semantic tokens and equivalent accessibility requirements.
- **D-UX-007:** Treat the Shared Wallet as one application context. Do not expose wallet switching or multiple-wallet management unless the product specification is later expanded and approved.
- **D-UX-008:** Present refunds as reconciliation adjustments: gross expenses, refunds, and net expenses are distinct values, with refunds excluded from income and not double-counted in expense totals.
- **D-UX-009:** Treat transaction `Archive` as the UI action for the required auditable soft-delete behavior. The transaction creator and Admin may edit or archive; other permitted members are read-only.

### Open decisions requiring the product owner’s approval

- **O-UX-001:** Exact permission matrix and which Admin/role actions appear in the first release; the baseline creator/Admin edit/archive rule remains preserved.
- **O-UX-002:** Minimum supported offline workflows: transaction creation only, or also edits, archive, attachments, budgets, and reports.
- **O-UX-004:** Authentication provider and whether password recovery/MFA screens are in the first release.
- **O-UX-005:** Notification channels and user preference controls beyond in-app notifications.
- **O-UX-006:** Report definitions, chart types, export layouts, and PDF branding, including whether net expenses are the headline metric.
- **O-UX-007:** Whether a separate operational console for system operators is required. No backup/restore status screen is proposed for ordinary Admin users in this document.
- **O-UX-008:** Brand assets and final font licensing/rendering verification remain implementation dependencies; dark-theme scope is approved.
- **O-UX-009:** The supported transfer context/source-destination model. Until approved, the UI must not expose unsupported account selectors.
- **O-UX-010:** The approved conflict-resolution actions. The UI may display attempted operation, current server version/state, and resolution metadata, but must not invent merge/keep-local/keep-server policies.
- **O-UX-011:** Whether transaction attachments need any additional authorized browsing experience beyond access from transaction detail. No standalone attachment library is currently proposed.

The remaining open questions are implementation dependencies only for the affected flows. They must not be silently assumed or used to reopen the approved Atlas Ledger direction, responsive targets, theme scope, or localization requirements.

## 17. Design acceptance and verification plan

Before implementation approval, review this document against `SPEC.md`, `PLAN.md`, `TECHNICAL_DESIGN.md`, `AGENT_ARCHITECTURE.md`, and `TEST.md` for traceability and scope. `TEST.md` was verified to exist in the repository during this design refinement.

During implementation, the design is accepted only when:

- Every screen in the inventory has an approved empty/loading/error/offline/success treatment where relevant.
- Core E2E flows cover authentication, account setup, transaction types, budgets, reports, permissions, attachments, offline sync, conflict handling, and localization/RTL.
- Browser tests verify mobile/tablet/desktop modes and Arabic RTL rendering.
- Accessibility checks cover keyboard, focus, labels, contrast, status announcements, and chart alternatives.
- Financial UI displays server-authoritative values and never calculates a conflicting balance in the client.
- Permission-sensitive actions are enforced server-side and verified with negative tests.
- Queued, syncing, conflict, retryable, and archived states are visibly distinct.

## 18. Approval gate

This design direction is approved. Application implementation, dependency installation, design-system asset creation, and production-related work must still follow the approved `PLAN.md`, task-level gates, and separate production approvals. `SPEC.md` and confirmed product requirements remain unchanged.
\_
