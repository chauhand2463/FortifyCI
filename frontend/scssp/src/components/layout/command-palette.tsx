'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCommandPalette } from '@/store/command-palette'

const commands = [
  { id: 'go-dashboard', label: 'Go to Dashboard', description: 'View security overview', icon: 'D', path: '/dashboard' },
  { id: 'go-images', label: 'Go to Images', description: 'Manage container images', icon: 'I', path: '/images' },
  { id: 'go-scans', label: 'Go to Scans', description: 'View scan history', icon: 'S', path: '/scans' },
  { id: 'go-vulns', label: 'Go to Vulnerabilities', description: 'Browse CVEs', icon: 'V', path: '/vulnerabilities' },
  { id: 'go-sbom', label: 'Go to SBOM Explorer', description: 'Browse dependency trees', icon: 'B', path: '/sbom' },
  { id: 'go-reports', label: 'Go to Reports', description: 'Generate and download reports', icon: 'R', path: '/reports' },
  { id: 'go-notifications', label: 'Go to Notifications', description: 'View alerts', icon: 'N', path: '/notifications' },
  { id: 'go-settings', label: 'Go to Settings', description: 'Manage preferences', icon: 'E', path: '/settings' },
]

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  const filtered = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.description?.toLowerCase().includes(query.toLowerCase()))
    : commands

  const executeSelected = useCallback(() => {
    if (filtered[selectedIndex]) {
      router.push(filtered[selectedIndex].path)
      close()
    }
  }, [filtered, selectedIndex, router, close])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); executeSelected() }
  }, [filtered.length, executeSelected])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg rounded-xl border border-[#1C2150] bg-[#0D1022] shadow-2xl shadow-black/30 overflow-hidden backdrop-blur-xl"
            onClick={e => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center border-b border-[#1C2150] px-4">
              <svg className="h-4 w-4 text-[#5A6380] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
                placeholder="Search pages and actions..."
                className="flex-1 bg-transparent px-3 py-3.5 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] outline-none"
              />
              <kbd className="hidden sm:inline-flex rounded border border-[#1C2150] bg-[#080A14] px-1.5 py-0.5 text-[10px] font-medium text-[#5A6380]">ESC</kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#5A6380]">No results found</p>
              ) : (
                filtered.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200',
                      i === selectedIndex ? 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20' : 'text-[#9098B8] hover:bg-[#131736] hover:text-[#EEF0F7] border border-transparent'
                    )}
                    onClick={() => { router.push(cmd.path); close() }}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded border border-[#1C2150] bg-[#080A14] text-[11px] font-bold text-[#5A6380] uppercase">
                      {cmd.icon}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{cmd.label}</p>
                      {cmd.description && <p className="text-xs text-[#5A6380]">{cmd.description}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
