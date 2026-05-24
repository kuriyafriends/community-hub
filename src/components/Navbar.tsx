'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks'

export default function Navbar() {
  const pathname = usePathname()
  const { profile } = useProfile()
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  function toggleDark() {
    setDark(!dark)
    if (dark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
  }

  const links = [
    { href: '/', label: '🏠 Home' },
    { href: '/classifieds', label: '🏷️ Classifieds' },
    { href: '/discussions', label: '💬 Discussions' },
    { href: '/profile', label: '👤 Profile' },
    ...(profile?.is_admin ? [{ href: '/admin', label: '⚙️ Admin' }] : []),
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="sticky top-0 z-50 border-b bg-[var(--bg)] border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-lg text-[var(--primary)]">
        KURIYA Friends
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(l.href)
                  ? 'bg-[var(--primary)] text-white'
                  : 'hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button onClick={toggleDark} className="ml-2 p-2 rounded-lg hover:bg-[var(--bg-secondary)]">
            {dark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
            className="ml-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)] px-4 py-2 space-y-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm ${
                isActive(l.href)
                  ? 'bg-[var(--primary)] text-white'
                  : 'hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)]">
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
              className="px-3 py-2 text-sm text-red-500"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
