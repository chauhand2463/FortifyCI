# FortifyCI v2.0 — Product Requirements Document

**Document Version:** 2.0.0  
**Status:** Active Development  
**Author:** FortifyCI Engineering  
**Last Updated:** June 2026  
**Repository:** `E:\FortifyCI`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Why FortifyCI Exists — The Trivy Gap](#3-why-fortifyci-exists--the-trivy-gap)
4. [Target Users](#4-target-users)
5. [v2.0 Feature Scope](#5-v20-feature-scope)
6. [Feature Specifications](#6-feature-specifications)
   - 6.1 Blast Radius Engine
   - 6.2 Scan Diff & Regression Detection
   - 6.3 Vulnerability Lifecycle Management
   - 6.4 CVE Exception Management
   - 6.5 Security Posture Trend Engine
   - 6.6 NVD Auto-Rescan
   - 6.7 Live Image Gate (Scan-then-Download)
   - 6.8 Webhook Outbound Notifications
   - 6.9 Scan Policy Engine
   - 6.10 GitHub Actions Integration
7. [Database Schema Changes](#7-database-schema-changes)
8. [API Specification](#8-api-specification)
9. [Frontend Pages & Routes](#9-frontend-pages--routes)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Success Metrics](#12-success-metrics)
13. [Out of Scope (v3.0)](#13-out-of-scope-v30)

---

## 1. Executive Summary

FortifyCI v1.0 is a container vulnerability scanner with a web UI — functionally a Trivy wrapper with a dashboard. This is not a defensible product. Any engineer who knows DevSecOps will recognize it immediately as redundant.

**FortifyCI v2.0 repositions the platform entirely.** The core thesis:

> Trivy tells you *what* is vulnerable in a single image at a single point in time. FortifyCI tells you *what your organization's actual exposure is* — across every image, every team, every registry, tracked over time, with enforcement, ownership, and compliance evidence.

Trivy is a scanner. FortifyCI v2.0 is the **organizational security intelligence platform** built on top of scanners. The distinction is the same as ESLint vs SonarQube. ESLint finds problems. SonarQube tracks them across teams, enforces quality gates, assigns ownership, and proves compliance to auditors.

v2.0 adds ten capabilities that Trivy fundamentally cannot provide because Trivy is stateless, single-image, and has no concept of teams, time, or enforcement.

---

## 2. Problem Statement

### The Trivy Workflow Today (What Teams Actually Do)

A typical DevSecOps workflow using Trivy looks like this:

```
Developer pushes image → CI runs trivy image → Trivy outputs JSON/table → 
Developer reads output → Maybe files a ticket → Ticket sits for weeks → 
Next sprint, someone re-runs Trivy → Same vulnerabilities still there → 
Nobody knows if things are getting better or worse → 
Zero-day drops → Nobody knows which of 200 images are affected → 
Panic. Manual re-scans. 3 engineers. 6 hours.
```

**The actual problems Trivy does not solve:**

1. **No fleet visibility.** Trivy scans one image. Organizations run 50–500 images. There is no single answer to "are we exposed to this CVE?"

2. **No memory.** Trivy has no state. It cannot tell you whether your posture improved or regressed between releases. Every scan is an island.

3. **No ownership.** When Trivy finds 47 vulnerabilities, who fixes which one? Trivy has no answer. The vulnerability dies in a JSON file.

4. **No enforcement.** Trivy can be used as a CI gate, but it is opt-in per pipeline, manually wired, and easily bypassed. There is no centralized policy that says "no CRITICAL CVEs reach production."

5. **No compliance evidence.** SOC2 and ISO27001 require proving you acted on vulnerabilities within SLA. Trivy produces no audit trail. A JSON file from six months ago does not satisfy an auditor.

6. **No proactive alerting.** When a new zero-day is published, Trivy does nothing. Someone must manually re-scan. In large organizations this is hours of work and is often skipped.

7. **No exception management.** Some vulnerabilities are not exploitable in a specific environment. There is no way to document "we accept this CVE because it is unexploitable, approved by CTO, expires 2026-06-01" in Trivy.

FortifyCI v2.0 solves all seven of these problems.

---

## 3. Why FortifyCI Exists — The Trivy Gap

This section exists to clearly define differentiation for both engineering decisions and portfolio/interview communication.

### What Trivy Does (and Does Well)

- Single-image CVE scanning with CVSS scores
- SBOM generation in CycloneDX and SPDX
- Policy enforcement via Rego rules (trivy check)
- CI/CD plugins for GitHub Actions, GitLab, Jenkins
- Misconfig scanning (Dockerfile, Kubernetes YAML, Terraform)
- Secret detection in image layers
- Multiple output formats (JSON, table, SARIF)

### What Trivy Explicitly Does Not Do

| Gap | Why Trivy Cannot Fill It |
|-----|--------------------------|
| Cross-image CVE blast radius | Trivy is stateless — no database, no memory across scans |
| Vulnerability ownership & assignment | Trivy has no concept of users, teams, or accountability |
| SLA tracking & breach alerts | Trivy has no time dimension on vulnerabilities |
| CVE exception / risk acceptance workflow | No approval, expiry, or audit trail mechanism |
| Security posture trends over time | Each scan is independent, no historical comparison |
| Proactive rescan on new CVE publication | Pull-only tool, no NVD/OSV integration |
| Centralized policy enforcement | Per-pipeline opt-in, no org-wide enforcement |
| Compliance audit export | No evidence of remediation workflow |
| Regression detection between image versions | No diff capability across scans |

### FortifyCI's Positioning

```
Trivy          →  What vulnerabilities exist in THIS image RIGHT NOW
FortifyCI v2   →  What is our organization's total exposure, who owns it,
                  are we improving, and can we prove it to an auditor
```

FortifyCI uses Trivy as its scanning engine (the right tool for that job). FortifyCI adds the organizational intelligence layer that transforms raw scan data into actionable security governance.

---

## 4. Target Users

### Primary: Security Engineers / DevSecOps Engineers
Responsible for the organization's container security posture. Need fleet-wide visibility, trend tracking, and compliance evidence. Currently running Trivy manually or in CI and aggregating results in spreadsheets.

**Jobs to be done:**
- "Show me every image affected by this zero-day, now"
- "Prove to the auditor we remediated all Critical CVEs within 7 days this quarter"
- "Which team is shipping the most vulnerable images?"

### Secondary: Developers / DevOps Engineers
Push images as part of CI/CD. Need to know if their image introduces new vulnerabilities compared to the previous version. Currently getting a wall of Trivy JSON output they don't know how to triage.

**Jobs to be done:**
- "Did my new release make things worse?"
- "What exactly do I need to fix and in which package?"
- "Why was my deploy blocked?"

### Tertiary: Engineering Managers / CISOs
Need executive-level posture dashboards, SLA compliance reports, and trend data for security review meetings.

**Jobs to be done:**
- "Are we getting more or less secure over time?"
- "How many CVEs have been unresolved past SLA this quarter?"
- "Which teams need security process improvement?"

---

## 5. v2.0 Feature Scope

### In Scope (v2.0)

| Feature | Priority | Complexity | Differentiates Trivy |
|---------|----------|------------|---------------------|
| Blast Radius Engine | P0 | Low | Yes — core differentiator |
| Scan Diff & Regression Detection | P0 | Low | Yes |
| Vulnerability Lifecycle Management | P0 | Medium | Yes |
| CVE Exception Management | P0 | Medium | Yes |
| Security Posture Trend Engine | P1 | Medium | Yes |
| NVD Auto-Rescan on New CVEs | P1 | Medium | Yes |
| Live Image Gate (Scan-then-Download) | P1 | Medium | Partial |
| Webhook Outbound Notifications | P2 | Low | No (table stakes) |
| Scan Policy Engine | P2 | Medium | Partial |
| GitHub Actions Integration | P2 | Low | No (table stakes) |

**P0** = Must ship in v2.0. Core value proposition.  
**P1** = Should ship in v2.0. Significant differentiator.  
**P2** = Nice to have in v2.0. Completes the platform story.

### Out of Scope (v3.0)

- Kubernetes Admission Webhook
- Base image inheritance graph
- Registry proxy (pull-intercept mode)
- Policy-as-Code (Rego/YAML DSL)
- Multi-tenancy / organization isolation

---

## 6. Feature Specifications

---

### 6.1 Blast Radius Engine

**What it is:** Given a CVE ID, instantly show which images across your entire registered fleet are affected, with severity breakdown, fix availability, and one-click rescan.

**Why Trivy cannot do this:** Trivy is stateless. It has no database of previous scans. It cannot query across images.

**User Story:**
> As a Security Engineer, when a new critical CVE is published (e.g., a new OpenSSL zero-day), I need to know within 60 seconds which of our registered images are affected, so I can triage and assign remediation immediately without manually re-scanning 200 images.

**Functional Requirements:**

FR-BR-01: The system shall accept a CVE ID as input and return a list of all registered images whose most recent completed scan contains that CVE.

FR-BR-02: The response shall include per-image: image reference, severity in that image, installed package version, fixed version if available, last scan timestamp, and direct link to the full vulnerability detail.

FR-BR-03: The response shall include a fleet-level summary: total affected images, breakdown by severity (Critical/High/Medium/Low), percentage of fleet affected, count of images with a fix available.

FR-BR-04: The system shall support querying by package name (e.g., "show all images containing openssl") in addition to CVE ID.

FR-BR-05: From the blast radius results page, a user with SCAN_CREATE permission shall be able to trigger a bulk rescan of all affected images in one action.

FR-BR-06: Blast radius queries shall complete in under 2 seconds for a fleet of up to 500 images (pure database query, no live scanning).

FR-BR-07: Results shall show staleness indicator — if an image's last scan is older than 7 days, flag it as "stale scan, results may be outdated."

**Acceptance Criteria:**
- Search for CVE-2024-0001 returns all affected images with correct severity
- "Rescan All" button triggers one scan job per affected image
- Package search for "openssl" returns all images containing any openssl CVE
- Query completes in < 2s with 200 registered images in test data
- Stale scans (>7 days) are clearly marked

**UI Wireframe (text):**
```
┌─ Blast Radius Search ────────────────────────────────────────┐
│  Search by CVE ID or package name                            │
│  [CVE-2024-XXXX or openssl________________] [Search]         │
└──────────────────────────────────────────────────────────────┘

┌─ Results: CVE-2024-1234 ─────────────────────────────────────┐
│  ● 14 of 38 images affected  (37% of fleet)                  │
│  ■ 3 Critical  ■ 8 High  ■ 3 Medium                          │
│  ✓ 11 images have a fix available                            │
│                                              [Rescan All 14] │
├──────────────────────────────────────────────────────────────┤
│  Image                    Severity   Fix?   Last Scan        │
│  ghcr.io/org/api:v2.3    CRITICAL   Yes    2h ago            │
│  ghcr.io/org/web:latest  HIGH       Yes    1d ago  ⚠ stale  │
│  docker.io/lib/nginx:1.2 HIGH       No     6h ago            │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

---

### 6.2 Scan Diff & Regression Detection

**What it is:** Compare any two scans of the same image (or different versions of an image) and show exactly which vulnerabilities were introduced, which were fixed, and which persisted. Automatically run on every new scan and flag regressions.

**Why Trivy cannot do this:** Trivy is stateless. Every scan is independent with no prior context.

**User Story:**
> As a Developer, when I push a new version of my image, I need to know whether I introduced new vulnerabilities compared to the previous version, so I can fix regressions before they reach production.

**Functional Requirements:**

FR-DIFF-01: Every completed scan shall automatically compute a diff against the most recent prior completed scan of the same image (if one exists). This diff shall be stored and accessible without a separate API call.

FR-DIFF-02: The diff shall classify each vulnerability as: INTRODUCED (new in this scan, not in prior), RESOLVED (present in prior scan, not in this scan), or PERSISTED (present in both scans).

FR-DIFF-03: A regression is defined as: any INTRODUCED vulnerability with severity CRITICAL or HIGH. When a regression is detected, the scan result shall be flagged with `regressionDetected: true`.

FR-DIFF-04: A delta score shall be calculated: each CRITICAL = +4, HIGH = +3, MEDIUM = +2, LOW = +1 for introduced vulns; same values subtracted for resolved vulns. Positive delta = posture worsened. Negative = improved.

FR-DIFF-05: The API shall accept two arbitrary scan IDs for manual diff comparison (for comparing across image versions, e.g., v2.3 vs v2.4).

FR-DIFF-06: Regression detection shall trigger a notification (in-app + email if configured) when `regressionDetected: true`.

FR-DIFF-07: The scan list page shall display a regression badge on scans where regression was detected.

**Acceptance Criteria:**
- Scan A has CVE-001, CVE-002. Scan B (same image) has CVE-002, CVE-003.
- Diff shows: INTRODUCED = [CVE-003], RESOLVED = [CVE-001], PERSISTED = [CVE-002]
- If CVE-003 is CRITICAL, `regressionDetected = true`, notification fires
- Manual diff between two arbitrary scan IDs works correctly
- Diff is computed asynchronously after scan completes (not blocking the scan job)

**Delta Score Formula:**
```
severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, UNKNOWN: 0 }
introductionScore = sum(severityWeight[v.severity] for v in introduced)
resolutionScore   = sum(severityWeight[v.severity] for v in resolved)
deltaScore        = introductionScore - resolutionScore

deltaScore > 0  → posture WORSENED
deltaScore = 0  → posture UNCHANGED
deltaScore < 0  → posture IMPROVED
```

---

### 6.3 Vulnerability Lifecycle Management

**What it is:** Assign vulnerabilities to team members, set remediation deadlines based on policy-driven SLAs, track status through the remediation workflow, and automatically breach SLAs that are missed.

**Why Trivy cannot do this:** Trivy has no concept of users, teams, deadlines, or status tracking. It outputs a list. What happens next is entirely outside its scope.

**User Story:**
> As a Security Engineer, I need to assign each Critical vulnerability to a responsible developer with a deadline, so that I can track remediation progress and hold teams accountable, rather than hoping someone reads the Trivy output.

**Functional Requirements:**

FR-LC-01: A user with VULNERABILITY_ASSIGN permission shall be able to assign a vulnerability to any registered user.

FR-LC-02: On assignment, the system shall automatically calculate a `slaDeadline` based on the active ScanPolicy for that image:
- CRITICAL: policy.slaCriticalDays days from assignment date
- HIGH: policy.slaHighDays days from assignment date
- MEDIUM: policy.slaMediumDays days from assignment date
- LOW: no SLA enforced (informational only)

FR-LC-03: A vulnerability assignment shall have the following statuses: OPEN, IN_PROGRESS, RESOLVED, ACCEPTED_RISK, FALSE_POSITIVE.

FR-LC-04: A daily cron job shall sweep all assignments with status OPEN or IN_PROGRESS where `slaDeadline < now()` and mark them `slaBreached = true`, then fire a breach notification.

FR-LC-05: The assignee shall receive an in-app notification on assignment and an email notification if SMTP is configured.

FR-LC-06: The assignee shall receive a reminder notification 48 hours before SLA deadline.

FR-LC-07: When an image is re-scanned and a previously assigned CVE is no longer present in the new scan, the assignment shall be automatically moved to RESOLVED status with a note referencing the resolving scan ID.

FR-LC-08: A compliance report view shall show: all SLA breaches in a date range, mean time to remediation (MTTR) per team/user, count of ACCEPTED_RISK exceptions, and vulnerability aging (how many days each open vuln has been unresolved).

**Acceptance Criteria:**
- Assigning CVE-001 to user@org.com with CRITICAL severity auto-sets deadline to today + 7 days
- Cron runs at 02:00 UTC daily and marks breached assignments
- When image is re-scanned and CVE-001 is gone, assignment auto-resolves
- Compliance report shows correct MTTR calculation for a set of test assignments

**Assignment Status Flow:**
```
OPEN → IN_PROGRESS → RESOLVED
  ↓                     ↑
  └→ ACCEPTED_RISK       └ (auto-resolved by rescan)
  └→ FALSE_POSITIVE
```

---

### 6.4 CVE Exception Management

**What it is:** Allow a security team to formally document that a specific CVE is accepted as risk for a specific image (or globally), with a mandatory reason, approver, and expiry date. Exceptions are auditable and automatically expire.

**Why Trivy cannot do this:** Trivy has no acceptance workflow, no approval mechanism, and no audit trail.

**User Story:**
> As a Security Engineer, when a CVE is present in one of our images but is unexploitable in our specific environment, I need to formally document our risk acceptance so that (1) it doesn't appear as an open finding, (2) an auditor can see we evaluated and accepted it, and (3) it automatically expires so we re-evaluate it after 6 months.

**Functional Requirements:**

FR-EX-01: A user with VULNERABILITY_EXCEPTION permission shall be able to create an exception for a CVE ID scoped to either: a specific image, or globally (all images).

FR-EX-02: Exception creation shall require: CVE ID, reason (min 50 characters), approver (another user with VULNERABILITY_EXCEPTION permission), and expiry date (max 1 year from creation).

FR-EX-03: The exception shall require a second approval — the creator cannot be the approver. This enforces a two-person rule for risk acceptance.

FR-EX-04: While an exception is active and approved, the affected vulnerability shall be suppressed from: dashboard counts, vulnerability lists by default, scan results summary, and SLA breach calculations. It shall remain visible when the user explicitly toggles "Show suppressed."

FR-EX-05: A daily cron shall check for exceptions where `expiresAt < now()` and mark them `isActive = false`, triggering a notification to the original creator and approver for re-evaluation.

FR-EX-06: All exception create/approve/expire/revoke events shall be written to the audit log.

FR-EX-07: The exception shall be visible on the vulnerability detail page with: reason, approver name, creation date, expiry date, and current status.

FR-EX-08: Expired exceptions shall remain in the database for audit purposes. They shall not be deletable. They may only be renewed (creates a new exception record).

**Acceptance Criteria:**
- Creating exception without approver is rejected
- Creator cannot approve their own exception
- Active exception suppresses CVE from vulnerability count
- Expiry cron fires and marks exception inactive, fires notification
- Audit log captures create/approve/expire events with correct metadata
- Suppressed CVEs visible when "Show suppressed" is toggled

---

### 6.5 Security Posture Trend Engine

**What it is:** After every completed scan, compute a posture score for that image and persist it as a time-series snapshot. Aggregate snapshots into trend graphs at the image level, team level, and org level.

**Why Trivy cannot do this:** No state, no history, no trend.

**User Story:**
> As a CISO, I need to see whether our container security posture is improving or degrading over time — not just today's snapshot — so I can present evidence of security program effectiveness to the board.

**Functional Requirements:**

FR-PS-01: On scan completion, the worker shall compute a PostureSnapshot and persist it. The snapshot includes: criticalCount, highCount, mediumCount, lowCount, fixableCount, and a computed postureScore.

FR-PS-02: **Posture Score Formula (0–100, higher = better):**
```
penalty = (critical × 40) + (high × 15) + (medium × 5) + (low × 1)
score   = max(0, 100 - penalty)
```
The score is intentionally sensitive to critical vulnerabilities. One critical vulnerability is a score of 60.

FR-PS-03: The posture API shall return time-series snapshot data for: a specific image over time, all images aggregate (org-wide posture score), and optionally filtered by date range.

FR-PS-04: The dashboard shall display an org-wide posture trend line chart covering the last 90 days (one data point per day = average score of all scanned images that day).

FR-PS-05: The image detail page shall display that image's posture score history over time.

FR-PS-06: The posture API shall identify and return: best-performing images (highest average score last 30 days), worst-performing images (lowest average score last 30 days), and most-improved images (largest positive delta last 30 days).

FR-PS-07: The system shall generate a weekly posture digest notification for ADMIN and SECURITY_ANALYST roles summarizing the org-wide score trend, top regressions of the week, and SLA breaches.

**Acceptance Criteria:**
- Image with 0 CVEs has posture score 100
- Image with 1 CRITICAL CVE has posture score 60
- Image with 2 CRITICAL CVEs has posture score 20
- Image with 3+ CRITICAL CVEs has posture score 0
- Time series API returns correct data points for a 30-day window
- Dashboard trend chart renders with real snapshot data

---

### 6.6 NVD Auto-Rescan

**What it is:** FortifyCI polls the NIST NVD (National Vulnerability Database) feed every 6 hours for newly published or updated CVEs. When a new CVE is detected, FortifyCI cross-references it against all registered images' last scan data, identifies potentially affected images, and triggers automatic rescans.

**Why Trivy cannot do this:** Trivy is a pull tool. It waits to be invoked. It cannot proactively respond to new CVE publications.

**User Story:**
> As a Security Engineer, when a critical zero-day is published at 3am, I need FortifyCI to automatically identify which of our images are potentially affected and trigger rescans — so by the time I arrive at my desk at 9am, I have a full blast radius report ready without any manual work.

**Functional Requirements:**

FR-NVD-01: A cron job shall run every 6 hours and query the NVD CVE 2.0 API for CVEs published or modified in the last 6 hours.

FR-NVD-02: For each new CVE with severity CRITICAL or HIGH, the system shall check if any registered image's last scan (within 14 days) contains a vulnerability matching the CVE ID.

FR-NVD-03: For matched images, the system shall queue a rescan job with `triggeredBy: 'NVD_WATCH'` metadata. The scan reason shall be logged in the audit trail.

FR-NVD-04: A `CveWatch` record shall be created for each processed CVE with: cveId, severity, publishedAt, list of affected imageIds found, and processed timestamp.

FR-NVD-05: A notification shall be sent to SECURITY_ANALYST and ADMIN roles when a new CRITICAL CVE triggers rescans, including: CVE ID, CVSS score, number of images being rescanned.

FR-NVD-06: If the NVD API is unavailable, the cron job shall log the failure and retry on the next scheduled cycle. It shall not crash or leave partial state.

FR-NVD-07: Auto-rescans triggered by NVD watch shall be rate-limited to a maximum of 20 concurrent rescans to prevent queue saturation. Remaining images shall be queued and processed within 2 hours.

FR-NVD-08: The NVD sync status shall be visible on the admin settings page: last successful sync time, CVEs processed last 24h, auto-rescans triggered last 24h.

**Acceptance Criteria:**
- Cron fires every 6 hours (±1 minute tolerance)
- Mock NVD response with 3 new CVEs triggers correct number of rescans
- NVD API failure is logged and handled without crashing the worker process
- Rate limiting prevents > 20 simultaneous rescan jobs
- Notifications fired for CRITICAL CVEs with correct content

---

### 6.7 Live Image Gate (Scan-then-Download)

**What it is:** A user submits an image reference (e.g., `ghcr.io/owner/image:tag`) through the UI or API. FortifyCI pulls the image manifest, runs a scan, evaluates the result against a policy, and either provides a signed download URL (if passed) or blocks with a detailed reason (if failed).

**Why this is different from regular scanning:** Regular scanning is passive — you register images that already exist in your environment. The Live Gate is active — it acts as a security checkpoint before an image is used or downloaded.

**User Story:**
> As a Developer, before pulling a third-party image from a public registry to use in my project, I want to know it passes our organization's security policy, and I want FortifyCI to make it available for download only if it does.

**Functional Requirements:**

FR-LG-01: The system shall accept a live scan request with: `imageRef` (full image reference), optional `policyId` (defaults to the default policy), optional registry credentials.

FR-LG-02: On receiving the request, the system shall immediately return a `liveScanId` and HTTP 202 Accepted. The scan runs asynchronously.

FR-LG-03: The worker shall: pull the image using skopeo (not Docker daemon — no Docker-in-Docker), run Trivy against the pulled image, evaluate results against the specified policy.

FR-LG-04: If the scan passes policy: upload the image tarball to MinIO with a presigned URL valid for 1 hour. Return status PASSED with downloadUrl and scan summary.

FR-LG-05: If the scan fails policy: return status BLOCKED with: policy name, blocking reason (e.g., "3 CRITICAL CVEs exceed policy threshold of 0"), list of blocking CVEs with fix versions.

FR-LG-06: The client shall poll `GET /api/v1/live-scan/:id` for status. The response shall include progress percentage.

FR-LG-07: The frontend `/live-scan` page shall show real-time progress via SSE (Server-Sent Events), not polling.

FR-LG-08: Live scan results shall be cached by image digest (not tag) for 24 hours. A second request for the same digest within 24 hours returns the cached result instantly without re-scanning.

FR-LG-09: Live scan presigned download URLs shall expire after 1 hour. The image tarball shall be deleted from MinIO after expiry.

FR-LG-10: Live scans shall count against the user's scan quota (same as regular scans).

**Acceptance Criteria:**
- `POST /api/v1/live-scan` returns 202 with liveScanId immediately
- Scan completes and status transitions correctly: PENDING → RUNNING → PASSED/BLOCKED
- PASSED scan produces a working presigned download URL
- BLOCKED scan returns correct blocking CVEs from the policy evaluation
- Second request for same digest within 24h returns cached result in < 500ms
- Presigned URL expires after 1 hour and becomes non-functional

---

### 6.8 Webhook Outbound Notifications

**What it is:** Allow users to configure HTTP endpoints that FortifyCI will POST to when specific events occur, enabling integration with Slack, PagerDuty, Microsoft Teams, or any custom system.

**Functional Requirements:**

FR-WH-01: A user with WEBHOOK_MANAGE permission shall be able to create webhooks with: name, target URL, HMAC signing secret, and list of subscribed events.

FR-WH-02: Supported events: `scan.completed`, `scan.failed`, `scan.regression_detected`, `policy.blocked`, `sla.breached`, `exception.expired`, `nvd.critical_cve_found`, `posture.score_dropped`.

FR-WH-03: Each webhook delivery shall be signed with HMAC-SHA256 using the configured secret. The signature shall be sent in the `X-FortifyCI-Signature` header as `sha256=<hex>`. This allows the receiving end to verify authenticity.

FR-WH-04: Webhook delivery shall be attempted up to 3 times with exponential backoff (5s, 25s, 125s) on non-2xx responses.

FR-WH-05: The last 50 delivery attempts per webhook shall be stored with: timestamp, HTTP status, response body (truncated to 500 chars), and success/failure status.

FR-WH-06: The webhook management page shall allow: testing a webhook (sends a test payload), viewing delivery history, enabling/disabling without deletion.

**Webhook Payload Structure:**
```json
{
  "event": "scan.completed",
  "timestamp": "2026-06-10T09:00:00Z",
  "fortifyci_version": "2.0.0",
  "data": {
    "scanId": "clx...",
    "imageRef": "ghcr.io/org/app:v2.3",
    "status": "COMPLETED",
    "criticalCount": 2,
    "highCount": 5,
    "regressionDetected": true,
    "postureScore": 52,
    "scanUrl": "https://fortifyci.yourorg.com/scans/clx..."
  }
}
```

---

### 6.9 Scan Policy Engine

**What it is:** Replace hardcoded vulnerability thresholds with named, configurable policies that define: what severity levels block deployment, SLA durations per severity, and which registries/images the policy applies to.

**Functional Requirements:**

FR-PL-01: The system shall support multiple named policies. One policy shall be marked `isDefault = true` and applied when no policy is specified.

FR-PL-02: Policy fields: name, description, blockOnCritical (bool), blockOnHigh (bool), maxHighCount (int), maxMediumCount (int), slaCriticalDays (int), slaHighDays (int), slaMediumDays (int), registryPatterns (string array).

FR-PL-03: `registryPatterns` supports glob matching: `ghcr.io/myorg/*` applies the policy to all images from that org. More specific patterns take precedence over more general ones.

FR-PL-04: Policy evaluation shall return: `{ passed: bool, reason: string, blockingCVEs: Vulnerability[], policyName: string }`.

FR-PL-05: Policy changes shall not retroactively affect historical scan records. They apply only to scans run after the policy change.

FR-PL-06: Default policy on fresh install: blockOnCritical = true, blockOnHigh = false, slaCriticalDays = 7, slaHighDays = 30, slaMediumDays = 90.

---

### 6.10 GitHub Actions Integration

**What it is:** A published GitHub Action that allows teams to scan images from their CI/CD pipelines using their FortifyCI instance and fail builds based on the configured policy.

**Why this matters:** This is how FortifyCI gets used in real workflows. Without CI integration, it stays a dashboard that people check manually. With CI integration, it becomes the enforcement layer.

**Functional Requirements:**

FR-GH-01: The action shall be publishable as `fortifyci/scan-action@v1` to the GitHub Actions marketplace.

FR-GH-02: Required inputs: `api-url`, `api-key`, `image`.

FR-GH-03: Optional inputs: `policy` (policy name, defaults to "default"), `fail-on` (critical/high/medium, defaults to critical), `timeout` (seconds, defaults to 300).

FR-GH-04: The action shall output: `scan-id`, `passed` (true/false), `critical-count`, `high-count`, `medium-count`, `posture-score`, `scan-url`.

FR-GH-05: The action shall fail the workflow step (exit code 1) when the scan fails the specified policy, causing the CI job to fail.

FR-GH-06: The action shall print a formatted summary table to the GitHub Actions job summary.

**Example Usage:**
```yaml
- name: Scan image with FortifyCI
  uses: fortifyci/scan-action@v1
  with:
    api-url: ${{ secrets.FORTIFYCI_URL }}
    api-key: ${{ secrets.FORTIFYCI_KEY }}
    image: ghcr.io/${{ github.repository }}:${{ github.sha }}
    policy: strict
    fail-on: critical
```

---

## 7. Database Schema Changes

The following models shall be added to `scssp/prisma/schema.prisma`. No existing models shall be modified in breaking ways. New fields added to existing models use optional (`?`) to remain backward compatible.

### New Models

```prisma
// Vulnerability ownership and remediation tracking
model VulnerabilityAssignment {
  id              String              @id @default(cuid())
  vulnerabilityId String
  vulnerability   Vulnerability       @relation(fields: [vulnerabilityId], references: [id], onDelete: Cascade)
  assignedToId    String
  assignedTo      User                @relation("AssignedTo", fields: [assignedToId], references: [id])
  assignedById    String
  assignedBy      User                @relation("AssignedBy", fields: [assignedById], references: [id])
  status          RemediationStatus   @default(OPEN)
  slaDeadline     DateTime
  slaBreached     Boolean             @default(false)
  slaBreachedAt   DateTime?
  resolvedAt      DateTime?
  resolvingScanId String?             // scan that auto-resolved this
  notes           String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@unique([vulnerabilityId])         // one active assignment per vulnerability
}

// Formal risk acceptance with two-person rule
model VulnerabilityException {
  id              String              @id @default(cuid())
  cveId           String
  imageId         String?             // null = global exception
  image           Image?              @relation(fields: [imageId], references: [id])
  reason          String              // min 50 chars enforced at application layer
  createdById     String
  createdBy       User                @relation("ExceptionCreator", fields: [createdById], references: [id])
  approvedById    String?             // required for isActive = true
  approvedBy      User?               @relation("ExceptionApprover", fields: [approvedById], references: [id])
  approvedAt      DateTime?
  isActive        Boolean             @default(false) // false until approved
  expiresAt       DateTime
  revokedAt       DateTime?
  revokedById     String?
  createdAt       DateTime            @default(now())

  @@index([cveId, isActive])
}

// Named scan policies
model ScanPolicy {
  id                String    @id @default(cuid())
  name              String    @unique
  description       String?
  blockOnCritical   Boolean   @default(true)
  blockOnHigh       Boolean   @default(false)
  maxHighCount      Int       @default(0)   // 0 = block on any HIGH if blockOnHigh=true
  maxMediumCount    Int       @default(-1)  // -1 = unlimited
  slaCriticalDays   Int       @default(7)
  slaHighDays       Int       @default(30)
  slaMediumDays     Int       @default(90)
  registryPatterns  String[]  // glob patterns, more specific = higher priority
  isDefault         Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

// Outbound webhook configuration
model Webhook {
  id              String          @id @default(cuid())
  name            String
  url             String
  secret          String          // HMAC-SHA256 signing secret (stored encrypted)
  events          String[]
  isActive        Boolean         @default(true)
  lastFiredAt     DateTime?
  deliveries      WebhookDelivery[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

// Webhook delivery history (last 50 per webhook)
model WebhookDelivery {
  id              String    @id @default(cuid())
  webhookId       String
  webhook         Webhook   @relation(fields: [webhookId], references: [id], onDelete: Cascade)
  event           String
  payload         Json
  httpStatus      Int?
  responseBody    String?   // truncated to 500 chars
  success         Boolean
  attemptCount    Int       @default(1)
  deliveredAt     DateTime  @default(now())
}

// NVD CVE tracking for auto-rescan
model CveWatch {
  id              String    @id @default(cuid())
  cveId           String    @unique
  publishedAt     DateTime
  severity        Severity
  cvssScore       Float?
  affectedImages  String[]  // imageIds found to be affected
  rescanCount     Int       @default(0)
  processed       Boolean   @default(false)
  processedAt     DateTime?
  createdAt       DateTime  @default(now())
}

// Time-series posture snapshots (one per completed scan)
model PostureSnapshot {
  id              String    @id @default(cuid())
  imageId         String
  image           Image     @relation(fields: [imageId], references: [id])
  scanId          String    @unique
  scan            Scan      @relation(fields: [scanId], references: [id])
  criticalCount   Int       @default(0)
  highCount       Int       @default(0)
  mediumCount     Int       @default(0)
  lowCount        Int       @default(0)
  fixableCount    Int       @default(0)
  suppressedCount Int       @default(0) // exceptions active at time of snapshot
  postureScore    Float     // 0-100
  snapshotAt      DateTime  @default(now())

  @@index([imageId, snapshotAt])
  @@index([snapshotAt])
}

// Scan diffs (computed after each scan against previous)
model ScanDiff {
  id                  String    @id @default(cuid())
  scanId              String    @unique     // the newer scan
  scan                Scan      @relation("NewerScan", fields: [scanId], references: [id])
  baselineScanId      String
  baselineScan        Scan      @relation("BaselineScan", fields: [baselineScanId], references: [id])
  introducedCount     Int       @default(0)
  resolvedCount       Int       @default(0)
  persistedCount      Int       @default(0)
  deltaScore          Int       @default(0) // positive = worsened, negative = improved
  regressionDetected  Boolean   @default(false)
  introducedCveIds    String[]
  resolvedCveIds      String[]
  computedAt          DateTime  @default(now())
}

// Live scan requests (scan-then-download)
model LiveScan {
  id              String          @id @default(cuid())
  requestedById   String
  requestedBy     User            @relation(fields: [requestedById], references: [id])
  imageRef        String          // full image reference as provided
  imageDigest     String?         // resolved digest for caching
  policyId        String?
  policy          ScanPolicy?     @relation(fields: [policyId], references: [id])
  status          LiveScanStatus  @default(PENDING)
  progress        Int             @default(0)
  passed          Boolean?        // null until completed
  blockingReason  String?
  downloadUrl     String?         // MinIO presigned URL
  downloadExpiry  DateTime?
  linkedScanId    String?         // scan record created for this
  createdAt       DateTime        @default(now())
  completedAt     DateTime?
}
```

### New Enums

```prisma
enum RemediationStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  ACCEPTED_RISK
  FALSE_POSITIVE
}

enum LiveScanStatus {
  PENDING
  PULLING      // pulling image manifest/layers
  SCANNING     // running trivy
  EVALUATING   // checking against policy
  PASSED
  BLOCKED
  FAILED       // system error, not policy block
}
```

### Modifications to Existing Models

```prisma
// Add to Scan model:
triggeredBy     String?   @default("USER")
// Values: "USER" | "BLAST_RADIUS_RESCAN" | "NVD_WATCH" | "SCHEDULED"

// Add to Vulnerability model:
fixedVersion    String?   // populated from Trivy's FixedVersion field
pkgName         String?   // package name containing the vulnerability
pkgVersion      String?   // installed version of the vulnerable package
```

### New Permissions (add to PermissionName enum)

```prisma
VULNERABILITY_ASSIGN     // assign vulnerabilities to users
VULNERABILITY_EXCEPTION  // create/approve CVE exceptions
WEBHOOK_MANAGE           // create/edit/delete webhooks
POLICY_MANAGE            // create/edit/delete scan policies
LIVE_SCAN_CREATE         // use the live image gate
```

---

## 8. API Specification

All new endpoints follow the existing conventions: Bearer JWT auth, Zod request validation, consistent error shape. New permissions are enforced at the `authorize()` middleware layer.

### Blast Radius (`/api/v1/blast-radius`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/cve/:cveId` | VULNERABILITY_READ | Get affected images for a CVE |
| GET | `/package/:packageName` | VULNERABILITY_READ | Get all images containing a package |
| POST | `/cve/:cveId/rescan` | SCAN_CREATE | Trigger bulk rescan of all affected images |

**GET /blast-radius/cve/:cveId — Response:**
```json
{
  "cveId": "CVE-2024-1234",
  "totalAffected": 14,
  "fleetSize": 38,
  "fleetPercentage": 36.8,
  "breakdown": {
    "critical": 3,
    "high": 8,
    "medium": 3,
    "low": 0
  },
  "fixableImages": 11,
  "affectedImages": [
    {
      "imageId": "clx...",
      "imageRef": "ghcr.io/org/api:v2.3",
      "severity": "CRITICAL",
      "pkgName": "openssl",
      "installedVersion": "3.0.2",
      "fixedVersion": "3.0.7",
      "lastScanId": "clx...",
      "lastScannedAt": "2026-06-10T07:00:00Z",
      "isStale": false
    }
  ]
}
```

### Scan Diff (`/api/v1/scans`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/:id/diff` | SCAN_READ | Get diff for scan vs its baseline |
| GET | `/diff` | SCAN_READ | Manual diff: ?scanA=:id&scanB=:id |

**GET /scans/:id/diff — Response:**
```json
{
  "scanId": "clx...",
  "baselineScanId": "clx...",
  "summary": {
    "introduced": 3,
    "resolved": 1,
    "persisted": 44,
    "deltaScore": 11,
    "regressionDetected": true
  },
  "introduced": [{ "cveId": "CVE-2024-001", "severity": "CRITICAL", ... }],
  "resolved": [{ "cveId": "CVE-2023-999", "severity": "HIGH", ... }],
  "persisted": [...]
}
```

### Vulnerability Lifecycle (`/api/v1/assignments`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/` | VULNERABILITY_ASSIGN | Assign vulnerability to user |
| GET | `/` | VULNERABILITY_ASSIGN | List assignments (filter: status, assignee, breached) |
| GET | `/:id` | VULNERABILITY_ASSIGN | Get assignment by ID |
| PATCH | `/:id/status` | VULNERABILITY_ASSIGN | Update status |
| GET | `/compliance-report` | AUDIT_LOG_READ | SLA/MTTR compliance report |

### CVE Exceptions (`/api/v1/exceptions`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/` | VULNERABILITY_EXCEPTION | Create exception (pending approval) |
| GET | `/` | VULNERABILITY_READ | List exceptions |
| GET | `/:id` | VULNERABILITY_READ | Get exception detail |
| POST | `/:id/approve` | VULNERABILITY_EXCEPTION | Approve exception (not self) |
| POST | `/:id/revoke` | VULNERABILITY_EXCEPTION | Revoke active exception |

### Posture Trends (`/api/v1/posture`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/org` | VULNERABILITY_READ | Org-wide posture trend (date range) |
| GET | `/image/:imageId` | VULNERABILITY_READ | Image posture history |
| GET | `/leaderboard` | VULNERABILITY_READ | Best/worst/most-improved images |
| GET | `/weekly-digest` | VULNERABILITY_READ | Weekly digest data |

### Policies (`/api/v1/policies`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/` | POLICY_MANAGE | Create policy |
| GET | `/` | VULNERABILITY_READ | List policies |
| GET | `/:id` | VULNERABILITY_READ | Get policy |
| PATCH | `/:id` | POLICY_MANAGE | Update policy |
| DELETE | `/:id` | POLICY_MANAGE | Delete (not if isDefault) |
| POST | `/:id/set-default` | POLICY_MANAGE | Set as default policy |

### Webhooks (`/api/v1/webhooks`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/` | WEBHOOK_MANAGE | Create webhook |
| GET | `/` | WEBHOOK_MANAGE | List webhooks |
| GET | `/:id` | WEBHOOK_MANAGE | Get webhook + delivery history |
| PATCH | `/:id` | WEBHOOK_MANAGE | Update webhook |
| DELETE | `/:id` | WEBHOOK_MANAGE | Delete webhook |
| POST | `/:id/test` | WEBHOOK_MANAGE | Send test payload |

### Live Scan (`/api/v1/live-scan`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/` | LIVE_SCAN_CREATE | Submit image for live gate |
| GET | `/:id` | LIVE_SCAN_CREATE | Poll scan status |
| GET | `/:id/events` | LIVE_SCAN_CREATE | SSE stream for real-time progress |

### NVD Watch Status (`/api/v1/nvd-watch`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/status` | ADMIN (system only) | Last sync time, counts |
| GET | `/recent` | VULNERABILITY_READ | Recently watched CVEs + rescan activity |

---

## 9. Frontend Pages & Routes

### New Pages

| Route | Page | Description |
|-------|------|-------------|
| `/blast-radius` | Blast Radius Search | CVE/package search, fleet impact, bulk rescan |
| `/posture` | Security Posture | Org trend chart, leaderboard, image posture history |
| `/assignments` | Vulnerability Assignments | Owned assignments, SLA status, remediation workflow |
| `/exceptions` | CVE Exceptions | Create/approve/revoke exceptions, expired exception list |
| `/live-scan` | Live Image Gate | Submit image, real-time scan progress, download gated image |
| `/policies` | Scan Policies | CRUD for policies, default policy management |
| `/webhooks` | Webhooks | Create webhooks, delivery history, test delivery |

### Modified Pages

| Route | Changes |
|-------|---------|
| `/dashboard` | Add posture score trend chart, blast radius quick search widget, SLA breach count card |
| `/scans` | Add regression badge on scan rows, diff link on each scan |
| `/scans/:id` | Add diff tab showing introduced/resolved/persisted CVEs |
| `/vulnerabilities` | Add "Assign" button, show suppressed toggle for exceptions, add "fixable" filter |
| `/images/:id` | Add posture score history chart, add assignments tab |
| `/settings` | Add NVD watch status section in admin tab |

### Dashboard Additions

The main dashboard (`/dashboard`) shall be extended with:

1. **Posture Score Card** — Current org-wide posture score (0–100) with 30-day trend indicator (up/down/unchanged).
2. **SLA Breach Counter** — Count of assignments currently breached. Links to `/assignments?filter=breached`.
3. **Blast Radius Quick Search** — Inline CVE search box that navigates to `/blast-radius?cve=:input`.
4. **Regression Alert Feed** — Last 5 scans where `regressionDetected = true`, with image name and delta score.

---

## 10. Non-Functional Requirements

### Performance

| Requirement | Target |
|-------------|--------|
| Blast radius query (500 images) | < 2 seconds |
| Scan diff computation | < 500ms (background, does not block scan completion) |
| Posture snapshot write (after scan) | < 100ms (synchronous, before scan marked COMPLETED) |
| NVD feed sync (1000 CVEs) | < 60 seconds |
| Live scan (small image, clean cache) | < 3 minutes end-to-end |
| Live scan (cached digest hit) | < 500ms |

### Reliability

- NVD cron failure shall not affect scan processing. The two processes are independent.
- SLA breach cron failure shall be retried on the next scheduled run (idempotent — mark breached only if not already breached).
- Webhook delivery failure shall not affect the primary operation that triggered it (fire-and-forget with async retry queue).
- PostureSnapshot write failure shall log an error but not fail the scan job.

### Security

- Exception approver cannot be the creator (enforced at service layer, not just UI).
- Webhook secrets shall be stored encrypted (AES-256-GCM) in the database.
- Live scan presigned URLs shall use MinIO's presigned URL mechanism with 1-hour expiry.
- NVD API calls shall not include any user or organization data.
- Scan diff computation uses only data already in the database — no external calls.

### Data Retention

- PostureSnapshots: retain indefinitely (time-series data is the point).
- WebhookDeliveries: retain last 50 per webhook (enforced by cleanup cron).
- CveWatch records: retain 90 days.
- LiveScan records: retain 30 days. MinIO tarballs deleted on presigned URL expiry.
- ScanDiff records: retain as long as the parent scan record exists.

---

## 11. Implementation Roadmap

### Phase 1 — Database & Core Infrastructure (Week 1–2)

**Goal:** All new Prisma models migrated, no application code yet.

1. Add all new models and enums to `schema.prisma`
2. Run and test Prisma migration
3. Update seed file to include: 2 default ScanPolicies (strict + standard), seeded test exceptions, test assignments
4. Update TypeScript types throughout where Vulnerability model has new fields
5. Fix existing issue: store `fixedVersion`, `pkgName`, `pkgVersion` from Trivy output in the scan worker (these fields exist in Trivy JSON but are currently discarded)

**Deliverable:** All models exist in DB, seed runs cleanly, existing functionality unaffected.

---

### Phase 2 — Blast Radius + Scan Diff (Week 3–4)

**Goal:** The two highest-value features that require only new database queries on existing data.

1. Implement `BlastRadiusService` (CVE query, package query, bulk rescan trigger)
2. Implement `ScanDiffService` (compute diff, detect regression)
3. Integrate diff computation into scan worker: after scan completes, queue a diff job
4. Add blast radius routes and Zod schemas
5. Add scan diff routes (GET `/:id/diff`, GET `/diff?scanA&scanB`)
6. Frontend: `/blast-radius` page with search, results table, rescan button
7. Frontend: Scan detail page diff tab (introduced/resolved/persisted tabs)
8. Frontend: Regression badge on scan list rows

**Deliverable:** `/blast-radius` page functional. Scan detail shows diff. Demo-ready.

---

### Phase 3 — Posture Trend Engine (Week 5)

**Goal:** Historical posture scoring, trend visualization.

1. Implement posture score formula and `PostureSnapshot` writer in scan worker
2. Implement `PostureService` (org trend, image history, leaderboard)
3. Add posture routes
4. Frontend: `/posture` page with org trend chart (Recharts LineChart), leaderboard table
5. Frontend: Dashboard posture score card with 30-day trend indicator
6. Frontend: Image detail posture score history mini-chart

**Deliverable:** Posture trend page shows real data for all past scans (retroactively computed via migration script).

---

### Phase 4 — Lifecycle Management + Exceptions (Week 6–7)

**Goal:** Ownership, SLA, and risk acceptance workflow.

1. Implement `AssignmentService` (assign, status update, SLA calc, auto-resolve on rescan)
2. Implement SLA breach cron (daily at 02:00 UTC)
3. Implement `ExceptionService` (create, approve, two-person rule enforcement, active check on vuln queries)
4. Implement exception expiry cron (daily at 02:00 UTC)
5. Add assignment routes and exception routes
6. Update vulnerability queries to filter active exceptions by default (add `suppressedCount` to posture snapshot)
7. Frontend: "Assign" button on vulnerability rows
8. Frontend: `/assignments` page with SLA status indicators and breach alerts
9. Frontend: `/exceptions` page with approval workflow UI
10. Frontend: Vulnerabilities page "show suppressed" toggle

**Deliverable:** Full lifecycle workflow demo-able end-to-end. Compliance report API returns meaningful MTTR data.

---

### Phase 5 — NVD Auto-Rescan + Webhooks (Week 8–9)

**Goal:** Proactive security — FortifyCI acts without being asked.

1. Implement `NvdFeedService` (NVD API integration, CVE parsing, affected image matching)
2. Implement NVD sync cron (every 6 hours)
3. Implement `WebhookService` (HMAC signing, delivery with retry, delivery history)
4. Add webhook routes
5. Wire webhook events: scan.completed, scan.regression_detected, sla.breached, nvd.critical_cve_found
6. Frontend: `/webhooks` page with delivery history and test button
7. Frontend: Dashboard NVD sync status widget (admin only)
8. Frontend: Settings page NVD watch status section

**Deliverable:** New CVE in NVD triggers automatic rescan. Webhook delivers signed payloads to test endpoint.

---

### Phase 6 — Scan Policy Engine + Live Gate (Week 10–11)

**Goal:** Enforcement features — FortifyCI can block, not just report.

1. Implement `PolicyService` (CRUD, glob pattern matching, policy evaluation)
2. Integrate policy evaluation into scan worker output
3. Implement `LiveScanService` (skopeo pull, scan, policy eval, MinIO upload, presigned URL)
4. Add SSE endpoint for live scan progress
5. Add policy routes and live scan routes
6. Frontend: `/policies` page with policy builder UI
7. Frontend: `/live-scan` page with SSE progress visualization and download button

**Deliverable:** Policy builder works. Live scan gates images against policy.

---

### Phase 7 — GitHub Actions + Polish (Week 12)

**Goal:** CI/CD integration and production readiness.

1. Create `fortifyci/scan-action` repository with TypeScript action
2. Implement action: call FortifyCI API, poll for result, write job summary, exit with correct code
3. Write README with integration examples
4. API key authentication support for CI (already exists in v1.0 — verify it works for all new endpoints)
5. Fix all known issues from v1.0 (localStorage JWT, report files on MinIO, stale scan sweep cron, registry credentials for Trivy)
6. Update Swagger docs for all new endpoints
7. Update `FORTIFYCI_COMPREHENSIVE_DOC.md` to reflect v2.0

**Deliverable:** Working GitHub Actions integration. v1.0 bugs fixed. Full documentation updated.

---

## 12. Success Metrics

These are the criteria against which v2.0 shall be evaluated at completion:

| Metric | Target |
|--------|--------|
| Blast radius query accuracy | Returns 100% of images with matching CVE in test dataset |
| Scan diff accuracy | Zero false positives/negatives on a known test pair |
| SLA breach detection | Breached assignments marked within 1 minute of cron run |
| Exception suppression | Active exception removes CVE from all counts and lists |
| Posture score consistency | Same scan data always produces same score (deterministic) |
| NVD sync reliability | No missed CVE batches over 7-day test run |
| Webhook delivery | > 99% successful delivery rate for reachable endpoints |
| Live scan end-to-end | Completes in < 3 minutes for a 100MB Alpine-based image |
| CI action | Fails workflow on CRITICAL CVE, passes on clean image |

---

## 13. Out of Scope (v3.0)

These features are architecturally sound and would further differentiate FortifyCI, but are deferred to v3.0 to keep v2.0 shippable.

**Kubernetes Admission Webhook**
A mutating/validating admission webhook that intercepts pod creation requests, checks the image reference against FortifyCI scan data, and blocks deployments of images that fail policy. This is the most powerful enforcement mechanism and would position FortifyCI as infrastructure-level security rather than a dashboard. Deferred due to complexity of k8s API server integration, TLS certificate management, and the need for a test k8s cluster in the development environment.

**Base Image Inheritance Graph**
Track which images share common base layers and build a DAG (directed acyclic graph) of image relationships. Fixing a vulnerability in a base image automatically propagates the fix status to all derived images. Deferred due to the complexity of layer digest analysis and graph storage/query requirements.

**Registry Proxy Mode**
Act as a transparent Docker registry proxy. When a client runs `docker pull fortifyci.domain.com/ghcr.io/owner/image:tag`, FortifyCI intercepts the request, scans the image, and either proxies through or returns a 403. Deferred due to the complexity of implementing the Docker Registry V2 API and the operational burden of running as a production registry proxy.

**Policy-as-Code**
Allow policies to be defined in a YAML/Rego DSL committed to a git repository, with FortifyCI automatically syncing policy changes from the repo. Deferred because the GUI policy builder in v2.0 covers the core use case; policy-as-code is an enterprise feature for GitOps workflows.

**Multi-tenancy**
Organization-level isolation where multiple organizations can use the same FortifyCI instance with complete data separation. Deferred because v2.0 targets single-organization deployment (self-hosted).

---

*FortifyCI v2.0 PRD — Engineering Confidential*  
*For implementation questions, refer to FORTIFYCI_ARCHITECTURE_V2.md and FORTIFYCI_API_SPEC_V2.md*