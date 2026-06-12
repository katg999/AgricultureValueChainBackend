# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**UGAAP** (Uganda Agrarian Agrarian Portal) is an agriculture value chain financing platform for Ugandan cooperatives. It manages the full cycle: cooperative onboarding, branch management, farmer registration, produce collections, inventory (inputs/stock), and payment batch processing.

The system is multi-tenant: a **Platform Admin** oversees all cooperatives; each **Cooperative Admin** manages their own branches and farmers; **Branch Staff** handle daily field operations (collections, grading, stock issuance).

---

## Commands

### Frontend (Angular)

Working directory: `frontend/ugaap-portal/`

```bash
npm install          # Install dependencies
ng serve             # Dev server at http://localhost:4200
ng build             # Development build
ng build --configuration production  # Production build
ng test              # Run unit tests (Vitest/Karma)
ng test --code-coverage              # Tests with coverage
ng lint              # Lint
ng generate component features/<name> --standalone  # New component
ng generate service core/services/<name>            # New service
```

### Backend (Spring Boot microservices)

Working directory: `backend/`

```bash
# Build all modules from the parent
./mvnw clean install -DskipTests

# Run individual services (each in its own terminal)
cd eureka-server   && ./mvnw spring-boot:run   # port 8761 — start first
cd config-server   && ./mvnw spring-boot:run   # port 8888
cd api-gateway     && ./mvnw spring-boot:run   # port 8083
cd AuthenticationService && ./mvnw spring-boot:run  # port 8081
cd MembershipService     && ./mvnw spring-boot:run  # port 8082
cd "InventoryService 2"  && ./mvnw spring-boot:run  # port (see application.properties)
```

