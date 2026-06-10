# FortifyCI Test Images

Intentionally vulnerable Docker images for testing FortifyCI scanning capabilities.

## Images

### 1. legacy-base
- **Base:** Ubuntu 16.04 (end-of-life, many CVEs)
- **Bugs:** Root SSH with weak password, Node.js 8, Django 1.8, hardcoded secrets in ENV
- **Ports:** 22, 80, 3000

### 2. vulnerable-node
- **Base:** Node.js 12 (end-of-life)
- **Bugs:** SSH enabled as root, debugger exposed (9229), command injection in app, vulnerable npm packages, hardcoded secrets
- **Ports:** 22, 3000, 9229

### 3. misconfigured-nginx
- **Base:** Nginx 1.14.2 (old version with CVEs)
- **Bugs:** Running as root, SSH access, directory listing enabled, secrets file exposed, self-signed SSL, no security headers
- **Ports:** 22, 80, 443

### 4. secrets-leak
- **Base:** Alpine 3.7 (end-of-life)
- **Bugs:** SSH keys, .env with credentials, JSON credential file, config files with DB passwords, API keys everywhere
- **Ports:** 22, 3000

## Usage

Build all images:
```bash
docker compose -f test-images/docker-compose.yml build
```

Start all containers:
```bash
docker compose -f test-images/docker-compose.yml up -d
```

Stop and remove:
```bash
docker compose -f test-images/docker-compose.yml down
```

## What FortifyCI Will Detect

- **OS-level CVEs** in outdated base images (Ubuntu 16.04, Alpine 3.7, Node 12)
- **Vulnerable npm packages** in legacy-base and vulnerable-node
- **Hardcoded secrets** in environment variables, files, and configs
- **Misconfigurations:** root user, SSH enabled, debug ports exposed, weak passwords
- **Outdated software:** old Python, Django, OpenSSL versions
