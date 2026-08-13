'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * 하단 탭.
 *
 * 화면은 일곱인데 탭은 다섯이다. 자주 여는 넷을 앞에 두고
 * 준비물·예약정보·기록은 '더보기'로 묶었다.
 */
const TABS = [
  { href: '/', label: '홈', emoji: '🏠' },
  { href: '/schedule', label: '일정', emoji: '🗓' },
  { href: '/places', label: '장소', emoji: '📍' },
  { href: '/expenses', label: '정산', emoji: '💸' },
  { href: '/more', label: '더보기', emoji: '☰' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="주요 화면"
      className="sticky bottom-0 border-t-2 border-ink bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex w-full max-w-md">
        {TABS.map((tab) => {
          const active =
            tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 ${
                  active ? 'bg-ink text-paper' : 'text-muted'
                }`}
              >
                <span aria-hidden className="text-xl leading-none">
                  {tab.emoji}
                </span>
                <span className="text-xs font-bold">{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
