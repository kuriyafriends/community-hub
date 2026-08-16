'use client'

import Link from 'next/link'
import { classifiedSections } from '@/lib/classified-config'

export default function ClassifiedsPage() {
  return (
    <div className="space-y-7">
      <div className="text-sm text-[var(--text-secondary)]">
        <Link href="/" className="hover:text-[var(--primary)]">HOME</Link> <span>›</span> <span>Classifieds</span>
      </div>

      <div className="text-center">
        <p className="text-sm text-[var(--text-secondary)]">KURIYA FRIENDS</p>
        <h1 className="text-3xl font-bold mt-1">Classifieds</h1>
        <p className="text-[var(--text-secondary)] mt-2">Choose a category</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {classifiedSections.map(section => (
          <Link
            key={section.slug}
            href={`/classifieds/category/${section.slug}`}
            className="botanical-card overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="h-32 bg-[var(--bg-secondary)] flex items-center justify-center text-6xl">
              {section.emoji}
            </div>
            <div className="p-4 text-center">
              <h2 className="font-semibold">{section.label}</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Open category →</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center pt-2">
        <Link href="/classifieds/new" className="btn-botanical inline-block px-5 py-2.5">
          + New Listing
        </Link>
      </div>

      <footer className="border-t border-[var(--border)] pt-6 mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[var(--text-secondary)]">
        <Link href="/" className="hover:text-[var(--primary)]">About KURIYA Friends</Link>
        <Link href="/" className="hover:text-[var(--primary)]">Contact Us</Link>
        <Link href="/" className="hover:text-[var(--primary)]">Membership & Guidelines</Link>
        <span className="font-semibold text-[var(--primary)]">KURIYA FRIENDS</span>
      </footer>
    </div>
  )
}
