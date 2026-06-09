import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-800">404</p>
        <h1 className="mt-4 text-xl font-semibold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-zinc-500">The page you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
