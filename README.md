# FortifyCI - Container Security Supply Chain Platform

A production-grade backend platform for securing your container supply chain with vulnerability scanning, SBOM management, reporting, and more.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Fastify API Gateway                  │
│  Auth | Users | Images | Scans | Vulns | SBOM | Reports │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴───────────────────────────────┐
│                     Application Layer                  │
│            Domain Services & Use Cases                 │
├────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                 │
│    PostgreSQL (Prisma)  Redis (BullMQ)  MinIO (S3)     │
└────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component      | Technology                          |
|----------------|-------------------------------------|
| Runtime        | Node.js 22                          |
| Language       | TypeScript 5.4                      |
| Framework      | Fastify 4.x                         |
| ORM            | Prisma 5.x                          |
| Database       | PostgreSQL 17                       |
| Cache/Queue    | Redis 7 + BullMQ 5.x                |
| Object Store   | MinIO                               |
| Auth           | JWT RS256 + Argon2id                |
| Encryption     | AES-256-GCM                         |
| Validation     | Zod                                 |
| Monitoring     | Prometheus + Grafana                |
| Container      | Docker + Docker Compose             |

## Project Structure

```
fortifyci/
├── src/
│   ├── main.ts                          # Application entry point
│   ├── modules/
│   │   ├── auth/                        # Authentication module
│   │   ├── user/                        # User management module
│   │   ├── image/                       # Image management module
│   │   ├── scan/                        # Scan management module
│   │   ├── vulnerability/               # Vulnerability management module
│   │   ├── sbom/                        # SBOM management module
│   │   ├── report/                      # Reporting module
│   │   ├── notification/                # Notification module
│   │   ├── audit/                       # Audit logging module
│   │   └── job/                         # Worker/BullMQ module
│   └── shared/
│       ├── config/                      # Environment configuration
│       ├── database/                    # Prisma & Redis connections
│       ├── errors/                      # Error classes
│       ├── middleware/                  # Auth & RBAC middleware
│       ├── queue/                       # BullMQ queue setup
│       └── utils/                       # JWT, Encryption, Logger
├── prisma/
│   ├── schema.prisma                    # Database schema
│   └── seed.ts                          # Database seeder
├── docker/
│   ├── docker-compose.yml               # Infrastructure (PG, Redis, MinIO, Prometheus, Grafana)
│   ├── prometheus/                      # Prometheus config
│   └── grafana/                         # Grafana dashboards/datasources
├── keys/                                # RSA key pair for JWT
├── tests/
│   ├── unit/                            # Unit tests
│   └── integration/                     # Integration tests
├── Dockerfile                           # Production container
└── package.json
```

## Quick Start

### Prerequisites

- Node.js 22+
- Docker & Docker Compose
- OpenSSL (for key generation, or use the provided script)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate RSA keys for JWT
node -e "const { generateKeyPairSync } = require('crypto'); const fs = require('fs'); const k=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}}); fs.writeFileSync('keys/private.pem',k.privateKey); fs.writeFileSync('keys/public.pem',k.publicKey); console.log('Keys generated')"

# 3. Start infrastructure (PostgreSQL, Redis, MinIO)
npm run docker:up

# 4. Run database migrations
npm run prisma:migrate

# 5. Seed the database
npm run prisma:seed

# 6. Start development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and adjust values:

```bash
cp .env.example .env
```

## API Documentation

Once running, visit the Swagger UI:

- **Swagger UI**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

### Default Users (after seeding)

| Email                     | Password      | Role         |
|---------------------------|---------------|--------------|
| admin@fortifyci.local     | Admin123!@#   | SUPER_ADMIN  |

## Modules

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (invalidate refresh token)
- `POST /api/v1/auth/change-password` - Change password

### User Management
- `GET/POST /api/v1/users` - List/Create users
- `GET/PATCH/DELETE /api/v1/users/:id` - CRUD operations
- `GET /api/v1/users/me` - Current user profile

### Roles & Permissions
- `CRUD /api/v1/roles` - Role management
- `GET /api/v1/permissions` - List permissions

### Image Management
- `POST /api/v1/images` - Register container image
- `GET /api/v1/images` - List images (paginated)
- `DELETE /api/v1/images/:id` - Soft delete image

### Scan Management
- `POST /api/v1/scans` - Create and queue scan
- `GET /api/v1/scans` - List scans
- `POST /api/v1/scans/:id/cancel` - Cancel scan

### Vulnerability Management
- `GET /api/v1/vulnerabilities` - Query vulnerabilities (filter by severity, CVE, CVSS, etc.)
- `GET /api/v1/vulnerabilities/cve/:cveId` - Search by CVE ID
- `GET /api/v1/vulnerabilities/scan/:scanId` - Vulnerabilities for a scan

### SBOM Management
- `POST /api/v1/sboms` - Generate SBOM (SPDX or CycloneDX)
- `GET /api/v1/sboms` - List SBOMs
- `DELETE /api/v1/sboms/:id` - Delete SBOM

### Reporting
- `POST /api/v1/reports` - Generate report (PDF/CSV)
- `GET /api/v1/reports/:id/download` - Download generated report
- `DELETE /api/v1/reports/:id` - Delete report

### Notifications
- `GET /api/v1/notifications` - List notifications
- `PATCH /api/v1/notifications/:id/read` - Mark as read
- `POST /api/v1/notifications/read-all` - Mark all as read

### Audit Logging
- `GET /api/v1/audit-logs` - Query audit logs
- `GET /api/v1/audit-logs/user/:userId` - Audit logs by user

## Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# With coverage
npm run test:coverage
```


## Docker Deployment

```bash
# Build and start all services
docker compose -f docker/docker-compose.yml up -d

# Build API image
docker build -t fortifyci-api 

# Run API with infrastructure
docker compose -f docker/docker-compose.yml -f docker/docker-compose.api.yml up -d
```

## Monitoring

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/grafana_admin)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## Security Features

- Argon2id password hashing with configurable cost parameters
- JWT RS256 asymmetric signing (2048-bit RSA keys)
- Refresh token rotation on every use
- AES-256-GCM encryption for sensitive data at rest
- Helmet security headers (CSP, HSTS, X-Frame-Options, etc.)
- Rate limiting with configurable windows
- Zod input validation on all endpoints
- HTTP-only secure cookies for refresh tokens
- Comprehensive audit logging of all critical actions
- RBAC with granular permission system
- Soft delete for audit trail preservation

## Design Patterns

- **Modular Monolith**: Domain-separated modules with clear boundaries
- **Domain-Driven Design**: Rich domain models and ubiquitous language
- **Clean Architecture**: Separation of domain, application, infrastructure, and interfaces
- **Repository Pattern**: Data access abstraction through Prisma
- **CQRS-like**: Separate read and write operations where appropriate
- **Event-driven**: Background job processing with BullMQ
