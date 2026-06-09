import type { Metadata } from 'next'
import { Providers } from './providers'
import { Shell } from '@/components/layout/shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'FortifyCI — Container Security & Vulnerability Management',
  description: 'Enterprise container security platform for vulnerability management, SBOM analysis, and supply chain compliance.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#080A14] text-[#EEF0F7] antialiased">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  )
}
