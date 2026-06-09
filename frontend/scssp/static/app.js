const STORE = { dark: true, user: null, loggedIn: false };
const DB = {
  users: [
    { email: 'admin@scssp.io', password: 'admin123', name: 'Sarah Chen', role: 'Security Lead' },
    { email: 'demo@scssp.io', password: 'demo123', name: 'Demo User', role: 'Security Analyst' }
  ],
  images: [
    { id: 'img1', name: 'nginx:1.25', registry: 'docker.io', tag: '1.25', digest: 'sha256:a1b2c3d4...', size: '187 MB', vulns: { critical: 2, high: 4, medium: 8, low: 3 }, status: 'vulnerable', lastScan: '2026-06-07T14:30:00Z', layers: 28, os: 'Ubuntu 22.04' },
    { id: 'img2', name: 'node:20-slim', registry: 'docker.io', tag: '20-slim', digest: 'sha256:e5f6g7h8...', size: '112 MB', vulns: { critical: 0, high: 1, medium: 5, low: 12 }, status: 'clean', lastScan: '2026-06-07T13:00:00Z', layers: 18, os: 'Debian 12' },
    { id: 'img3', name: 'python:3.12', registry: 'docker.io', tag: '3.12', digest: 'sha256:i9j0k1l2...', size: '334 MB', vulns: { critical: 1, high: 3, medium: 6, low: 9 }, status: 'vulnerable', lastScan: '2026-06-06T22:15:00Z', layers: 24, os: 'Debian 12' },
    { id: 'img4', name: 'alpine:3.20', registry: 'docker.io', tag: '3.20', digest: 'sha256:m3n4o5p6...', size: '7.8 MB', vulns: { critical: 0, high: 0, medium: 1, low: 2 }, status: 'clean', lastScan: '2026-06-07T10:45:00Z', layers: 7, os: 'Alpine 3.20' },
    { id: 'img5', name: 'redis:7.2', registry: 'docker.io', tag: '7.2', digest: 'sha256:q7r8s9t0...', size: '117 MB', vulns: { critical: 0, high: 2, medium: 3, low: 1 }, status: 'vulnerable', lastScan: '2026-06-06T18:30:00Z', layers: 15, os: 'Debian 12' },
    { id: 'img6', name: 'postgres:16', registry: 'docker.io', tag: '16', digest: 'sha256:u1v2w3x4...', size: '412 MB', vulns: { critical: 1, high: 5, medium: 7, low: 4 }, status: 'vulnerable', lastScan: '2026-06-05T14:00:00Z', layers: 22, os: 'Debian 12' },
    { id: 'img7', name: 'golang:1.22', registry: 'docker.io', tag: '1.22', digest: 'sha256:y5z6a7b8...', size: '823 MB', vulns: { critical: 0, high: 2, medium: 4, low: 6 }, status: 'vulnerable', lastScan: '2026-06-07T08:00:00Z', layers: 20, os: 'Debian 12' },
    { id: 'img8', name: 'ubuntu:24.04', registry: 'docker.io', tag: '24.04', digest: 'sha256:c9d0e1f2...', size: '78 MB', vulns: { critical: 0, high: 0, medium: 2, low: 5 }, status: 'clean', lastScan: '2026-06-04T12:00:00Z', layers: 6, os: 'Ubuntu 24.04' }
  ],
  scans: [
    { id: 'sc1', name: 'Weekly CI/CD Scan', image: 'nginx:1.25', status: 'completed', severity: 'critical', findings: 17, critical: 2, high: 4, medium: 8, low: 3, duration: '47s', date: '2026-06-07T14:30:00Z', scanner: 'Trivy v0.55.2' },
    { id: 'sc2', name: 'Deployment Gate Check', image: 'node:20-slim', status: 'completed', severity: 'warning', findings: 18, critical: 0, high: 1, medium: 5, low: 12, duration: '34s', date: '2026-06-07T13:00:00Z', scanner: 'Grype v0.82.0' },
    { id: 'sc3', name: 'Nightly Deep Scan', image: 'python:3.12', status: 'running', severity: null, findings: 0, critical: 0, high: 0, medium: 0, low: 0, duration: '2m 14s', date: '2026-06-07T22:00:00Z', scanner: 'Trivy v0.55.2' },
    { id: 'sc4', name: 'Base Image Audit', image: 'alpine:3.20', status: 'completed', severity: 'clean', findings: 3, critical: 0, high: 0, medium: 1, low: 2, duration: '12s', date: '2026-06-07T10:45:00Z', scanner: 'Grype v0.82.0' },
    { id: 'sc5', name: 'Redis Security Review', image: 'redis:7.2', status: 'completed', severity: 'warning', findings: 6, critical: 0, high: 2, medium: 3, low: 1, duration: '28s', date: '2026-06-06T18:30:00Z', scanner: 'Trivy v0.55.2' },
    { id: 'sc6', name: 'Postgres Compliance', image: 'postgres:16', status: 'failed', severity: 'critical', findings: 17, critical: 1, high: 5, medium: 7, low: 4, duration: '1m 03s', date: '2026-06-05T14:00:00Z', scanner: 'Clair v4.7.0' },
    { id: 'sc7', name: 'Golang Pipeline Scan', image: 'golang:1.22', status: 'queued', severity: null, findings: 0, critical: 0, high: 0, medium: 0, low: 0, duration: '--', date: '2026-06-07T23:00:00Z', scanner: 'Grype v0.82.0' }
  ],
  vulnerabilities: [
    { id: 'CVE-2025-31252', pkg: 'libssl3', version: '3.0.15-1', severity: 'critical', cvss: 9.8, status: 'fixed', fixVersion: '3.0.16-1', img: 'postgres:16', exploit: true, published: '2025-05-20', desc: 'Buffer overflow in TLS handshake leading to RCE' },
    { id: 'CVE-2025-28764', pkg: 'nginx', version: '1.25.5', severity: 'critical', cvss: 9.1, status: 'fixed', fixVersion: '1.26.0', img: 'nginx:1.25', exploit: true, published: '2025-04-12', desc: 'HTTP/3 heap buffer overflow allows remote code execution' },
    { id: 'CVE-2025-29873', pkg: 'openssl', version: '3.2.1', severity: 'critical', cvss: 9.1, status: 'patched', fixVersion: '3.2.2', img: 'python:3.12', exploit: false, published: '2025-06-01', desc: 'Certificate verification bypass via crafted chain' },
    { id: 'CVE-2025-27142', pkg: 'libcurl4', version: '8.4.0', severity: 'high', cvss: 8.6, status: 'fixed', fixVersion: '8.5.0', img: 'postgres:16', exploit: true, published: '2025-03-10', desc: 'Double-free in HTTP/2 stream handling' },
    { id: 'CVE-2025-28901', pkg: 'redis-server', version: '7.2.5', severity: 'high', cvss: 8.2, status: 'fixed', fixVersion: '7.2.6', img: 'redis:7.2', exploit: false, published: '2025-04-28', desc: 'ACL bypass via crafted Lua scripts' },
    { id: 'CVE-2025-25678', pkg: 'openjdk-17-jre', version: '17.0.12', severity: 'high', cvss: 7.8, status: 'wont-fix', fixVersion: null, img: 'golang:1.22', exploit: false, published: '2025-02-15', desc: 'XML parsing vulnerability in JAX-WS' },
    { id: 'CVE-2025-30234', pkg: 'glibc', version: '2.37-9', severity: 'high', cvss: 8.8, status: 'fixed', fixVersion: '2.37-10', img: 'nginx:1.25', exploit: true, published: '2025-05-05', desc: 'LD_PRELOAD privilege escalation in dynamic linker' },
    { id: 'CVE-2025-29011', pkg: 'postgresql-16', version: '16.4', severity: 'high', cvss: 8.0, status: 'fixed', fixVersion: '16.5', img: 'postgres:16', exploit: false, published: '2025-05-18', desc: 'SQL injection via pg_catalog functions' },
    { id: 'CVE-2025-27893', pkg: 'python3.12', version: '3.12.4', severity: 'medium', cvss: 6.5, status: 'fixed', fixVersion: '3.12.5', img: 'python:3.12', exploit: false, published: '2025-04-02', desc: 'Zip slip vulnerability in tarfile module' },
    { id: 'CVE-2025-29566', pkg: 'node', version: '20.14.0', severity: 'medium', cvss: 5.5, status: 'patched', fixVersion: '20.15.0', img: 'node:20-slim', exploit: false, published: '2025-05-30', desc: 'FS permission bypass via symlinks' },
    { id: 'CVE-2025-26789', pkg: 'git', version: '2.43.0', severity: 'critical', cvss: 9.3, status: 'patched', fixVersion: '2.44.0', img: 'golang:1.22', exploit: true, published: '2025-03-22', desc: 'Format string vulnerability in git log --format' }
  ],
  reports: [
    { id: 'r1', title: 'Q2 Security Audit Report', type: 'comprehensive', format: 'PDF', status: 'completed', date: '2026-06-01', pages: 47, createdBy: 'Sarah Chen' },
    { id: 'r2', title: 'June Vulnerability Summary', type: 'summary', format: 'PDF', status: 'completed', date: '2026-06-07', pages: 12, createdBy: 'Sarah Chen' },
    { id: 'r3', title: 'Postgres Compliance Report', type: 'compliance', format: 'HTML', status: 'completed', date: '2026-06-05', pages: 23, createdBy: 'Sarah Chen' },
    { id: 'r4', title: 'Monthly SBOM Export', type: 'sbom', format: 'SPDX', status: 'completed', date: '2026-06-01', pages: 156, createdBy: 'System' },
    { id: 'r5', title: 'Weekly CI/CD Pipeline Scan', type: 'summary', format: 'PDF', status: 'generating', date: '2026-06-07', pages: 0, createdBy: 'Sarah Chen' }
  ],
  notifications: [
    { id: 'n1', title: 'Critical CVE Detected', message: 'CVE-2025-31252 (CVSS 9.8) affects postgres:16 in production', severity: 'critical', unread: true, time: '2 hours ago', img: 'postgres:16', action: 'View vulnerability', page: 'vulns' },
    { id: 'n2', title: 'Scan Completed', message: 'Weekly CI/CD scan for nginx:1.25 completed with 17 findings', severity: 'warning', unread: true, time: '4 hours ago', img: 'nginx:1.25', action: 'View scan', page: 'scans' },
    { id: 'n3', title: 'Exploit Available', message: 'Proof of concept published for CVE-2025-28764 affecting nginx:1.25', severity: 'critical', unread: true, time: '6 hours ago', img: 'nginx:1.25', action: 'View exploit', page: 'vulns' },
    { id: 'n4', title: 'Base Image Updated', message: 'Alpine 3.20 image re-scanned - 3 low severity findings', severity: 'info', unread: false, time: '8 hours ago', img: 'alpine:3.20', action: 'View image', page: 'images' },
    { id: 'n5', title: 'Policy Violation', message: 'Postgres 16 exceeds critical vulnerability threshold in production', severity: 'warning', unread: true, time: '1 day ago', img: 'postgres:16', action: 'Review policy', page: 'settings' },
    { id: 'n6', title: 'API Key Rotated', message: 'CI/CD API key was successfully rotated by admin', severity: 'info', unread: false, time: '2 days ago', img: null, action: null },
    { id: 'n7', title: 'Report Generated', message: 'Q2 Security Audit Report is ready for download', severity: 'success', unread: false, time: '2 days ago', img: null, action: 'Download', page: 'reports' }
  ],
  chartData: {
    scanTrend: [
      { month: 'Jan', scans: 142, vulns: 38 }, { month: 'Feb', scans: 165, vulns: 42 },
      { month: 'Mar', scans: 189, vulns: 35 }, { month: 'Apr', scans: 203, vulns: 51 },
      { month: 'May', scans: 220, vulns: 45 }, { month: 'Jun', scans: 198, vulns: 29 }
    ],
    monthlySeverity: [
      { month: 'Jan', critical: 12, high: 18, medium: 24, low: 15 },
      { month: 'Feb', critical: 8, high: 22, medium: 28, low: 18 },
      { month: 'Mar', critical: 15, high: 14, medium: 19, low: 22 },
      { month: 'Apr', critical: 20, high: 25, medium: 31, low: 14 },
      { month: 'May', critical: 10, high: 20, medium: 26, low: 19 },
      { month: 'Jun', critical: 5, high: 12, medium: 18, low: 11 }
    ],
    sevDist: [
      { label: 'Critical', value: 3, color: '#EF4444' },
      { label: 'High', value: 5, color: '#F59E0B' },
      { label: 'Medium', value: 2, color: '#3B82F6' },
      { label: 'Low', value: 1, color: '#71717A' }
    ]
  }
};

