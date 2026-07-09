# UGAAP — Uganda Agricultural Aggregation Platform

**A comprehensive overview for onboarding and reference**
*Compiled from the UGAAP BRD/FRD (v1.0, April 2026) and the current state of the codebase (July 2026).*

---

## 1. What UGAAP Is

UGAAP is a **multi-tenant digital platform that digitizes the agricultural value chain between cooperatives and smallholder farmers in Uganda**. It replaces paper ledgers and Excel/Access spreadsheets with a centralized system that tracks, from end to end:

1. **Farmer onboarding** — registering farmers and cooperatives as tenants.
2. **Input issuance** — inputs (seeds, fertilizer, agrochemicals), livestock, and other stock items given to farmers on credit.
3. **Produce delivery & grading** — recording harvest deliveries at collection points, weighing them, and automatically grading quality.
4. **Outstanding balance calculation** — netting what a farmer owes (input credit) against what they're owed (produce delivered), after deductions.
5. **Reconciliation & reporting** — producing an auditable single source of truth for payment execution, which happens **outside** the platform.

### The problem it solves

Uganda's smallholder farmers generate ~80% of the country's agricultural output (FAO), but cooperatives currently track input loans and harvest receipts on paper or in disconnected spreadsheets per branch. Reconciling what a farmer owes against what they've delivered takes **weeks** and is a frequent source of disputes. UGAAP's stated goal is to collapse that reconciliation cycle into a real-time digital ledger with full auditability.

### One critical design constraint: no payments move through UGAAP

This is the single most important business rule in the system: **UGAAP never disburses money.** Every "payment" figure in the platform — gross pay, deductions, input offsets, net balance — is a **record of an obligation**, not an executed transaction. Cooperatives download an Outstanding Payments Report and pay farmers through their own bank/mobile-money channels outside the platform. This keeps UGAAP out of the regulatory scope of a payment processor while still giving cooperatives a trustworthy, auditable ledger.

---

## 2. Who Uses It (Actors)

All roles/permissions are configurable (not hardcoded), but the platform ships with five reference actors:

| Actor | Channel | Responsibility | Data Scope |
|---|---|---|---|
| **Platform Admin** | Web Portal | System-wide configuration, role management, cross-cooperative reporting | All cooperatives |
| **Cooperative Admin** | Web Portal | Cooperative/branch setup, season management, onboarding approvals, cross-branch reporting | Own cooperative |
| **Branch Manager** | Web Portal + App | Farmer onboarding, delivery oversight, correction approvals, branch reports | Own branch only |
| **Field Agent / Collection Officer** | Android App | Farmer check-in, delivery recording, quality capture, input issuance | Own branch only |
| **Farmer** | USSD + SMS | Balance enquiry, dispute initiation, receives notifications | Own records only |

This maps directly onto the three-tier hierarchy the platform is organized around:

```
Platform  (E&M Technology House — operates the whole system)
   └── Cooperative  (tenant, e.g. a coffee or dairy cooperative)
         └── Branch  (a physical collection point / office)
               └── Farmers, Field Agents
```

There is no "Region" tier in v1.0 — hierarchy is strictly Cooperative → Branch.

---

## 3. Core Business Process (As-Is → To-Be)

**As-Is (the paper world):** Input distribution has no formal repayment tracking. Delivery records live in Excel/Access/paper at the branch, uncentralized. Farmer balances aren't systematically calculated. Reconciliation between input and delivery records takes weeks and is dispute-prone.

**To-Be (UGAAP):**
1. Admin configures crops, livestock, stock items, seasons, and repayment terms centrally.
2. Farmer is onboarded through a structured, multi-stage digital workflow.
3. Inputs are issued to a farmer, generating an auto-calculated repayment obligation.
4. Farmer delivers produce → an agent records the delivery → a **grading engine** assigns a quality grade and price differential automatically, against configured thresholds.
5. Outstanding payment is calculated (gross pay minus deductions minus input offset) and stored.
6. The farmer receives an SMS with the full breakdown.
7. Repayments/deductions update the farmer's ledger in real time.
8. Cooperative staff download a report and execute payment externally.

Business rules that govern all of this: repayment schedules, deduction logic, and fees are **parameter-driven per crop/livestock type, season, and branch** — nothing is hardcoded, and everything generates an immutable audit trail. Branch data is isolated: a Branch Manager, Field Agent, or Farmer only ever sees their own branch's/records' data.

---

## 4. Functional Modules

