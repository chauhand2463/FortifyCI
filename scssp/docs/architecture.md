# FortifyCI Architecture Documentation

## 1. System Overview

FortifyCI is a modular monolith backend that provides end-to-end security for container images in the software supply chain. It integrates vulnerability scanning, SBOM generation, reporting, and notification services into a unified API.

## 2. Architecture Style: Modular Monolith

FortifyCI follows a **Modular Monolith** architecture with **Clean Architecture** and **Domain-Driven Design** principles.

```
┌──────────────────────────────────────────────────────────────────┐
│                         API Gateway (Fastify)                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ Auth │ │ User │ │Image │ │ Scan │ │ Vuln │ │ SBOM │ │Report│  │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘  │
│     │         │        │        │        │        │        │     │
│  ┌──┴─────────┴────────┴────────┴────────┴────────┴────────┴──┐  │
│  │                   Shared Kernel                            │  │
│  │  Config │ Errors │ Middleware │ Queue │ Utils │ Encryption │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                    │                    │
         ┌──────────┴──┐          ┌─────┴──────┐
         │  PostgreSQL  │          │    Redis    │
         │   (Prisma)   │          │  (BullMQ)   │
         └─────────────┘          └─────────────┘
```

### 2.1 Layer Architecture (per module)

Each module follows Clean Architecture with 4 layers:

```
┌─────────────────────────────────────────────┐
│              Interfaces Layer                │
│      Fastify Routes / Controllers           │
│         Input validation (Zod)              │
├─────────────────────────────────────────────┤
│            Application Layer                 │
│          Use Cases / Services               │
│         Orchestration Logic                 │
├─────────────────────────────────────────────┤
│             Domain Layer                     │
│        Entities / Value Objects             │
│           Business Rules                     │
├─────────────────────────────────────────────┤
│          Infrastructure Layer                │
│    Prisma Repositories / External APIs      │
│       Queue Producers / Workers             │
└─────────────────────────────────────────────┘
```

## 3. Module Descriptions

### 3.1 Authentication Module

**Purpose**: Handle user identity and access control.

**Key Features**:
- Registration with Argon2id password hashing
- JWT RS256 access tokens (15min expiry)
- Refresh token rotation (7-day expiry, invalidated on use)
- Secure HTTP-only cookie for refresh tokens
- Login attempts rate limited (10/min)

**Token Flow**:
```
Client                    Server
  │                        │
  │── POST /auth/login ──► │
  │                        │── Verify credentials
  │                        │── Generate access + refresh tokens
  │◄── accessToken (body)──│
  │◄── refreshToken (cookie)│
  │                        │
  │── POST /auth/refresh ──►│
  │   (cookie with RT)     │── Verify refresh token
  │                        │── Rotate refresh token
  │◄── new accessToken ────│
  │◄── new refreshToken ───│
```

### 3.2 User Management Module

**Purpose**: Manage users, roles, and permissions.

**Key Features**:
- Full user CRUD with role assignment
- Role-based access control with granular permissions
- System roles (SUPER_ADMIN, ADMIN, DEVELOPER, SECURITY_ANALYST, VIEWER)
- 28 fine-grained permissions

### 3.3 Image Management Module

**Purpose**: Register and manage container image metadata.

**Key Features**:
- Image registration with metadata (digest, architecture, manifest)
- Soft-delete for audit trail
- Image lookup by name, tag, registry

### 3.4 Scan Management Module

**Purpose**: Orchestrate vulnerability scanning of container images.

**Key Features**:
- Create scans linked to images
- Queue scans via BullMQ for async processing
- Track scan status (PENDING -> QUEUED -> RUNNING -> COMPLETED/FAILED/CANCELLED)
- Automatic retry with exponential backoff
- Cancel in-progress scans

### 3.5 Vulnerability Management Module

**Purpose**: Store, query, and analyze vulnerability findings.

**Key Features**:
- Store Trivy scan results
- Severity filtering (CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN)
- CVE ID search
- CVSS score range filtering
- Exploit availability filtering
- Severity summary statistics per scan

### 3.6 SBOM Management Module

**Purpose**: Generate and store Software Bill of Materials.

**Key Features**:
- SPDX 2.3 format support
- CycloneDX 1.5 format support
- Async generation via worker
- Package counting and hash verification

### 3.7 Reporting Module

**Purpose**: Generate and download security reports.

**Key Features**:
- PDF reports with vulnerability summaries
- CSV exports for data analysis
- Configurable report parameters (severity filters, date ranges)
- Async generation with status tracking