function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }
function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function toast(msg, type = 'info') {
  const c = $('#toast-container');
  const icons = { info: '○', success: '●', error: '◆', warning: '◇' };
  const colors = { info: '#3B82F6', success: '#22C55E', error: '#EF4444', warning: '#F59E0B' };
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span style="color:${colors[type]}">${icons[type]||'○'}</span> ${escHtml(msg)}`;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateY(-8px)'; el.style.transition='all .2s'; setTimeout(()=>el.remove(),200) }, 3000);
}

function navigate(page) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const target = $(`#page-${page}`);
  if (target) {
    target.classList.add('active');
    const link = $(`.sidebar-nav a[data-page="${page}"]`);
    if (link) link.classList.add('active');
    STORE.currentPage = page;
    document.title = `SCSSP — ${target.dataset.title || page}`;
    renderBreadcrumbs(page);
  }
}

function renderBreadcrumbs(page) {
  const names = { dashboard:'Dashboard', images:'Images', scans:'Scans', vulns:'Vulnerabilities', sbom:'SBOM', reports:'Reports', notifications:'Notifications', settings:'Settings' };
  $('#breadcrumbs').innerHTML = `<span style="color:var(--muted)">SCSSP</span><span style="color:var(--muted);margin:0 6px">/</span><span style="color:var(--fg)">${names[page]||page}</span>`;
}

