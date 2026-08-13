import Link from 'next/link'

import { PageHeader } from '@/components/PageHeader'

const LINKS = [
  { href: '/checklist', label: '준비물', emoji: '✅', note: '공용과 각자 챙길 것' },
  { href: '/bookings', label: '예약정보', emoji: '🎫', note: '항공·숙소·비상 연락처' },
  { href: '/notes', label: '기록', emoji: '📝', note: '메모와 사진' },
]

export default function MorePage() {
  return (
    <>
      <PageHeader title="더보기" />
      <ul className="flex flex-col gap-3">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center gap-4 border-l-4 border-line bg-card px-5 py-4"
            >
              <span aria-hidden className="text-2xl">
                {link.emoji}
              </span>
              <span>
                <span className="block font-bold">{link.label}</span>
                <span className="block text-sm text-muted">{link.note}</span>
              </span>
              <span aria-hidden className="ml-auto text-muted">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