### 3.8 Notification Module

**Purpose**: Notify users of important events.

**Key Features**:
- Email notifications (SMTP)
- Mark as read/unread
- Unread count tracking

### 3.9 Audit Logging Module

**Purpose**: Record all security-critical actions for compliance.

**Key Features**:
- Immutable log entries (append-only pattern)
- Entity-level tracking
- Searchable by user, action, entity, date range
- IP address and user agent capture

### 3.10 Worker Module

**Purpose**: Process background jobs asynchronously.

**Queues**:
| Queue   | Jobs                    | Concurrency |
|---------|-------------------------|-------------|
| scan    | Scan container images   | 5           |
| sbom    | Generate SPDX/CycloneDX | 5           |
| report  | Generate PDF/CSV        | 5           |

## 4. Security Architecture

### 4.1 Authentication & Authorization

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────►│  Helmet  │────►│ JWT Auth │
└──────────┘     └──────────┘     └──────────┘
                                        │
                                   ┌────┴────┐
                                   │  RBAC   │
                                   │  Guard  │
                                   └─────────┘
```

### 4.2 Data Encryption

- **At Rest**: AES-256-GCM encryption for sensitive fields
- **In Transit**: TLS termination (reverse proxy)
- **Passwords**: Argon2id with configurable cost parameters
- **Tokens**: RS256 with 2048-bit RSA keys

### 4.3 Rate Limiting

| Endpoint Group     | Limit        | Window |
|--------------------|--------------|--------|
| Global             | 100 req/min  | 1 min  |
| Auth (register)    | 5 req/min    | 1 min  |
| Auth (login)       | 10 req/min   | 1 min  |

## 5. Data Flow Diagrams

### 5.1 Image Scan Flow

```
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌───────┐
│ Client │──►│  Scan  │──►│ Redis  │──►│Worker │──►│Postgres│
│        │   │ Routes │   │ Queue  │   │(Scan) │   │        │
└────────┘   └────────┘   └────────┘   └───────┘   └───────┘
   │             │             │           │            │
   │ POST        │ Create      │ Add job   │ Process    │ Store
   │ /scans      │ scan record │ to queue  │ mock trivy │ vulns
   │             │ (PENDING)   │           │            │
   │◄────────────┴─────────────┴───────────┴────────────┘
   │  Response: ScanResponse
   │  (status: QUEUED)
```

### 5.2 SBOM Generation Flow

```
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│ Client │──►│  SBOM  │──►│ Redis  │──►│Worker  │
│        │   │ Routes │   │ Queue  │   │(SBOM)  │
└────────┘   └────────┘   └────────┘   └───┬────┘
   │             │             │            │
   │ POST        │ Create      │ Add job    │ Generate
   │ /sboms      │ SBOM record │ to queue   │ SPDX/ CycloneDX
   │             │ (empty)     │            │ content
   │◄────────────┴─────────────┴────────────┘
   │  Response: SbomResponse
```

## 6. Database Schema

The schema uses 14 models with the following key relationships:

- **User** -> Role (M:1)
- **Role** <-> Permission (M:N via RolePermission)
- **User** -> Image (1:M)
- **Image** -> Scan (1:M)
- **Scan** -> Vulnerability (1:M)
- **Image** -> SBOM (1:M)
- **Scan** -> Report (M:1)
- **User** -> Notification (1:M)
- **User** -> AuditLog (1:M)

## 7. Performance & Scaling

- **Connection Pooling**: Prisma manages PostgreSQL connection pool
- **Redis**: BullMQ uses Redis for job persistence and scheduling
- **Async Processing**: All heavy operations (scans, SBOM, reports) are async via BullMQ
- **Horizontal Scaling**: Multiple API instances behind a load balancer share Redis/PG
- **Caching**: Redis can be used for caching frequent queries

## 8. Deployment Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Load       │────►│  API        │────►│  PostgreSQL  │
│  Balancer   │     │  Instance 1 │     │  (Primary)   │
│  (nginx)    │     ├─────────────┤     └─────────────┘
│             │────►│  API        │     ┌─────────────┐
└─────────────┘     │  Instance 2 │────►│  Redis       │
                    └─────────────┘     │  (Cluster)   │
                    ┌─────────────┐     └─────────────┘
                    │  Worker     │     ┌─────────────┐
                    │  Instance   │────►│  MinIO (S3) │
                    └─────────────┘     └─────────────┘
```