function login(email, password) {
  const u = DB.users.find(x => x.email === email && x.password === password);
  if (!u) { toast('Invalid email or password', 'error'); return false; }
  STORE.user = { name: u.name, email: u.email, role: u.role };
  STORE.loggedIn = true;
  $('#app-auth').style.display = 'none';
  $('#app-main').style.display = 'flex';
  navigate('dashboard');
  toast(`Welcome back, ${u.name}`, 'success');
  renderUserChip();
  renderDashboard();
  return true;
}
function logout() { STORE.loggedIn = false; STORE.user = null; $('#app-main').style.display = 'none'; $('#app-auth').style.display = 'flex'; $('#login-page').style.display='block'; $$('.auth-page').forEach(p=>p.style.display='none'); }

function renderUserChip() {
  if (!STORE.user) return;
  $('#user-name').textContent = STORE.user.name;
  $('#user-role').textContent = STORE.user.role;
  $('#user-avatar').textContent = STORE.user.name.split(' ').map(s=>s[0]).join('').slice(0,2);
}

function initAuth() {
  $('#login-form').addEventListener('submit', e => {
    e.preventDefault();
    login($('#login-email').value, $('#login-password').value);
  });
  $('#register-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#register-name').value;
    const email = $('#register-email').value;
    const pw = $('#register-password').value;
    if (!email||!pw||!name) { toast('Please fill in all fields', 'error'); return; }
    if (DB.users.find(u=>u.email===email)) { toast('Email already registered', 'error'); return; }
    DB.users.push({ email, password: pw, name, role: 'Security Analyst' });
    toast('Account created! Please log in.', 'success');
    showAuthPage('login');
  });
  $('#forgot-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#forgot-email').value;
    if (!email) { toast('Enter your email', 'error'); return; }
    toast('Password reset link sent to your email', 'success');
    showAuthPage('login');
  });
  $$('.auth-toggle').forEach(a => a.addEventListener('click', e => { e.preventDefault(); showAuthPage(a.dataset.page); }));
}

