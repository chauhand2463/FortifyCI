'use client'

import Link from 'next/link'
import { Shield, ArrowRight, ScanSearch, Package, FileText, Bell, Bug, Hexagon, CheckCircle, Terminal, Layers, ChevronRight } from 'lucide-react'

const features = [
  { icon: ScanSearch, title: 'Deep Vulnerability Scanning', desc: 'Trivy-powered scans surface every CVE with severity scoring, exploit status, and fix versions. Results in seconds, not minutes.' },
  { icon: Layers, title: 'SBOM Generation & Analysis', desc: 'Auto-generate CycloneDX and SPDX-compliant SBOMs for every image. Full dependency trees with license risk assessment.' },
  { icon: Bug, title: 'CVE Intelligence & Prioritization', desc: 'EPSS scoring, exploit availability, reachability analysis — know which CVEs to fix first, not just the loudest ones.' },
  { icon: Bell, title: 'Policy Enforcement & Alerts', desc: 'Define pass/fail gates per image or registry. Real-time Slack, email, and webhook notifications on policy breaches.' },
  { icon: FileText, title: 'Compliance Reporting', desc: 'One-click PDF, CSV, and JSON reports for audits. SOC 2, HIPAA, and PCI-DSS ready templates included.' },
  { icon: Package, title: 'Blast Radius Analysis', desc: 'When a new CVE drops, instantly see every image and deployment affected. No more manual cross-referencing.' },
]

