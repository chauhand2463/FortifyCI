'use client'

import Link from 'next/link'
import { Shield, Container, Bug, FileText, Bell, ArrowRight, ScanSearch, Package, Star, Hexagon } from 'lucide-react'

const features = [
  { icon: Container, title: 'Image Registry', desc: 'Centralized hub for monitoring every container image across all your registries.' },
  { icon: ScanSearch, title: 'Deep Scanning', desc: 'Trivy and Grype-powered scans that catch CVEs the moment they surface.' },
  { icon: Bug, title: 'CVE Intelligence', desc: 'Severity scoring, exploit status, and fix versions for every vulnerability.' },
  { icon: Package, title: 'SBOM Analytics', desc: 'CycloneDX and SPDX compliant dependency trees with license risk assessment.' },
  { icon: FileText, title: 'Compliance Hub', desc: 'Automated reports for vulnerability audits, compliance checks, and more.' },
  { icon: Bell, title: 'Threat Alerts', desc: 'Real-time notifications for critical CVEs, policy violations, and scan results.' },
]

const stats = [
  { value: '15K+', label: 'Vulnerabilities Tracked' },
  { value: '50K+', label: 'Images Scanned' },
  { value: '99.9%', label: 'Platform Uptime' },
  { value: '10K+', label: 'Daily Scans' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080A14]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#00D4AA]/5 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#4DA6FF]/5 blur-[100px]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00D4AA" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1C2150]/50 bg-[#080A14]/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#059669] shadow-lg shadow-[#00D4AA]/20 group-hover:shadow-[#00D4AA]/30 transition-shadow">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">FortifyCI</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-sm text-[#9098B8] hover:text-[#EEF0F7] transition-colors font-medium">
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00D4AA] px-4 py-1.5 text-sm font-semibold text-[#080A14] hover:bg-[#05C091] transition-all duration-200 shadow-lg shadow-[#00D4AA]/20"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-36 pb-28 lg:pt-44 lg:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D4AA]/20 bg-[#00D4AA]/5 px-4 py-1.5 mb-8 animate-fade-up">
              <Star className="h-3.5 w-3.5 text-[#00D4AA]" />
              <span className="text-sm font-medium text-[#00D4AA]">Trusted by enterprise security teams</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] animate-fade-up delay-100">
              Secure Your Container
              <br />
              <span className="bg-gradient-to-r from-[#00D4AA] via-[#00D4AA] to-[#4DA6FF] bg-clip-text text-transparent">Supply Chain</span>
            </h1>

            <p className="mt-6 text-lg text-[#9098B8] max-w-2xl mx-auto leading-relaxed animate-fade-up delay-200">
              Enterprise vulnerability management, SBOM analysis, and compliance monitoring 
              for your container ecosystem. Stay ahead of threats across the software supply chain.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-up delay-300">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#059669] px-8 py-3.5 text-base font-semibold text-[#080A14] hover:from-[#05C091] hover:to-[#059669] transition-all duration-300 shadow-xl shadow-[#00D4AA]/20 hover:shadow-[#00D4AA]/30"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1C2150] bg-[#0D1022]/50 px-8 py-3.5 text-base font-medium text-[#9098B8] hover:text-[#EEF0F7] hover:border-[#252A5A] hover:bg-[#0D1022] transition-all duration-200"
              >
                View Demo
              </Link>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up delay-500">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="rounded-xl border border-[#1C2150] bg-[#0D1022]/50 backdrop-blur-sm p-5 text-center hover:border-[#252A5A] hover:bg-[#0D1022]/80 transition-all duration-300 group"
                style={{ animationDelay: `${0.5 + i * 0.1}s` }}
              >
                <p className="text-3xl font-bold text-white group-hover:text-[#00D4AA] transition-colors">{s.value}</p>
                <p className="text-sm text-[#5A6380] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 border-t border-[#1C2150]/50 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00D4AA]/[0.02] to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1C2150] bg-[#0D1022]/50 px-4 py-1 mb-6">
              <Hexagon className="h-3.5 w-3.5 text-[#00D4AA]" />
              <span className="text-sm font-medium text-[#9098B8]">Platform Capabilities</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Everything you need to secure your containers
            </h2>
            <p className="mt-4 text-[#5A6380] max-w-xl mx-auto">
              From vulnerability scanning to compliance reporting, complete visibility 
              into your container security posture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group rounded-xl border border-[#1C2150] bg-[#0D1022]/30 backdrop-blur-sm p-6 hover:bg-[#0D1022]/70 hover:border-[#252A5A] hover:shadow-lg hover:shadow-[#00D4AA]/5 transition-all duration-500"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00D4AA]/10 group-hover:bg-[#00D4AA]/20 transition-all duration-300 mb-4 group-hover:scale-110">
                    <Icon className="h-5 w-5 text-[#00D4AA]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-[#00D4AA] transition-colors">{f.title}</h3>
                  <p className="mt-2 text-sm text-[#5A6380] leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 border-t border-[#1C2150]/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-[#1C2150] bg-gradient-to-br from-[#0D1022] via-[#0D1022] to-[#00D4AA]/5 p-10 lg:p-14 overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00D4AA]/5 rounded-full blur-[100px]" />
            <div className="relative text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00D4AA] to-[#059669] shadow-xl shadow-[#00D4AA]/20">
                  <Shield className="h-7 w-7 text-white" />
                </div>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                Ready to secure your supply chain?
              </h2>
              <p className="mt-4 text-[#9098B8] max-w-lg mx-auto">
                Get started with FortifyCI today. No credit card required. 
                Full access to all features during your trial.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#059669] px-8 py-3.5 text-base font-semibold text-[#080A14] hover:from-[#05C091] hover:to-[#059669] transition-all duration-300 shadow-xl shadow-[#00D4AA]/20"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1C2150] bg-[#0D1022]/50 px-8 py-3.5 text-base font-medium text-[#9098B8] hover:text-[#EEF0F7] hover:border-[#252A5A] transition-all duration-200"
                >
                  Schedule a Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#1C2150]/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-[#00D4AA] to-[#059669]">
              <Shield className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm text-[#5A6380] font-medium">FortifyCI</span>
          </div>
          <p className="text-xs text-[#5A6380]">Container Security & Vulnerability Management Platform</p>
        </div>
      </footer>
    </div>
  )
}