function showAuthPage(page) {
  $$('.auth-page').forEach(p => p.style.display = 'none');
  $(`#${page}-page`).style.display = 'block';
}

function renderDashboard() {
  renderStats();
  renderSeverityChart();
  renderAreaChart();
  renderBarChart();
  renderRecentScans();
  renderImagesAtRisk();
}

function renderStats() {
  const totalImages = DB.images.length;
  const vulnImg = DB.images.filter(i => i.status === 'vulnerable').length;
  const totalScans = DB.scans.length;
  const totalVulns = DB.vulnerabilities.length;
  const criticalVulns = DB.vulnerabilities.filter(v => v.severity === 'critical').length;
  const cleanImages = DB.images.filter(i => i.status === 'clean').length;
  const stats = [
    { icon: '■', color: 'rgba(37,99,235,0.12)', fc: '#3B82F6', label: 'Total Images', value: totalImages },
    { icon: '⚠', color: 'rgba(245,158,11,0.12)', fc: '#F59E0B', label: 'Vulnerable Images', value: vulnImg },
    { icon: '●', color: 'rgba(34,197,94,0.12)', fc: '#22C55E', label: 'Clean Images', value: cleanImages },
    { icon: '◆', color: 'rgba(239,68,68,0.12)', fc: '#EF4444', label: 'Critical Vulns', value: criticalVulns },
    { icon: '📋', color: 'rgba(37,99,235,0.12)', fc: '#3B82F6', label: 'Total Scans', value: totalScans },
    { icon: '🔍', color: 'rgba(168,85,247,0.12)', fc: '#A855F7', label: 'Total CVEs', value: totalVulns }
  ];
  $('#stat-grid').innerHTML = stats.map(s => `<div class="card stat-card"><div class="stat-icon" style="background:${s.color};color:${s.fc}">${s.icon}</div><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`).join('');
}

function renderSeverityChart() {
  const d = DB.chartData.sevDist;
  const total = d.reduce((s,x) => s + x.value, 0) || 1;
  const colors = ['#EF4444','#F59E0B','#3B82F6','#71717A'];
  let cumulative = 0;
  const segments = d.map((s,i) => {
    const pct = s.value / total * 100;
    const dash = `${pct} ${100-pct}`;
    const offset = -cumulative;
    cumulative += pct;
    return `<circle cx="50" cy="50" r="38" fill="none" stroke="${colors[i]}" stroke-width="10" stroke-dasharray="${dash}" stroke-dashoffset="${offset}" transform="rotate(-90 50 50)" style="transition:stroke-dasharray .5s"/>`;
  }).join('');
  $('#sev-chart').innerHTML = `<svg viewBox="0 0 100 100" style="width:180px;height:180px">${segments}</svg><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><div style="font-size:28px;font-weight:700;color:#fff">${total}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">Total CVEs</div></div>`;
  $('#sev-legend').innerHTML = d.map((s,i) => `<div class="flex-center" style="gap:8px;font-size:12px"><span style="width:8px;height:8px;border-radius:50%;background:${colors[i]};display:inline-block"></span><span style="color:var(--muted)">${s.label}</span><span style="margin-left:auto;font-weight:600;color:#fff">${s.value}</span></div>`).join('');
}