The FRD organizes the platform into 9 modules. This is the fullest statement of platform *scope* (not all of it is built yet — see [§7](#7-current-implementation-state-vision-vs-reality)):

| # | Module | Purpose |
|---|---|---|
| 1 | **Configuration Management** | Defines crops, livestock, stock items, seasons, grading tiers, repayment schedules, deductions, notification templates, and roles/permissions — all without code changes. |
| 2 | **User Management** | Full lifecycle of user accounts and RBAC (role-based access control) across every other module. |
| 3 | **Onboarding** | A configurable 7-stage pipeline (Pre-Registration → KYC → Profile → Document Verification → Group Assignment → Credit Assessment → Activation) for farmers, plus cooperative-as-tenant onboarding and bulk CSV/Excel farmer upload. |
| 4 | **Inventory Management** | Input Catalogue, Input Issuance recording, per-farmer Input Credit Ledger, stock item tracking (issued vs. recovered), overdue credit alerts. |
| 5 | **Collection Management** | Delivery recording at collection points, weighbridge integration (Bluetooth/serial, manual fallback with supervisor approval), delivery correction workflow, batch grouping, offline-first recording, quality parameter capture, and the automated grading engine. |
| 6 | **Finance** | Computes outstanding payment per delivery (gross pay − deductions − input offset), maintains an immutable per-farmer payment ledger, generates Outstanding Payment Reports. **Explicitly does not disburse funds.** |
| 7 | **Reporting** | A library of standard reports (Farmer Input Summary, Delivery Register, Grading Summary, Outstanding Payments, Audit Log Export, Branch Performance Dashboard), filterable, exportable to Excel/PDF, schedulable. |
| 8 | **Notifications** | Event-driven SMS to farmers (onboarding, delivery, grading, balance updates), reminders (overdue balances, unresolved disputes), and in-app maker-checker/approval alerts. |
| 9 | **Security & Access Control** | OAuth2 + JWT, mandatory OTP 2FA for admin/financial actions, database-level branch isolation (row-level security), immutable append-only audit log, TLS 1.3 in transit / AES-256 at rest, session auto-expiry. |

### Delivery channels

- **Web Portal** — browser-based, used by Platform Admins, Cooperative Admins, Branch Managers.
- **Android App** — used by Field Agents for offline-capable check-in/delivery/grading (Android 4.4+, optimized for low-bandwidth 3G, to accommodate rural device constraints).
- **USSD** — feature-phone access for farmers over MTN/Airtel Uganda GSM networks (2G/EDGE/3G), for balance enquiries and dispute initiation without needing data connectivity.
- **SMS** — the primary notification channel back to farmers.

### Key non-functional commitments

- Branch-level data isolation enforced at the **database row level** — cross-branch leakage should be technically impossible.
- Compliance with the **Uganda Data Protection and Privacy Act 2019**; ISO 27001 targeted; biannual pen tests.
- Disaster recovery target: RTO 4h / RPO 1h, semi-annual DR tests.
- New cooperative tenants should be provisionable within 72 hours via template-based setup.
- Audit log retention is indefinite; transaction/delivery records retained 10 years, reconciliation records 7 years.

---

## 5. Conceptual Data Model

The FRD's entity model (guides, not final schema):

- **Cooperative** (tenant) → has many **Branch**es and **Season**s.
- **Branch** → belongs to Cooperative, has many **Farmer**s — this is the data-isolation boundary.
- **Farmer** → belongs to Branch, has many **Delivery**s and **InputRecord**s.
- **FarmerGroup** → optional cluster of farmers within a branch (a "leader" farmer + members).
- **Season** → belongs to Cooperative; only one Active season per commodity-branch combination at a time.
- **CropType / LivestockType / StockItemType** → fully config-driven catalog entries, no schema changes needed to add new ones.
- **InputRecord → Repayment** → an issuance to a farmer and its repayment events (cash, produce offset, or livestock return).
- **DeliveryRecord → GradeRecord → Deduction** → a produce delivery, its assigned quality grade/adjusted price, and any deductions applied.
- **FarmerBalanceLedger** → per-farmer, per-season net position (gross pay, deductions, input offset, net balance) — recalculated on every event.
- **ReconciliationUpload → ReconciliationRow** → external payment file uploads and their row-level match status (Exact/Partial/None) against the ledger.
- **AuditLog** → append-only, references every other entity, immutable.
- **NotificationLog** → SMS/in-app/email delivery records.

---

## 6. Explicit Scope Boundaries

Called out directly in the FRD as **out of scope for this version**:

- Direct payment disbursement to farmers (tracking only — execution is always external).
- Web scraping, market price feeds, or third-party commodity exchange integrations.
- Loan origination or credit scoring beyond cooperative input-credit tracking.
- A "Region" tier above Branch.
- Real-time payment API integration — external payment reconciliation is **file-based (CSV/Excel upload) only**.

---

## 7. Current Implementation State (Vision vs. Reality)

This section reflects what's actually in the repository today, as distinct from the full FRD scope above.

### Frontend — `frontend/ugaap-portal` (Angular ~21, standalone components, signals)

The three-tier role hierarchy from the FRD (Platform / Cooperative / Branch) is fully reflected in the routing structure under `src/app/features/`:

- `features/platform/*` — cooperatives list, cooperative onboarding, platform-level roles/users/settings dashboard.
- `features/cooperative/*` — dashboard, farmers, branches, collection hubs, agents, configuration, pricing, grade config, inventory, finance, reports, roles, users.
- `features/branch/*` — dashboard, branch-farmers, collections, daily-grading, inventory, and a growing **finance/** area (batch-create, batch-processing, batch-farmers, all-batch-farmers, disbursements) that implements the payment-batch and disbursement workflow currently being built out (see recent commits on `features/disbursements`).
- `features/auth/*` — login, OTP verification, first-time login, forgot/reset password, account-locked, session-expired — matching the OAuth2/JWT + mandatory OTP 2FA requirement from the FRD.

Much of the frontend currently runs against **mock services** (`core/mock/`) rather than live backend calls, since several backend modules (finance/reporting/notifications) don't exist yet — see below.

### Backend — `backend/` (Spring Boot 3, Java 21, Spring Cloud 2024.0.1, microservices + Eureka/Config Server/API Gateway)

Four business microservices are implemented, plus three infrastructure services:

| Service | Status | What it actually models |
|---|---|---|
| **AuthenticationService** | Mature | Client/Credentials/Session/AuditLog entities. Two-step login (validate → OTP verify), JWT issuance, refresh, logout, password reset flow. |
| **MembershipService** | Well-developed | Member (rich farmer profile incl. KYC, bank/mobile-money/Wendi wallet fields), Cooperative, Branch, User, Role, Permission. Controllers for members, cooperatives, branches, access management, and a **maker-checker approval workflow**. |
| **ConfigurationService** | Minimal but functional | Commodity, Grade, BranchPrice entities. Controllers for commodities, grades, and per-branch pricing. |
| **CollectionService** | Functional core, narrower entity set | FarmerDelivery, SeasonConfig entities. Delivery CRUD with pagination/search/export, branch- and cooperative-level aggregation. Notably includes a `SettlementController` that **expects inbound webhooks from a Payment Service** — i.e. the integration point for Finance was designed for, but the Payment Service itself doesn't exist yet. |
| **api-gateway / eureka-server / config-server** | Infra only | Spring Cloud Gateway routes `/auth/**`, `/api/v1/**` to the above four services via Eureka discovery; centralized config server. |
| **shared** | Library | Cross-service JWT validation, security context, MinIO file-storage client, inter-service REST clients. |

**Gaps against the FRD, as of this writing:**
- **Finance/Payment module** — not implemented as a backend service. No endpoints for credit allocation, payment transaction processing, or repayment-schedule enforcement exist server-side; the `SettlementController` webhook shows where it will plug in.
- **Reporting module** — not implemented as a service; no aggregation/report-generation endpoints beyond raw CSV export of delivery lists.
- **Notifications module** — not implemented; no SMS/email dispatch or event bus (no Kafka/RabbitMQ observed — inter-service calls are synchronous REST today).

In short: **the organizational backbone (auth, membership/RBAC, commodity config, delivery collection) is built and reasonably mature; the financial settlement, reporting, and notification layers described in the FRD are still ahead of the backend**, while the frontend has already started building the batch/disbursement UI against mocks in anticipation of that backend work landing.

---

## 8. Glossary

| Term | Meaning |
|---|---|
| **Cooperative** | A tenant organization onboarded onto UGAAP (e.g. a coffee cooperative), owning one or more branches. |
| **Branch** | A physical collection point/office under a cooperative; the data-isolation boundary. |
| **Input** | Anything issued to a farmer on credit — crop inputs (seeds, fertilizer), livestock, or other stock items (jerry cans, seed bags). |
| **Input Credit Ledger** | Per-farmer running balance of what's owed for inputs received. |
| **Delivery** | A farmer's produce drop-off at a branch, weighed and graded. |
| **Grading Engine** | Automatically compares captured quality parameters against configured tier thresholds to assign a grade (A/B/C/Reject) and price differential. |
| **Outstanding Balance / Net Balance** | Gross delivery pay, minus deductions, minus input offset — an obligation record, not a paid amount. |
| **Reconciliation** | Matching an externally uploaded payment file against the platform's ledger to find exact/partial/no matches (exceptions). |
| **Maker-Checker** | An approval pattern where one user proposes an action and a second must approve it (used for corrections, onboarding, config changes). |
| **RBAC** | Role-Based Access Control — configurable roles and per-module, per-action (View/Create/Edit/Approve/Delete) permissions. |

---

*Sources: `documents/UGAAP BRD.docx`, `documents/UGAAP FRD.docx` (E&M Technology House Ltd, v1.0, April 2026); direct inspection of `frontend/ugaap-portal` and `backend/` as of July 2026.*
