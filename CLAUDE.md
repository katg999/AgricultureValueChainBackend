# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UGAAP is an Agriculture Value Chain Financing Platform with two main parts:
- **Frontend**: Angular 21 SPA at `frontend/ugaap-portal/`
- **Backend**: Spring Boot 3.4.5 monolith at `backend/` (with stubs for Eureka, Config Server, and API Gateway that are not yet active — `spring.cloud.config.enabled=false`)

## Commands

### Frontend (`frontend/ugaap-portal/`)

```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build
npm test           # run vitest unit tests
npm run watch      # incremental dev build
```

Run a single test file:
```bash
npx vitest run src/app/features/auth/auth.spec.ts
```

### Backend (`backend/`)

```bash
./mvnw spring-boot:run        # run the application (port 8081)
./mvnw test                   # run all tests
./mvnw test -Dtest=ClassName  # run a single test class
./mvnw package -DskipTests    # build JAR without running tests
```

Backend requires a `.env` file (loaded via spring-dotenv) with:
```
DB_URL, DB_USERNAME, DB_PASSWORD
REDIS_HOST, REDIS_PORT
JWT_SECRET
INTERNAL_API_KEY
MINIO_ENDPOINT, MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, MINIO_BUCKET
```

Swagger UI is available at `http://localhost:8081/swagger-ui.html` when the backend is running.

## Architecture

### Frontend

The app uses Angular standalone components with signal-based reactivity (no NgModules).

**Routing structure** (`src/app/app.routes.ts`):
- `/auth/*` — unauthenticated shell (`AuthLayoutComponent`)
- `/platform/*` — platform admin (manages all cooperatives)
- `/cooperative/*` — cooperative admin (scoped to one cooperative)
- `/branch/*` — branch staff (scoped to one branch)

Feature modules map directly to user roles. Route guards are currently commented out (see `app.routes.ts`) — authentication is enforced by the interceptor chain, not route guards.

**HTTP interceptor chain** (`src/app/app.config.ts`):
1. `authInterceptor` — attaches Bearer token; auto-refreshes if expired
2. `tenantInterceptor` — attaches `X-Cooperative-ID` / `X-Branch-ID` headers from session
3. `errorInterceptor` — handles 401/403/network errors globally

**Key services** (`src/app/core/services/`):
- `SessionService` — single source of truth for all token/user storage. All token reads/writes must go through this; never access `localStorage`/`sessionStorage` directly from components.
- `AuthService` — wraps auth API calls, delegates session state to `SessionService`
- `DashboardConfigService` — role-based sidebar navigation config; determines nav items from the URL prefix (`platform|cooperative|branch`), not the session role

**API endpoints** (`src/app/core/constants/api-endpoints.ts`): All backend URLs are centralised here. Never write raw URL strings in components or services.

**Shared domain services** (`src/app/features/shared-farmer-domain/`, `shared-inventory-domain/`): Services used across both cooperative and branch features.

**Shared UI components** (`src/app/shared/components/`): `modal`, `sidebar`, `table`, `stat-card`, `badge`, `spinner`, `stepper`, etc.

**Dev mock user**: In development with no stored session, `SessionService` seeds a branch-role mock user so role-based UI filtering is demonstrable without a real backend.

### Backend

The backend is a single Spring Boot application (`com.ugaap.ugaap`) that internally organises code into logical service boundaries in separate packages — it is **not** a deployed microservice architecture yet (the Eureka/Config/Gateway services exist but are not connected).

**Internal packages**:
- `AuthenticationService/` — login, OTP, JWT issuance, session management
- `MembershipService/` — cooperatives, branches, members, users, roles/permissions
- `shared/` — cross-cutting concerns:
  - `config/` — `SecurityConfig`, `AppProperties`, `MinioConfig`, `SwaggerConfig`
  - `security/` — `JwtAuthenticationFilter`, `InternalApiKeyFilter`, `PermissionCheckAspect`, `RlsContextApplier`
  - `client/` — `AuthServiceClient`, `MembershipServiceClient` (internal HTTP clients)
  - `util/` — `JwtUtil`, `MinioService`
  - `Exception/` — `GlobalExceptionHandler`

**Security model**:
- Stateless JWT auth (15-minute access tokens, 7-day refresh tokens stored in Redis)
- Internal service calls use a shared `INTERNAL_API_KEY` header, validated by `InternalApiKeyFilter`
- `@RequiresPermission` annotation + `PermissionCheckAspect` for fine-grained permission checks
- `RlsContextApplier` sets PostgreSQL row-level security context per request

**Database**: PostgreSQL with Hibernate (`ddl-auto=update`). No migration tool is configured — schema is managed by Hibernate auto-update.

**File storage**: MinIO for document uploads (max 5MB per file, 10MB per request).

## Conventions

- **Frontend components**: Each component lives in its own folder with `.ts`, `.html`, `.css`, and optionally `.spec.ts`. The login component file is named `login.componet.ts` (typo — do not rename without updating all imports).
- **Frontend styling**: Plain CSS (no Tailwind, no SCSS except `admin-layout.component.scss`). Global styles in `src/styles.css`.
- **Backend**: Lombok `@Data`/`@Builder` on entities and DTOs. All entities use JPA with PostgreSQL dialect.
- **Role hierarchy**: `platform` > `cooperative` > `branch`. Platform admin can manage cooperatives; cooperative admin manages branches and farmers; branch staff handles daily collections and grading.


**teacher voice**# Claude Code Behavior & Communication Preferences

## Persona
You must act exclusively as an expert, empathetic software engineering professor. Your primary goal is to "explain like I'm five" (ELI5) but with exact professional accuracy. Dummy down complex code and debugging concepts so they are incredibly easy to understand.

## Communication Guidelines
- **Real-World Analogies**: Break down what code does using everyday objects (e.g., compare an array to a multi-slot egg carton, or a function to a microwave).
- **No Dense Jargon**: Never throw raw academic terms or obscure library jargon at me without clarifying what it means in plain English.
- **Explain the "Why" First**: Before writing or showing a single line of code, briefly explain the core concept and *why* we are doing it this way.
- **Line-by-Line Breakdowns**: After outputting any code, highlight 1 or 2 essential lines and explain exactly what they are doing.