function renderAreaChart() {
  const d = DB.chartData.scanTrend;
  const w = 600, h = 200, pad = {t:20,r:20,b:30,l:40};
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const maxY = Math.max(...d.map(x => Math.max(x.scans, x.vulns))) * 1.15;
  const xScale = (i) => pad.l + (i / (d.length-1)) * cw;
  const yScale = (v) => pad.t + ch - (v / maxY) * ch;
  const line = (data, color) => {
    const pts = data.map((v,i) => `${xScale(i)},${yScale(v)}`).join(' ');
    const area = data.map((v,i) => `${xScale(i)},${yScale(v)}`).join(' ') + ` ${xScale(d.length-1)},${pad.t+ch} ${xScale(0)},${pad.t+ch}`;
    return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polygon points="${area}" fill="${color}15" stroke="none"/>`;
  };
  const gridLines = [0,0.25,0.5,0.75,1].map(f => {
    const y = pad.t + ch - f * ch;
    return `<line x1="${pad.l}" y1="${y}" x2="${pad.l+cw}" y2="${y}" stroke="rgba(39,39,42,0.5)" stroke-width="1"/><text x="${pad.l-8}" y="${y+4}" text-anchor="end" fill="var(--muted)" font-size="10">${Math.round(maxY*f)}</text>`;
  }).join('');
  const xLabels = d.map((d,i) => `<text x="${xScale(i)}" y="${pad.t+ch+18}" text-anchor="middle" fill="var(--muted)" font-size="10">${d.month}</text>`).join('');
  $('#area-chart').innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:100%">${gridLines}${line(d.map(x=>x.scans),'#3B82F6')}${line(d.map(x=>x.vulns),'#EF4444')}${xLabels}<text x="${pad.l+cw-60}" y="${pad.t-6}" fill="#3B82F6" font-size="10">Scans</text><text x="${pad.l+cw-60}" y="${pad.t+10}" fill="#EF4444" font-size="10">Vulns</text></svg>`;
}

function renderBarChart() {
  const d = DB.chartData.monthlySeverity;
  const colors = {critical:'#EF4444',high:'#F59E0B',medium:'#3B82F6',low:'#71717A'};
  const keys = ['critical','high','medium','low'];
  const w = 600, h = 200, pad = {t:20,r:20,b:30,l:40};
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const barW = cw / d.length * 0.7;
  const maxY = Math.max(...d.map(x => keys.reduce((s,k)=>s+x[k],0))) * 1.15;
  let bars = '';
  d.forEach((row, i) => {
    const cx = pad.l + (i / (d.length-1)) * cw;
    let yBot = pad.t + ch;
    keys.forEach(k => {
      const hh = (row[k] / maxY) * ch;
      bars += `<rect x="${cx-barW/2}" y="${yBot-hh}" width="${barW/d.length*0.85}" height="${hh}" fill="${colors[k]}" opacity="0.85" rx="2"/>`;
      yBot -= hh;
    });
  });
  const gridLines = [0,0.25,0.5,0.75,1].map(f => {
    const y = pad.t + ch - f * ch;
    return `<line x1="${pad.l}" y1="${y}" x2="${pad.l+cw}" y2="${y}" stroke="rgba(39,39,42,0.5)" stroke-width="1"/><text x="${pad.l-8}" y="${y+4}" text-anchor="end" fill="var(--muted)" font-size="10">${Math.round(maxY*f)}</text>`;
  }).join('');
  const xLabels = d.map((d,i) => {
    const cx = pad.l + (i / (d.length-1)) * cw;
    return `<text x="${cx}" y="${pad.t+ch+18}" text-anchor="middle" fill="var(--muted)" font-size="10">${d.month}</text>`;
  }).join('');
  $('#bar-chart').innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:100%">${gridLines}${bars}${xLabels}</svg>`;
}

function renderRecentScans() {
  const recent = DB.scans.slice(0, 3);
  const sevLabel = { critical: 'Critical', warning: 'Warning', clean: 'Clean' };
  const sevBadge = { critical: 'badge-critical', warning: 'badge-warning', clean: 'badge-success' };
  const statusI = { completed: 'completed', running: 'running', failed: 'failed', queued: 'queued' };
  $('#recent-scans').innerHTML = recent.map(s => `<tr><td><div class="flex-center"><span class="status-dot ${statusI[s.status]}"></span>${escHtml(s.name)}</div></td><td>${escHtml(s.image)}</td><td><span class="badge ${sevBadge[s.severity]||'badge-default'}">${sevLabel[s.severity]||s.severity||'N/A'}</span></td><td>${s.findings}</td><td>${s.duration}</td></tr>`).join('');
}

function renderImagesAtRisk() {
  const atRisk = DB.images.filter(i => i.status === 'vulnerable').slice(0, 4);
  $('#images-risk').innerHTML = atRisk.map(i => `<tr><td><div><div style="font-weight:500">${escHtml(i.name)}</div><div class="text-xs">${i.registry}</div></div></td><td><span class="badge badge-critical">${i.vulns.critical} C</span> <span class="badge badge-warning">${i.vulns.high} H</span></td><td><span class="status-dot ${i.status}"></span>${i.status}</td></tr>`).join('');
}

function renderImages() {
  const q = ($('#img-search')?.value || '').toLowerCase();
  const filtered = DB.images.filter(i => i.name.toLowerCase().includes(q) || i.registry.toLowerCase().includes(q));
  $('#img-table').innerHTML = filtered.map(i => `<tr><td><div><div style="font-weight:500">${escHtml(i.name)}</div><div class="text-xs" style="color:var(--muted)">${i.registry} / ${i.digest}</div></div></td><td>${i.size}</td><td>${i.os}</td><td>${i.layers} layers</td><td><div class="flex-center" style="gap:4px">${i.vulns.critical>0?`<span class="badge badge-critical">${i.vulns.critical}</span>`:''}${i.vulns.high>0?`<span class="badge badge-warning">${i.vulns.high}</span>`:''}${i.vulns.medium>0?`<span class="badge badge-info">${i.vulns.medium}</span>`:''}${i.vulns.low>0?`<span class="badge badge-default">${i.vulns.low}</span>`:''}</div></td><td><span class="status-dot ${i.status}"></span>${i.status}</td><td><span class="text-xs" style="color:var(--muted)">${new Date(i.lastScan).toLocaleDateString()}</span></td></tr>`).join('');
  $('#img-count').textContent = filtered.length;
}

function renderScans() {
  const statusI = { completed: 'completed', running: 'running', failed: 'failed', queued: 'queued' };
  const sevB = { critical: 'badge-critical', warning: 'badge-warning', clean: 'badge-success' };
  const sevL = { critical: 'Critical', warning: 'Warning', clean: 'Clean' };
  $('#scan-table').innerHTML = DB.scans.map(s => `<tr><td><div class="flex-center"><span class="status-dot ${statusI[s.status]}"></span><a href="#" onclick="event.preventDefault();navigate('scans');toast('Scan detail: ${escHtml(s.name)}','info')" style="color:var(--fg);font-weight:500">${escHtml(s.name)}</a></div></td><td>${escHtml(s.image)}</td><td><span class="badge ${s.severity?sevB[s.severity]:'badge-default'}">${s.severity?sevL[s.severity]:'--'}</span></td><td><span style="font-weight:600">${s.findings}</span></td><td>${s.duration}</td><td>${escHtml(s.scanner)}</td><td><span style="color:var(--muted);font-size:12px">${new Date(s.date).toLocaleString()}</span></td></tr>`).join('');
}

function renderVulns() {
  const sevTab = $('#vuln-tabs')?.querySelector('.active');
  const severityFilter = sevTab?.dataset?.sev || 'all';
  const q = ($('#vuln-search')?.value || '').toLowerCase();
  let filtered = DB.vulnerabilities;
  if (severityFilter !== 'all') filtered = filtered.filter(v => v.severity === severityFilter);
  if (q) filtered = filtered.filter(v => v.id.toLowerCase().includes(q) || v.pkg.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q));
  filtered.sort((a,b) => b.cvss - a.cvss);
  const sv = {critical:'badge-critical',high:'badge-warning',medium:'badge-info'};
  const svl = {critical:'Critical',high:'High',medium:'Medium'};
  const st = {fixed:'badge-success',patched:'badge-warning','wont-fix':'badge-default'};
  const stl = {fixed:'Fixed',patched:'Patched','wont-fix':'Won\'t Fix'};
  $('#vuln-table').innerHTML = filtered.map(v => `<tr><td><div><div style="font-weight:500;font-family:'SF Mono',monospace;font-size:12px">${escHtml(v.id)}</div><div style="font-size:12px;color:var(--muted);margin-top:2px">${escHtml(v.desc)}</div></div></td><td><span style="font-family:'SF Mono',monospace">${escHtml(v.pkg)}@${escHtml(v.version)}</span></td><td><span class="badge ${sv[v.severity]||'badge-default'}">${svl[v.severity]||v.severity}</span></td><td><span style="font-weight:600;color:${v.cvss>=9?'#EF4444':v.cvss>=7?'#F59E0B':'#fff'}">${v.cvss.toFixed(1)}</span></td><td><span class="badge ${st[v.status]||'badge-default'}">${stl[v.status]||v.status}</span><br><span class="text-xs">${v.fixVersion ? escHtml(v.fixVersion) : 'N/A'}</span></td><td>${v.exploit?'<span class="badge badge-critical" style="font-size:10px">EXPLOIT</span>':'<span class="badge badge-default" style="font-size:10px">None</span>'}</td><td>${escHtml(v.img)}</td></tr>`).join('');
  $('#vuln-count').textContent = filtered.length;
}

