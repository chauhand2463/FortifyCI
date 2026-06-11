# FortifyCI — Comprehensive System Documentation

**Version:** 1.0.0  
**Stack:** Node.js 22 + TypeScript 5.4 | Fastify 4.x | Next.js 14 | PostgreSQL 17 | Redis 7 | MinIO  
**Repository:** `E:\FortifyCI` (monorepo: `scssp/` backend, `frontend/scssp/` frontend)

---

## 1. Overview

FortifyCI is a **container security supply chain platform**. It lets teams:

- **Register** container images from any registry
- **Scan** images for CVEs using **Trivy** (industry-standard vulnerability scanner)
- **Browse** vulnerabilities with severity filtering, CVE search, and detailed metadata
- **Generate SBOMs** (Software Bill of Materials) in **SPDX** and **CycloneDX** formats
- **Produce reports** as **PDF**, **CSV**, or **JSON**
- **Manage users** with **RBAC** (5 roles, 32 granular permissions)
- **Audit** all actions with a full audit trail
- **Monitor** via **Prometheus** metrics and **Grafana** dashboards

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js 14)                         │
│  /dashboard  /images  /scans  /vulnerabilities  /sbom  /reports     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  /api/*  →  Next.js Rewrite Proxy
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Fastify API Gateway (Port 3000)                  │
│  ├── /health  /docs (Swagger)  /metrics (Prometheus)                │
│  ├── /api/v1/auth         — Authentication                          │
│  ├── /api/v1/users        — User management                         │
│  ├── /api/v1/roles        — Role & permission management            │
│  ├── /api/v1/images       — Container image registry                │
│  ├── /api/v1/scans        — Vulnerability scanning                  │
│  ├── /api/v1/vulnerabilities — CVE browsing & search                │
│  ├── /api/v1/sboms         — SBOM generation                        │
│  ├── /api/v1/reports       — Report generation & download           │
│  ├── /api/v1/notifications — Notification management                │
│  ├── /api/v1/audit-logs    — Audit trail                            │
│  ├── /api/v1/dashboard     — Aggregated stats & charts              │
│  └── /api/v1/api-keys      — API key management                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   PostgreSQL 17  │  │    Redis 7       │  │   MinIO (S3)     │
│   (Prisma 5.x)   │  │  (BullMQ 5.x)    │  │  Object Storage  │
│                  │  │                  │  │                  │
│  • users         │  │  • scan queue    │  │  • Report files  │
│  • images        │  │  • sbom queue    │  │  • SBOM exports  │
│  • scans         │  │  • report queue  │  │  • Encrypted     │
│  • vulnerabilities│  │  • notifications │  │    artifacts    │
│  • sboms         │  │                  │  │                  │
│  • reports       │  │                  │  │                  │
│  • notifications │  │                  │  │                  │
│  • audit_logs    │  │                  │  │                  │
│  • api_keys      │  │                  │  │                  │
│  • roles/permissions│  │               │  │                  │
└─────────────────┘  └──────────────────┘  └──────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
                   ┌──────────────────────┐
                   │   Background Worker   │
                   │  (BullMQ Worker)      │
                   │                       │
                   │  • processScanJob     │
                   │  • processSbomJob     │
                   │  • processReportJob   │
                   └──────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Modular Monolith** | All 13 modules in one process; no network overhead, simpler deployment than microservices |
| **Clean Architecture** | Each module: `interfaces/` → `application/` → `domain/` → `infrastructure/` |
| **BullMQ async jobs** | Scans, SBOM, and reports queued via Redis; worker processes them asynchronously |
| **JWT RS256 + refresh rotation** | Asymmetric keys (2048-bit RSA), refresh tokens invalidated on each use |
| **Argon2id** | Configurable memory/time/parallelism cost parameters |
| **AES-256-GCM** | Encrypts sensitive data (report artifacts, credentials) at rest |

---

## 3. Technology Stack

### Backend (`scssp/`)

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Runtime** | Node.js 22 + TypeScript 5.4 | Type-safe server-side execution |
| **Framework** | Fastify 4.x | High-performance HTTP server |
| **ORM** | Prisma 5.x | Type-safe database access & migrations |
| **Database** | PostgreSQL 17 | Primary data store (14 tables, 10 enums) |
| **Queue** | BullMQ 5.x + Redis 7 | Background job processing (3 queues) |
| **Storage** | MinIO (S3-compatible) | Object storage for reports & artifacts |
| **Auth** | `jose` (JWT) + `argon2` | RS256 tokens + Argon2id password hashing |
| **Encryption** | `crypto` (AES-256-GCM) | Data at rest encryption |
| **Validation** | Zod 3.x | Schema validation on all endpoints |
| **Scanner** | Trivy 0.71.0 | Container vulnerability scanning |
| **PDF** | PDFKit 0.15 | PDF report generation |
| **Email** | Nodemailer 6.x | SMTP email notifications |
| **Logging** | Pino 8.x | Structured JSON logging |
| **Monitoring** | Prometheus + Grafana | Metrics collection & visualization |
| **Testing** | Vitest 1.x | Unit & integration tests |
| **API Docs** | Swagger (Fastify Swagger) | Auto-generated OpenAPI docs at `/docs` |
| **Cron** | node-cron 3.x | Scheduled tasks |

### Frontend (`frontend/scssp/`)

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | Server-side rendering + API proxy |
| **UI** | React 18 + TailwindCSS 3.4 | Component-based UI with utility styling |
| **State** | Zustand 5.x | Client state (auth tokens, sidebar) |
| **Data Fetching** | TanStack React Query 5.x | Server state (caching, polling, mutations) |
| **Icons** | Lucide React | SVG icon library |
| **Toast** | Sonner 1.7 | Notification toasts |
| **Animation** | Framer Motion 11.x | Page transitions & UI animations |

### Infrastructure

| Service | Image | Ports | Persistence |
|---------|-------|-------|-------------|
| PostgreSQL | `postgres:17-alpine` | 5434:5432 | `postgres_data` volume |
| Redis | `redis:7-alpine` (appendonly) | 6380:6379 | `redis_data` volume |
| MinIO | `minio/minio:latest` | 9000, 9001 | `minio_data` volume |
| Prometheus | `prom/prometheus` | 9090 | Config from `docker/prometheus/` |
| Grafana | `grafana/grafana` | 3001 | Dashboards from `docker/grafana/` |

---

## 4. Database Schema

### Enums (10)

| Enum | Values |
|------|--------|
| `RoleName` | `SUPER_ADMIN`, `ADMIN`, `DEVELOPER`, `SECURITY_ANALYST`, `VIEWER` |
| `PermissionName` | 32 granular permissions across all modules |
| `ScanStatus` | `PENDING`, `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`, `TIMEOUT` |
| `Severity` | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `UNKNOWN` |
| `SBOMFormat` | `SPDX`, `CYCLONEDX` |
| `ReportFormat` | `PDF`, `CSV`, `JSON` |
| `ReportStatus` | `GENERATING`, `COMPLETED`, `FAILED` |
| `NotificationType` | `SCAN_COMPLETED`, `VULNERABILITY_FOUND`, `REPORT_READY`, `SYSTEM_ALERT` |
| `JobType` | `SCAN_IMAGE`, `GENERATE_SBOM`, `GENERATE_REPORT`, `SEND_NOTIFICATION` |
| `JobStatus` | `PENDING`, `ACTIVE`, `COMPLETED`, `FAILED`, `DELAYED`, `PAUSED` |

### Models (14 tables)

```
User ──1:N──> Image          User ──1:N──> Scan
User ──1:N──> SBOM           User ──1:N──> Report
User ──1:N──> Notification   User ──1:N──> AuditLog
User ──1:N──> Session        User ──1:N──> ApiKey
User ──N:1──> Role           Role ──N:N──> Permission  (via RolePermission)
Image ──1:N──> Scan          Scan ──1:N──> Vulnerability
Image ──1:N──> SBOM          Scan ──1:1──> Job  (ScanJob)
```

---

## 5. Features & Flows

### 5.1 Image Registration & Scanning Flow

```
User                          Frontend                     Backend API                   Worker
 │                              │                              │                          │
 │  Register Image              │                              │                          │
 │ ───────────────────────────> │  POST /api/v1/images         │                          │
 │                              │ ───────────────────────────> │                          │
 │                              │                              │  Save image record        │
 │                              │ <─────────────────────────── │                          │
 │  Scan Image                  │                              │                          │
 │ ───────────────────────────> │  POST /api/v1/scans          │                          │
 │                              │ ───────────────────────────> │                          │
 │                              │                              │  Create scan (PENDING)    │
 │                              │                              │  Queue job to BullMQ      │
 │                              │ <─── scanId ─────────────── │                          │
 │                              │                              │                          │
 │                              │                              │   scan queue              │
 │                              │                              │ ────────────────────────> │
 │                              │                              │                          │
 │  Poll status (every 5s)      │                              │                          │
 │ <══════════════════════════> │  GET /api/v1/scans/:id       │                          │
 │                              │ ───────────────────────────> │                          │
 │                              │                              │                          │
 │                              │                              │                          │ Run Trivy CLI
 │                              │                              │                          │ ────────> imageRef
 │                              │                              │                          │
 │                              │                              │                          │ Parse results
 │                              │                              │                          │ Create Vulnerability records
 │                              │                              │                          │ Update scan → COMPLETED
 │                              │                              │                          │ Create notification
 │                              │                              │                          │ Send email
 │                              │                              │                          │
 │                              │                              │                          │
 │  See results                 │                              │                          │
 │ <─────────────────────────── │  GET /api/v1/vulnerabilities │                          │
 │                              │ ───────────────────────────> │                          │
```

The scan worker (in `scssp/src/modules/job/application/worker.ts`):
1. Receives `{ scanId, imageId }` from BullMQ
2. Updates scan status → `RUNNING`, progress 10%
3. Builds `imageRef` from `registry/repository:tag`
4. Runs `trivy image --format json <imageRef>` (wrapped in `scssp/src/shared/scanner/trivy.ts`)
5. Parses the JSON output, iterates vulnerabilities
6. Upserts each vulnerability into the `vulnerabilities` table
7. Updates scan → `COMPLETED`, progress 100%
8. Records audit log entry (`SCAN_COMPLETED`)
9. Creates a notification record + optionally sends email
10. On failure: retries up to `maxRetries` (3) with exponential backoff

### 5.2 SBOM Generation Flow

```
User selects image + format (SPDX/CycloneDX)
  → POST /api/v1/sboms
  → Backend creates SBOM record (status PENDING)
  → Queue job to 'sbom' queue in BullMQ
  → Worker picks up job
  → Calls generator (spdx.ts or cyclonedx.ts)
  → Generator reads image metadata + vulnerabilities
  → Produces structured SBOM JSON following the spec
  → Updates SBOM record: content, packageCount, version
  → Records audit log
  → Frontend displays in SBOM Explorer (Packages/Licenses/Dependencies tabs)
```

### 5.3 Report Generation & Download Flow

```
User opens /reports page
  → Selects scan (optional, defaults to latest)
  → Selects format: PDF / CSV / JSON
  → Clicks Generate
  → POST /api/v1/reports  { title, format, scanId, parameters }
  → Backend:
      1. Creates report record (status: GENERATING)
      2. Queue job to 'report' queue in BullMQ
      3. Returns report ID
  → Frontend polls every 3s (auto-refresh when status = generating)

Worker processes job:
  → Finds report record from DB
  → Updates status → GENERATING
  → Dispatches to:
       generatePdfReport()   (scssp/src/shared/reporting/pdf.ts)
       generateCsvReport()   (scssp/src/shared/reporting/csv.ts)
       generateJsonReport()  (scssp/src/shared/reporting/json.ts)
  → Each generator:
      1. Queries scan + vulnerabilities from DB
      2. Fetches most recent scan if none specified
      3. Writes file to /app/reports/{uuid}.{ext}
      4. Returns { filePath, fileSize }
  → Updates report: status=COMPLETED, filePath, fileSize, generatedAt
  → Creates notification (REPORT_READY)

User clicks Download:
  → GET /api/v1/reports/:id/download
  → Backend verifies file exists on disk (fs.existsSync)
  → Sets Content-Type (application/pdf | text/csv | application/json)
  → Sets Content-Disposition: attachment; filename="..."
  → Streams file via fs.createReadStream → reply.send(stream)
  → Frontend:
      1. Fetches as blob with JWT Bearer token
      2. Creates object URL via URL.createObjectURL(blob)
      3. Programmatic <a> click triggers browser save dialog
```

### 5.4 Authentication & Authorization Flow

```
Login:
  User submits credentials → POST /api/v1/auth/login
  → Backend verifies against Argon2id hash
  → Generates:
      - Access token (RS256 signed JWT, 15min expiry)
      - Refresh token (stored in DB, returned as HTTP-only cookie + body)
  → Frontend stores access token in Zustand (persisted to localStorage)

Every API request:
  → Frontend reads token from Zustand store
  → Attaches Authorization: Bearer <token> header
  → Fastify 'authenticate' middleware:
      1. Extracts Bearer token
      2. Verifies RS256 signature using public key (jose library)
      3. Checks token type === 'access'
      4. Checks issuer + audience
      5. Attaches decoded payload to request.user
  → 'authorize('PERMISSION')' middleware:
      Checks request.user.permissions includes required permission
      Throws 403 Forbidden if missing

Token Refresh (automatic on 401):
  → Frontend catches 401 from apiRequest()
  → Sends POST /api/v1/auth/refresh (cookie or body)
  → Backend:
      1. Finds refresh token in DB
      2. Validates expiry
      3. Rotates: deletes old token, creates new one
      4. Returns new access + refresh tokens
  → Frontend retries original request with new token
  → If refresh fails → redirect to /login
```

### 5.5 RBAC Permission System

The system defines **5 roles** with **32 granular permissions**:

| Module | Permissions |
|--------|-------------|
| Users | `USER_CREATE`, `USER_READ`, `USER_UPDATE`, `USER_DELETE` |
| Roles | `ROLE_CREATE`, `ROLE_READ`, `ROLE_UPDATE`, `ROLE_DELETE` |
| Images | `IMAGE_REGISTER`, `IMAGE_READ`, `IMAGE_DELETE` |
| Scans | `SCAN_CREATE`, `SCAN_READ`, `SCAN_CANCEL` |
| Vulnerabilities | `VULNERABILITY_READ`, `VULNERABILITY_EXPORT` |
| SBOMs | `SBOM_CREATE`, `SBOM_READ`, `SBOM_DELETE` |
| Reports | `REPORT_CREATE`, `REPORT_READ`, `REPORT_DOWNLOAD`, `REPORT_DELETE` |
| Notifications | `NOTIFICATION_READ`, `NOTIFICATION_MANAGE` |
| Audit Logs | `AUDIT_LOG_READ`, `AUDIT_LOG_EXPORT` |
| Jobs | `JOB_READ`, `JOB_CANCEL` |
| API Keys | `API_KEY_CREATE`, `API_KEY_READ`, `API_KEY_DELETE` |

Default role permissions:

| Role | Permissions |
|------|-------------|
| **SUPER_ADMIN** | All 32 |
| **ADMIN** | All 32 |
| **DEVELOPER** | Read on most modules + IMAGE_REGISTER + SCAN_CREATE |
| **SECURITY_ANALYST** | Read on vulns/scans + REPORT_CREATE/READ/DOWNLOAD + SBOM_CREATE/READ |
| **VIEWER** | Read-only on images/scans/vulns/reports/sboms/notifications |

---

## 6. Frontend Pages & Routes

| Route | Page | Key Features |
|-------|------|-------------|
| `/` | Landing | Marketing page with stats, features, CTA |
| `/login` | Auth | Login / Register / Forgot Password (toggle tabs) |
| `/dashboard` | Dashboard | 6 stat cards, severity pie chart, 7-day trend, monthly stack, recent scans, images at risk |
| `/images` | Images | Image registry table with search, pagination, quick scan button |
| `/images/[id]` | Image Detail | Full image info + scan history |
| `/scans` | Scans | Scan history with status dots, auto-refresh active scans every 5s |
| `/vulnerabilities` | CVE Browser | Severity tabs (All/Critical/High/Medium/Low), search by CVE, pagination |
| `/sbom` | SBOM Explorer | Select image + format, then browse Packages/Licenses/Dependencies tabs |
| `/reports` | Reports | Generate form with type + scan selector + format; downloadable listing with auto-refresh |
| `/notifications` | Notifications | List with read/unread state, mark read |
| `/settings` | Settings | Profile tab, Security (password change), API Keys (CRUD), Preferences |
| `/reset-password` | Password Reset | Token-based password reset form |

### Frontend Data Flow

```
Next.js App Router
  → Layout.tsx (DM Sans font, Providers, Shell component)
     → Providers.tsx (React Query provider with QueryClient)
        → Shell.tsx (auth-aware: checks token, then renders Sidebar + Topnav + Page)
           → Page components use hooks from use-queries.ts
              → hooks call services from api.ts
                 → api.ts uses apiRequest() which:
                    1. Gets token from localStorage (Zustand persist)
                    2. Adds Authorization header
                    3. Fetches /api/v1/... through Next.js rewrite proxy
                    4. On 401: attempts refresh, if fails → redirect /login
```

### API Client (`services/api.ts`)
- **22 exported methods** covering all backend endpoints
- Automatic token refresh on 401 (single retry with rotated token)
- 6 transform functions normalize backend snake_case → frontend camelCase
- Blob download pattern for report files

### State Management
- **Zustand** — `useAuthStore` (token, user, role, permissions) persisted to localStorage
- **React Query** — All server data with cache invalidation on mutations
- **Auto-refetch** — Reports poll every 3s during generation; scans poll every 5s while active; notifications poll every 30s

---

## 7. API Endpoints (Complete List)

### Auth (`/api/v1/auth`)
| Method | Path | Auth | Rate Limit | Purpose |
|--------|------|------|------------|---------|
| POST | `/register` | — | 5/min | Register new user |
| POST | `/login` | — | 10/min | Login (returns access + refresh tokens) |
| POST | `/refresh` | Cookie | — | Rotate refresh token |
| POST | `/logout` | Bearer | — | Clear session |
| POST | `/forgot-password` | — | 3/min | Send password reset email |
| POST | `/reset-password` | — | 5/min | Reset with token |
| POST | `/change-password` | Bearer | — | Change own password |

### Users (`/api/v1/users`)
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| POST | `/` | USER_CREATE | Create user |
| GET | `/` | USER_READ | List (paginated) |
| GET | `/me` | — | Current user profile |
| PATCH | `/me` | — | Update own profile |
| GET | `/:id` | USER_READ | Get user by ID |
| PATCH | `/:id` | USER_UPDATE | Update user |
| DELETE | `/:id` | USER_DELETE | Soft delete |

### Roles (`/api/v1/roles`)
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| POST | `/` | ROLE_CREATE | Create role |
| GET | `/` | ROLE_READ | List |
| GET | `/:id` | ROLE_READ | Get by ID |
| PATCH | `/:id` | ROLE_UPDATE | Update role |
| DELETE | `/:id` | ROLE_DELETE | Delete |

### Permissions (`/api/v1/permissions`)
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| GET | `/` | ROLE_READ | List all permissions |

### Images (`/api/v1/images`)
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| POST | `/` | IMAGE_REGISTER | Register image |
| GET | `/` | IMAGE_READ | List (paginated, filtered) |
| GET | `/:id` | IMAGE_READ | Get by ID |
| DELETE | `/:id` | IMAGE_DELETE | Soft delete |

### Scans (`/api/v1/scans`)
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| POST | `/` | SCAN_CREATE | Create + queue scan |
| GET | `/` | SCAN_READ | List (paginated) |
| GET | `/:id` | SCAN_READ | Get by ID |
| POST | `/:id/cancel` | SCAN_CANCEL | Cancel scan |

### Vulnerabilities (`/api/v1/vulnerabilities`)
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| GET | `/` | VULNERABILITY_READ | Query (filter severity, search CVE) |
| GET | `/:id` | VULNERABILITY_READ | Get by ID |
| GET | `/cve/:cveId` | VULNERABILITY_READ | Search by CVE ID |
| GET | `/scan/:scanId` | VULNERABILITY_READ | All vulns for a scan |
| GET | `/scan/:scanId/summary` | VULNERABILITY_READ | Severity counts |

### SBOMs (`/api/v1/sboms`)
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| POST | `/` | SBOM_CREATE | Generate SBOM |
| GET | `/` | SBOM_READ | List |
| GET | `/:id` | SBOM_READ | Get by ID |
| DELETE | `/:id` | SBOM_DELETE | Delete |

### Reports (`/api/v1/reports`)
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| POST | `/` | REPORT_CREATE | Create + queue report |
| GET | `/` | REPORT_READ | List |
| GET | `/:id` | REPORT_READ | Get by ID |
| GET | `/:id/download` | REPORT_DOWNLOAD | Stream file (PDF/CSV/JSON) |
| DELETE | `/:id` | REPORT_DELETE | Delete |

### Notifications (`/api/v1/notifications`)
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| GET | `/` | NOTIFICATION_READ | List |
| GET | `/unread-count` | NOTIFICATION_READ | Unread count |
| PATCH | `/:id/read` | NOTIFICATION_MANAGE | Mark as read |
| POST | `/read-all` | NOTIFICATION_MANAGE | Mark all read |

### Audit Logs (`/api/v1/audit-logs`)
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| GET | `/` | AUDIT_LOG_READ | Search (action, entity, user, date range) |
| GET | `/user/:userId` | AUDIT_LOG_READ | By user |

### Dashboard (`/api/v1/dashboard`)
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| GET | `/` | VULNERABILITY_READ | Stats + chart data |

### API Keys (`/api/v1/api-keys`)
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| POST | `/` | API_KEY_CREATE | Create API key |
| GET | `/` | API_KEY_READ | List |
| DELETE | `/:id` | API_KEY_DELETE | Delete |

### System
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check (status, uptime, timestamp) |
| GET | `/metrics` | Prometheus metrics |
| GET | `/docs` | Swagger UI |

---

## 8. Background Jobs (BullMQ)

Three separate BullMQ queues on Redis:

| Queue | Job Data | Worker | Concurrency | Retries |
|-------|----------|--------|-------------|---------|
| **scan** | `{ scanId, imageId }` | `processScanJob` | Configurable | 3 (exponential backoff 5s) |
| **sbom** | `{ sbomId, imageId, format }` | `processSbomJob` | Configurable | 3 |
| **report** | `{ reportId, format }` | `processReportJob` | Configurable | 3 |

### processScanJob — Detailed Steps
1. Look up image record
2. Update scan: status `RUNNING`, progress 10%
3. Build `imageRef = registry/repository:tag`
4. Execute `trivy image --format json registry/repo:tag`
5. Parse JSON results → array of `TrivyVulnerability`
6. For each vulnerability:
   - Build CWE IDs array from `metadata.CweIDs`
   - Extract CVSS score from `metadata.CVSS.score`
   - Upsert into `vulnerabilities` table linked to scan
   - Update progress incrementally
7. Update scan: status `COMPLETED`, progress 100%
8. Record audit log
9. Create notification + send email
10. On any failure → increment retry, mark `FAILED` after max retries

---

## 9. Environment Variables

### Required (minimal setup)
| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `REDIS_HOST` | `localhost` | Redis host |
| `MINIO_ENDPOINT` | `localhost` | MinIO host |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO credentials |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO credentials |
| `ENCRYPTION_KEY` | — | 32+ char AES-256-GCM key |
| `JWT_PRIVATE_KEY_PATH` | `keys/private.pem` | RSA private key path |
| `JWT_PUBLIC_KEY_PATH` | `keys/public.pem` | RSA public key path |

### Optional
| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | Backend listen port |
| `HOST` | `0.0.0.0` | Backend listen host |
| `LOG_LEVEL` | `info` | Pino log level |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (1 min) |
| `JWT_ACCESS_TOKEN_EXPIRY` | `15m` | Access token TTL |
| `JWT_REFRESH_TOKEN_EXPIRY` | `7d` | Refresh token TTL |
| `ARGON2_MEMORY_COST` | `19456` | Argon2 memory in KiB |
| `ARGON2_TIME_COST` | `2` | Argon2 iterations |
| `SMTP_HOST` | — | Email server for notifications |
| `PROMETHEUS_ENABLED` | `false` | Enable metrics endpoint |
| `WORKER_CONCURRENCY` | `5` | Parallel job processing |
| `REPORT_OUTPUT_DIR` | `./reports` | Where report files are stored |

---

## 10. Security Features

1. **Argon2id password hashing** — Configurable memory (19MB), time (2), parallelism (1)
2. **JWT RS256** — 2048-bit RSA keys, asymmetric signing
3. **Refresh token rotation** — Each refresh invalidates the previous token
4. **AES-256-GCM** — Encrypts sensitive data (artifacts, credentials)
5. **Helmet headers** — CSP (disabled by default), X-Frame-Options, HSTS, etc.
6. **Rate limiting** — Per-endpoint configurable limits (e.g., login: 10/min)
7. **Zod validation** — All request bodies validated before processing
8. **HTTP-only cookies** — Refresh tokens stored in secure cookies
9. **Authorization checks** — Two layers: JWT auth + granular permission check
10. **Audit logging** — Every critical action logged with user, IP, timestamp
11. **Soft deletes** — Images use `deletedAt` to preserve audit trail

---

## 11. Monitoring (Prometheus + Grafana)

### Metrics Exposed (at `/metrics`)
| Metric | Type | Labels |
|--------|------|--------|
| `fortifyci_info` | Gauge | version, node_env |
| `fortifyci_users_total` | Gauge | — |
| `fortifyci_images_total` | Gauge | — |
| `fortifyci_scans_total` | Gauge | — |
| `fortifyci_scans_by_status` | Gauge | status |
| `fortifyci_vulnerabilities_total` | Gauge | — |
| `fortifyci_vulnerabilities_by_severity` | Gauge | severity |
| `fortifyci_sboms_total` | Gauge | — |
| `fortifyci_reports_total` | Gauge | — |
| `fortifyci_uptime_seconds` | Counter | — |

### Grafana Dashboards
- Preconfigured Prometheus datasource
- Provisioned dashboards in `docker/grafana/dashboards/`
- Additional exporters: `node-exporter` (host), `postgres-exporter` (PG), `redis-exporter` (Redis)

---

## 12. Deployment

### Production Docker Compose (root `docker-compose.yml`)
```
Services:
  postgres:17-alpine    →  5434:5432  (volume: postgres_data)
  redis:7-alpine        →  6380:6379  (volume: redis_data)
  minio:latest          →  9000,9001  (volume: minio_data)
  backend (Dockerfile)  →  3000:3000  (volumes: trivy_cache, report_output)
  frontend (Dockerfile) →  4000:4000

Network: fortifyci-network (bridge)
```

### Monitoring Stack (`scssp/docker/docker-compose.yml`)
```
Additional services:
  prometheus    →  9090
  grafana       →  3001
  node-exporter →  9100
  postgres-exporter
  redis-exporter
```

### Commands
```bash
npm run docker:up          # Start all services
npm run docker:rebuild     # Rebuild + restart
npm run docker:seed        # Reseed database
npm run dev                # Dev mode (hot reload)
npm run build:backend      # Production build
npm run build:frontend     # Production build
```

### Default Credentials
| Service | URL | Credentials |
|---------|-----|-------------|
| App | http://localhost:4000 | `admin@fortifyci.local` / `Admin123!@#` |
| Swagger | http://localhost:3000/docs | — |
| MinIO Console | http://localhost:9001 | `minioadmin` / `minioadmin` |
| Grafana | http://localhost:3001 | `admin` / `grafana_admin` |
| Prometheus | http://localhost:9090 | — |

---

## 13. Project Directory Structure

```
E:\FortifyCI/
├── README.md                         # Quick start guide
├── AGENTS.md                         # InsForge BaaS integration config
├── FORTIFYCI_COMPREHENSIVE_DOC.md    # ← This document
├── docker-compose.yml                # Production compose (5 services)
├── package.json                      # Root orchestration scripts
├── .gitignore
│
├── scssp/                            # BACKEND
│   ├── Dockerfile                    # Production image (Node 22 + Trivy)
│   ├── package.json                  # Dependencies
│   ├── tsconfig.json                 # Path aliases
│   ├── .env.example                  # 78 env vars documented
│   ├── prisma/
│   │   ├── schema.prisma             # 14 models, 10 enums
│   │   └── seed.ts                   # Seeds roles, permissions, admin user
│   ├── keys/                         # RSA key pair (generated at setup)
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── docker/
│   │   ├── docker-compose.yml        # Monitoring stack (Prometheus + Grafana)
│   │   ├── prometheus/prometheus.yml
│   │   └── grafana/
│   │       ├── datasources/
│   │       └── dashboards/
│   └── src/
│       ├── main.ts                   # Entry point (plugins, routes, workers)
│       ├── modules/
│       │   ├── auth/                 # interfaces/ application/ domain/
│       │   ├── user/                 # interfaces/ application/ domain/
│       │   ├── role/                 # interfaces/ application/ domain/
│       │   ├── permission/           # interfaces/ application/ domain/
│       │   ├── image/                # interfaces/ application/ domain/
│       │   ├── scan/                 # interfaces/ application/ domain/
│       │   ├── vulnerability/        # interfaces/ application/ domain/
│       │   ├── sbom/                 # interfaces/ application/ domain/
│       │   ├── report/               # interfaces/ application/ domain/
│       │   ├── notification/         # interfaces/ application/ domain/
│       │   ├── audit/                # interfaces/ application/ domain/
│       │   ├── dashboard/            # interfaces/ application/ domain/
│       │   ├── api-key/              # interfaces/ application/ domain/
│       │   └── job/                  # application/worker.ts
│       └── shared/
│           ├── config/env.ts         # Zod env validation
│           ├── database/             # prisma.ts, redis.ts (singletons)
│           ├── middleware/auth.ts     # authenticate + authorize
│           ├── errors/index.ts       # 8 error classes
│           ├── queue/index.ts        # BullMQ factory
│           ├── scanner/trivy.ts      # Trivy CLI wrapper
│           ├── sbom/generator.ts     # SPDX + CycloneDX generators
│           ├── reporting/            # pdf.ts, csv.ts, json.ts
│           ├── notifications/email.ts # Nodemailer SMTP
│           ├── storage/minio.ts      # S3-compatible storage
│           ├── monitoring/metrics.ts # Prometheus metrics
│           └── utils/                # jwt.ts, encryption.ts, logger.ts
│
└── frontend/scssp/                   # FRONTEND
    ├── Dockerfile                    # Multi-stage Next.js build
    ├── package.json                  # Dependencies
    ├── next.config.mjs               # Rewrites: /api/* → backend
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── page.tsx              # Landing page
        │   ├── layout.tsx            # Root layout + providers
        │   ├── providers.tsx         # React Query provider
        │   ├── globals.css
        │   ├── loading.tsx
        │   ├── error.tsx
        │   ├── not-found.tsx
        │   ├── login/page.tsx
        │   ├── dashboard/page.tsx
        │   ├── images/page.tsx
        │   ├── images/[id]/page.tsx
        │   ├── scans/page.tsx
        │   ├── vulnerabilities/page.tsx
        │   ├── sbom/page.tsx
        │   ├── reports/page.tsx
        │   ├── notifications/page.tsx
        │   ├── settings/page.tsx
        │   └── reset-password/page.tsx
        ├── components/
        │   ├── auth/guards.tsx
        │   ├── images/register-image-modal.tsx
        │   ├── layout/               # shell, sidebar, topnav, breadcrumbs, command-palette
        │   ├── shared/page-transition.tsx
        │   └── ui/                   # badge, button, card, input, label, modal, select,
        │                              #   textarea, shared (spinner/error/tabs/pagination),
        │                              #   status-dot, table
        ├── hooks/use-queries.ts      # 15 React Query hooks
        ├── store/                    # Zustand stores (auth, sidebar, command palette)
        ├── lib/utils.ts              # cn(), formatDate(), severityColor(), etc.
        ├── services/api.ts           # 22 API methods, 6 transform functions
        └── types/index.ts            # 14 TypeScript interfaces
```

---

## 14. Design Patterns Applied

| Pattern | Where | Benefit |
|---------|-------|---------|
| **Modular Monolith** | 13 modules in one process | Simpler than microservices, clear boundaries |
| **Clean Architecture** | Each module has 4 layers | Separation of concerns, testability |
| **Repository Pattern** | Prisma ORM abstracts DB | Swap databases without changing business logic |
| **CQRS-like** | Separate read/write endpoints | Optimized queries for reads |
| **Event-driven** | BullMQ background jobs | Async processing, retry, decoupling |
| **Factory Pattern** | `getQueue(name)` | Single queue instances, reuse |
| **Singleton** | Prisma + Redis clients | Connection pooling, no leaks |
| **Middleware Chain** | Fastify hooks | Reusable auth/validation/rate-limit |
| **Strategy Pattern** | Report generators (PDF/CSV/JSON) | Add new formats without changing worker |
| **DTO Pattern** | Zod schemas in domain/ | Type safety across boundaries |
| **Error Hierarchy** | `AppError` base class | Consistent error responses |

---

*Generated: June 2026 — For questions, contact the development team.*