Required environment variables for each service (set as env vars or in a `.env` equivalent):
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` — PostgreSQL connection
- `REDIS_HOST`, `REDIS_PORT` — Redis (used for OTP and session blacklisting)
- `JWT_SECRET` — must be ≥32 chars
- `INTERNAL_API_KEY` — shared secret for inter-service calls

---

## Architecture

### Backend — Spring Cloud microservices

```
backend/
├── eureka-server/       # Service registry (port 8761) — start first
├── config-server/       # Centralized config (port 8888)
├── api-gateway/         # Spring Cloud Gateway (port 8083) — all frontend traffic goes here
├── shared/              # Shared library: security filters, JWT util, Feign clients, global exception handler
├── AuthenticationService/   # Login, OTP, JWT issuance, session/blacklist via Redis (port 8081)
├── MembershipService/       # Cooperatives, branches, users, roles, permissions (port 8082)
└── InventoryService 2/      # Stock, input allocations, produce collections
```

All services register with Eureka. The gateway routes by path prefix:
- `/auth/**` → AuthenticationService
- `/internal/credentials/**` → AuthenticationService (internal)
- `/api/v1/cooperatives/**`, `/api/v1/branches/**`, `/api/v1/members/**`, `/api/v1/access/**` → MembershipService

**Inter-service calls** use Feign clients in `shared/` (`AuthServiceClient`, `MembershipServiceClient`) with an `X-Internal-API-Key` header validated by `InternalApiKeyFilter`.

**Permission enforcement** on the backend uses AOP: annotate a service method with `@RequiresPermission(module = Permission.Module.X, action = Permission.Action.Y)` and `PermissionCheckAspect` enforces it. Permission strings are `MODULE:ACTION` (e.g. `MEMBERSHIP:APPROVE`).

### Frontend — Angular 18 standalone

```
frontend/ugaap-portal/src/app/
├── core/
│   ├── constants/       # api-endpoints.ts, permissions.ts — single source of truth, never hardcode URLs/strings
│   ├── guards/          # auth-guard.ts
│   ├── interceptors/    # auth (Bearer token), tenant (X-Cooperative-ID / X-Branch-ID), error (401/403)
│   ├── models/          # auth.model.ts, farmer.model.ts
│   └── services/        # session, auth, permission, dashboard-config, toast, tenant, cooperative
├── features/
│   ├── auth/            # Login → OTP → session; forgot-password → reset-otp → set-new-password
│   ├── platform/        # Platform admin: cooperatives list, onboarding wizard, users, roles, settings
│   ├── cooperative/     # Coop admin: dashboard, grade-config, pricing, farmers, branches, collections, finance, inventory, roles
│   └── branch/          # Branch staff: dashboard, collections, farmers, finance/batch, inventory, daily-grading
├── shared/
│   ├── components/      # Reusable UI: Button, Input, Stepper, Modal, Alert, Table, Spinner, Badge, EmptyState, PageHeader, etc.
│   ├── directives/      # has-permission directive
│   └── pipes/           # currency-ugx, truncate
└── layouts/
    ├── auth-layout/     # Wraps auth screens
    └── admin-layout/    # Wraps all protected screens; derives sidebar config from URL prefix
```

### Routing model

Three lazy-loaded route trees under the `AdminLayoutComponent` shell:
- `/platform/**` — Platform admin
- `/cooperative/**` — Cooperative admin
- `/branch/**` — Branch staff

`AdminLayoutComponent` detects the current URL prefix (`platform` / `cooperative` / `branch`) and calls `DashboardConfigService.getConfig(level)` to get the sidebar nav items. This is URL-driven, not role-driven, so a user can be redirected to any area.

### Auth flow

1. `POST /auth/login` → returns `tempToken` → stored in `sessionStorage`
2. `POST /auth/verify-otp` (with `tempToken`) → returns `accessToken` + `refreshToken` + user → stored in `localStorage` via `SessionService`
3. Subsequent requests: `authInterceptor` attaches `Bearer <accessToken>`; `tenantInterceptor` attaches `X-Cooperative-ID` / `X-Branch-ID` from `SessionService` signals

`SessionService` is the only place that touches `localStorage`/`sessionStorage`. All other code reads tokens and user data through it.

### Permission system

- **Frontend**: `PermissionService.can(PERMISSIONS.X)` / `canAny([...])` / `canAll([...])`. Falls back to a role-default map when the JWT carries no explicit permissions (dev mock user, legacy tokens).
- **Backend**: `@RequiresPermission` annotation + AOP aspect in `shared/`.
- Permission strings format: `MODULE:ACTION` — defined in both `core/constants/permissions.ts` (frontend) and `shared/.../Permission.java` (backend). They must stay in sync.

### Design tokens

All colours and fonts are CSS custom properties defined in `src/styles.css`:
- Primary brand: `--primary: #F25D27` (orange)
- Deep secondary: `--secondary: #200B26`
- Fonts: `--font-human: 'Inter'` (UI text), `--font-technical: 'IBM Plex Mono'` (IDs, codes, timestamps)

Always use CSS variables — never hardcode hex values.

### Development mock user

In non-production builds, `SessionService._loadUser()` seeds a `DEV_MOCK_USER` with role `branch` when no real session exists. This lets the UI be developed without a running backend. To test other roles, update `DEV_MOCK_USER.role` locally (do not commit).

---

## Key conventions

- All components are **standalone** (no NgModules).
- Never write raw URL strings — import from `core/constants/api-endpoints.ts`.
- Never read/write `localStorage`/`sessionStorage` directly — go through `SessionService`.
- Never add permission strings as raw string literals — use `PERMISSIONS` constants.
- New sidebar nav items require: a route entry, a `NavItem` in `dashboard-config.service.ts`, and a matching `@case` in `sidebar.component.html` for the icon key.
- Backend services use Lombok (`@RequiredArgsConstructor`, `@Slf4j`, `@Builder`) — always add `lombok` to annotation processor paths.
- Shared library exceptions (`AuthException`, `AccountLockedException`) are caught globally by `GlobalExceptionHandler` — don't catch and re-wrap them in individual services.