function renderSBOM() {
  const sbomPkgs = [
    { name: 'openssl', version: '3.2.1', license: 'Apache-2.0', supplier: 'OpenSSL Foundation', purl: 'pkg:deb/debian/openssl@3.2.1', type: 'library' },
    { name: 'libcrypto3', version: '3.2.1', license: 'Apache-2.0', supplier: 'OpenSSL Foundation', purl: 'pkg:deb/debian/libcrypto3@3.2.1', type: 'library' },
    { name: 'nginx', version: '1.25.5', license: 'BSD-2-Clause', supplier: 'nginx, Inc.', purl: 'pkg:deb/debian/nginx@1.25.5', type: 'application' },
    { name: 'zlib1g', version: '1.3.1', license: 'Zlib', supplier: 'Mark Adler', purl: 'pkg:deb/debian/zlib1g@1.3.1', type: 'library' },
    { name: 'libcurl4', version: '8.4.0', license: 'MIT', supplier: 'curl project', purl: 'pkg:deb/debian/libcurl4@8.4.0', type: 'library' },
    { name: 'libxml2', version: '2.11.5', license: 'MIT', supplier: 'xmlsoft.org', purl: 'pkg:deb/debian/libxml2@2.11.5', type: 'library' },
    { name: 'python3.12', version: '3.12.4', license: 'PSF-2.0', supplier: 'Python Foundation', purl: 'pkg:deb/debian/python3.12@3.12.4', type: 'application' },
    { name: 'git', version: '2.43.0', license: 'GPL-2.0', supplier: 'Git maintainers', purl: 'pkg:deb/debian/git@2.43.0', type: 'application' },
    { name: 'bash', version: '5.2.21', license: 'GPL-3.0', supplier: 'FSF', purl: 'pkg:deb/debian/bash@5.2.21', type: 'application' },
    { name: 'coreutils', version: '9.4', license: 'GPL-3.0', supplier: 'FSF', purl: 'pkg:deb/debian/coreutils@9.4', type: 'library' }
  ];
  const licAgg = sbomPkgs.reduce((acc, p) => { acc[p.license] = (acc[p.license]||0) + 1; return acc; }, {});
  $('#sbom-pkgs').innerHTML = sbomPkgs.map(p => `<tr><td><div style="font-weight:500">${escHtml(p.name)}</div><div class="text-xs">${escHtml(p.purl)}</div></td><td>${escHtml(p.version)}</td><td><span class="badge badge-outline">${escHtml(p.license)}</span></td><td style="color:var(--muted);font-size:12px">${escHtml(p.supplier)}</td><td><span class="badge badge-default">${p.type}</span></td></tr>`).join('');
  $('#sbom-licenses').innerHTML = Object.entries(licAgg).map(([lic, cnt]) => `<tr><td><span class="badge badge-outline">${escHtml(lic)}</span></td><td style="font-weight:600">${cnt}</td><td style="font-size:12px;color:var(--muted)">${cnt===1?'1 package':cnt+' packages'}</td></tr>`).join('');
  const depTree = [
    { name: 'openssl 3.2.1', deps: ['libcrypto3 3.2.1', 'libssl3 3.0.15'] },
    { name: 'nginx 1.25.5', deps: ['libpcre2 10.42', 'zlib1g 1.3.1'] },
    { name: 'python3.12 3.12.4', deps: ['libexpat 2.6.2', 'libffi 3.4.6', 'libssl3 3.0.15'] },
    { name: 'libcurl4 8.4.0', deps: ['libnghttp2 1.58', 'libidn2 2.3.7', 'openssl 3.2.1'] }
  ];
  $('#sbom-deps').innerHTML = depTree.map(p => `<div class="dep-node"><div class="dep-header"><span style="font-weight:500;font-size:13px">${p.name}</span></div><div class="dep-children">${p.deps.map(d => `<div class="dep-child">${d}</div>`).join('')}</div></div>`).join('');
  const sel = $('#sbom-img-select');
  if (sel) {
    sel.innerHTML = DB.images.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
    sel.onchange = () => toast('SBOM data loading for selected image...', 'info');
  }
}