const steps = [
  { num: '01', title: 'Register your image', desc: 'Point FortifyCI at any registry — Docker Hub, ECR, GCR, ACR, or private registries with credentials.' },
  { num: '02', title: 'Scan runs automatically', desc: 'Trivy generates a complete SBOM and vulnerability report. Progress streams live to the dashboard.' },
  { num: '03', title: 'Gate or pass', desc: 'Policy evaluation runs against every scan. Block deployments that exceed your risk threshold, pass those that meet it.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080A14]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] right-[-200px] w-[800px] h-[800px] rounded-full bg-[#00D4AA]/[0.04] blur-[150px]" />
        <div className="absolute bottom-[-300px] left-[-200px] w-[600px] h-[600px] rounded-full bg-[#4DA6FF]/[0.03] blur-[120px]" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1C2150]/50 bg-[#080A14]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#059669] shadow-lg shadow-[#00D4AA]/20">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">FortifyCI</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-sm font-medium text-[#9098B8] transition-colors hover:text-[#EEF0F7]">
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00D4AA] px-4 py-1.5 text-sm font-semibold text-[#080A14] shadow-lg shadow-[#00D4AA]/20 transition-all duration-200 hover:bg-[#05C091]"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00D4AA]/20 bg-[#00D4AA]/5 px-4 py-1.5 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00D4AA] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00D4AA]" />
                </span>
                <span className="text-sm font-medium text-[#00D4AA]">Live scanning available</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.08]">
                Container security
                <br />
                <span className="bg-gradient-to-r from-[#00D4AA] via-[#00D4AA] to-[#4DA6FF] bg-clip-text text-transparent">that gates your pipeline</span>
              </h1>

              <p className="mt-5 text-base lg:text-lg text-[#9098B8] leading-relaxed max-w-lg">
                Vulnerability scanning, SBOM generation, and policy enforcement that runs in your CI/CD. 
                FortifyCI blocks deployments that exceed your risk threshold and surfaces what needs fixing.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#059669] px-7 py-3 text-base font-semibold text-[#080A14] shadow-xl shadow-[#00D4AA]/20 transition-all duration-300 hover:from-[#05C091] hover:shadow-[#00D4AA]/30"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1C2150] bg-[#0D1022]/50 px-7 py-3 text-base font-medium text-[#9098B8] transition-all duration-200 hover:border-[#252A5A] hover:text-[#EEF0F7]"
                >
                  View Demo
                </Link>
              </div>
            </div>

            {/* Terminal preview */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00D4AA]/5 to-transparent rounded-2xl blur-2xl" />
              <div className="relative rounded-xl border border-[#1C2150] bg-[#0A0D1E] shadow-2xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1C2150] bg-[#080A14]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF4757]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FFA502]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00D4AA]" />
                  <span className="ml-3 text-xs text-[#5A6380] font-mono">fortifyci scan —report</span>
                </div>
                <div className="p-5 font-mono text-xs leading-6">
                  <p className="text-[#5A6380]">$ fortifyci scan node:22-alpine --policy strict</p>
                  <p className="mt-1 text-[#00D4AA]">Pulling image: node:22-alpine</p>
                  <p className="text-[#4DA6FF]">Generating SBOM...</p>
                  <p className="text-[#4DA6FF]">Scanning vulnerabilities...</p>
                  <p className="mt-2 text-[#FFA502]">Found 12 vulnerabilities</p>
                  <p className="ml-4 text-[#FF4757]">CVE-2024-1234 — CRITICAL — openssl 3.2.1</p>
                  <p className="ml-4 text-[#FF4757]">CVE-2024-5678 — CRITICAL — libcurl 8.4.0</p>
                  <p className="ml-4 text-[#FFA502]">CVE-2024-9012 — HIGH — zlib 1.2.13</p>
                  <p className="ml-4 text-[#5A6380]">CVE-2024-3456 — MEDIUM — busybox 1.36</p>
                  <p className="mt-2 text-[#FF4757]">POLICY BLOCKED — 2 critical CVEs exceed threshold</p>
                  <p className="mt-1 text-[#5A6380]">——————————————————————————————</p>
                  <p className="text-[#00D4AA]">Try: fortifyci scan --help or add --exceptions</p>
                  <p className="mt-1 text-[#00D4AA]">$ <span className="animate-pulse">_</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28 border-t border-[#1C2150]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1C2150] bg-[#0D1022]/50 px-4 py-1 mb-6">
              <Hexagon className="h-3.5 w-3.5 text-[#00D4AA]" />
              <span className="text-sm font-medium text-[#9098B8]">How it works</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Scan. Evaluate. Deploy.
            </h2>
            <p className="mt-3 text-[#5A6380] max-w-lg mx-auto">
              Three steps from image to deployment. No DSLs to learn, no agents to install.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-[#1C2150] to-transparent" />
                )}
                <div className="rounded-xl border border-[#1C2150] bg-[#0D1022]/40 p-6 lg:p-8">
                  <span className="text-3xl font-bold text-[#1C2150]">{s.num}</span>
                  <h3 className="text-lg font-semibold text-white mt-3">{s.title}</h3>
                  <p className="text-sm text-[#5A6380] mt-2 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#00D4AA] hover:text-[#05C091] transition-colors"
            >
              See full documentation <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28 border-t border-[#1C2150]/50 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1C2150] bg-[#0D1022]/50 px-4 py-1 mb-6">
              <Layers className="h-3.5 w-3.5 text-[#00D4AA]" />
              <span className="text-sm font-medium text-[#9098B8]">Everything included</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              What you get
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group rounded-xl border border-[#1C2150] bg-[#0D1022]/30 p-6 transition-all duration-500 hover:border-[#252A5A] hover:bg-[#0D1022]/70 hover:shadow-lg hover:shadow-[#00D4AA]/5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00D4AA]/10 mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#00D4AA]/20">
                    <Icon className="h-5 w-5 text-[#00D4AA]" />
                  </div>
                  <h3 className="text-base font-semibold text-white transition-colors group-hover:text-[#00D4AA]">{f.title}</h3>
                  <p className="mt-2 text-sm text-[#5A6380] leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 border-t border-[#1C2150]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-[#1C2150] bg-gradient-to-br from-[#0D1022] via-[#0D1022] to-[#00D4AA]/5 p-10 lg:p-14 overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00D4AA]/5 rounded-full blur-[100px]" />
            <div className="relative text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00D4AA] to-[#059669] shadow-xl shadow-[#00D4AA]/20">
                  <Shield className="h-7 w-7 text-white" />
                </div>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                Ship with confidence
              </h2>
              <p className="mt-3 text-[#9098B8] max-w-md mx-auto">
                Stop digging through CVE reports. Let FortifyCI gate your pipeline — only safe images make it to production.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#059669] px-8 py-3.5 text-base font-semibold text-[#080A14] shadow-xl shadow-[#00D4AA]/20 transition-all duration-300 hover:from-[#05C091] hover:shadow-[#00D4AA]/30"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1C2150] bg-[#0D1022]/50 px-8 py-3.5 text-base font-medium text-[#9098B8] transition-all duration-200 hover:border-[#252A5A] hover:text-[#EEF0F7]"
                >
                  Schedule a Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#1C2150]/50 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-[#00D4AA] to-[#059669]">
              <Shield className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium text-[#5A6380]">FortifyCI</span>
          </div>
          <p className="text-xs text-[#5A6380]">Container Security & Vulnerability Management Platform</p>
        </div>
      </footer>
    </div>
  )
}