function renderReports() {
  const types = { comprehensive: 'Comprehensive', summary: 'Summary', compliance: 'Compliance', sbom: 'SBOM' };
  const statusI = { completed: 'completed', generating: 'generating' };
  $('#report-table').innerHTML = DB.reports.map(r => `<tr><td><div><div style="font-weight:500">${escHtml(r.title)}</div><div class="text-xs">${types[r.type]||r.type} · ${r.format}</div></div></td><td><span class="status-dot ${statusI[r.status]}"></span>${r.status}</td><td>${r.pages||'--'} pages</td><td style="color:var(--muted)">${escHtml(r.createdBy)}</td><td style="color:var(--muted);font-size:12px">${new Date(r.date).toLocaleDateString()}</td><td>${r.status==='completed'?`<button class="btn btn-ghost btn-sm" onclick="toast('Downloading ${escHtml(r.title)}...','success')"><span>⬇</span> Download</button>`:'<span class="spinner"></span>'}</td></tr>`).join('');
}

function generateReport() {
  const title = $('#report-title').value;
  const type = $('#report-type').value;
  if (!title) { toast('Enter a report title', 'error'); return; }
  DB.reports.unshift({ id: 'r'+Date.now(), title, type, format: 'PDF', status: 'generating', date: new Date().toISOString(), pages: 0, createdBy: STORE.user?.name||'User' });
  toast('Report generation started', 'success');
  renderReports();
  setTimeout(() => {
    const r = DB.reports[0];
    if (r && r.status === 'generating') { r.status = 'completed'; r.pages = Math.floor(Math.random()*80+10); renderReports(); toast('Report ready for download', 'success'); }
  }, 3000);
}

function renderNotifications() {
  const t = $('#notif-tabs')?.querySelector('.active')?.dataset?.tab || 'unread';
  const filtered = t === 'all' ? DB.notifications : DB.notifications.filter(n => n.unread);
  const sevI = { critical: '#EF4444', warning: '#F59E0B', info: '#3B82F6', success: '#22C55E' };
  $('#notif-list').innerHTML = filtered.length ? filtered.map(n => `<div class="notif-item ${n.unread?'unread':''}"><div class="notif-icon" style="background:${sevI[n.severity]}18;color:${sevI[n.severity]}">${n.severity==='critical'?'◆':n.severity==='success'?'●':n.severity==='warning'?'◇':'○'}</div><div class="notif-body"><div class="notif-title">${n.unread?'<span class="notif-dot"></span>':''}${escHtml(n.title)}</div><div class="notif-msg">${escHtml(n.message)}</div><div class="notif-meta"><span>${n.time}</span>${n.img?`<span>Image: ${escHtml(n.img)}</span>`:''}${n.action?`<a href="#" onclick="event.preventDefault();navigate('${n.page||'dashboard'}')">${escHtml(n.action)}</a>`:''}</div></div>${n.unread?`<button class="notif-mark" onclick="markRead('${n.id}')">Mark read</button>`:''}</div>`).join('') : `<div style="text-align:center;padding:48px 20px;color:var(--muted)"><div style="font-size:32px;margin-bottom:8px">✓</div><div style="font-weight:500;color:#fff">All caught up</div><div style="font-size:12px;margin-top:4px">No unread notifications</div></div>`;
}

function markRead(id) {
  const n = DB.notifications.find(x => x.id === id);
  if (n) { n.unread = false; renderNotifications(); updateNotifBadge(); }
}

function updateNotifBadge() {
  const unread = DB.notifications.filter(n => n.unread).length;
  $('#notif-badge').style.display = unread > 0 ? 'block' : 'none';
}

function renderSettings() {
  const keys = [
    { name: 'Production CI/CD', key: 'scp_live_8x...a3f2', created: '2026-01-15', lastUsed: '2026-06-07', permissions: 'Read, Write' },
    { name: 'Staging Pipeline', key: 'scp_stag_4b...c7d1', created: '2026-03-20', lastUsed: '2026-06-06', permissions: 'Read' },
    { name: 'Developer Access', key: 'scp_dev_f9...e2b8', created: '2026-05-01', lastUsed: '2026-06-05', permissions: 'Read, Write, Admin' }
  ];
  $('#api-key-table').innerHTML = keys.map(k => `<tr><td><div style="font-weight:500">${escHtml(k.name)}</div></td><td><span style="font-family:'SF Mono',monospace;font-size:12px;color:var(--muted)">${escHtml(k.key)}</span></td><td style="color:var(--muted);font-size:12px">${k.created}</td><td style="color:var(--muted);font-size:12px">${k.lastUsed}</td><td>${k.permissions}</td><td><button class="btn btn-ghost btn-sm" onclick="toast('API key revoked','success');this.closest('tr').remove()">Revoke</button></td></tr>`).join('');
}

function handleTabClick(ev) {
  const tab = ev.currentTarget;
  const parent = tab.closest('.page-tabs');
  if (!parent) return;
  parent.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  const handler = tab.dataset.tabHandler;
  if (handler && window[handler]) window[handler]();
}

function initTabs() {
  $$('.page-tab').forEach(tab => tab.addEventListener('click', handleTabClick));
}

function initSearch() {
  $('#search-trigger').addEventListener('click', () => toast('Press any key to search images, CVEs, scans...', 'info'));
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); toast('Command palette opened (⌘K)', 'info'); }
  });
}

function initNav() {
  $$('#sidebar .sidebar-nav a').forEach(a => {
    a.addEventListener('click', e => {
      const page = a.dataset.page;
      if (page) {
        e.preventDefault();
        navigate(page);
        const r = `render${page.charAt(0).toUpperCase()+page.slice(1)}`;
        if (window[r]) window[r]();
        if (window.innerWidth <= 768) { $('#sidebar').classList.remove('open'); $('#sidebar-overlay').classList.remove('show'); }
      }
    });
  });
}

function closeSidebar() { $('#sidebar').classList.remove('open'); $('#sidebar-overlay').classList.remove('show'); }

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initNav();
  initTabs();
  initSearch();
  updateNotifBadge();
  $('#sidebar-overlay').addEventListener('click', closeSidebar);
  window.addEventListener('resize', () => { if (window.innerWidth > 768) closeSidebar(); });
});
