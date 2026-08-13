'use client'

import Link from 'next/link'

import { Wordmark } from '@/components/Wordmark'
import { useTrip } from '@/components/TripProvider'

/** 날짜가 정해졌으면 남은 날, 아니면 아직 안 정해졌다고 말한다. */
function countdown(startDate: string | null) {
  if (!startDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(`${startDate}T00:00:00`)
  const days = Math.round((start.getTime() - today.getTime()) / 86_400_000)
  if (days > 0) return { label: `D-${days}`, note: '출발까지' }
  if (days === 0) return { label: 'D-DAY', note: '오늘 출발합니다' }
  return { label: `D+${-days}`, note: '여행 중' }
}

export default function HomePage() {
  const { trip, members, me } = useTrip()
  const d = countdown(trip.start_date)

  return (
    <>
      <header className="mb-8">
        <Wordmark />
        <p className="mt-2 text-muted">
          {me.emoji} {me.name}님으로 보고 있습니다
        </p>
      </header>

      {/* 여행이 언제인지가 홈에서 가장 크게 보여야 할 한 가지다 */}
      <section className="mb-8 border-l-4 border-signal bg-card px-5 py-6">
        {d ? (
          <>
            <p className="font-display text-6xl leading-none text-signal">
              {d.label}
            </p>
            <p className="mt-2 text-muted">{d.note}</p>
          </>
        ) : (
          <>
            <p className="font-display text-3xl leading-none">날짜 미정</p>
            <p className="mt-2 text-muted">
              여행 날짜를 정하면 여기에 남은 날이 표시됩니다.
            </p>
          </>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-bold">함께 가는 사람</h2>
        <ul className="flex flex-wrap gap-2">
          {members.map((m) => (
            <li
              key={m.id}
              style={{ backgroundColor: m.color }}
              className="flex items-center gap-2 px-4 py-2 text-white"
            >
              <span aria-hidden>{m.emoji}</span>
              <span className="font-bold">{m.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-bold">바로 가기</h2>
        <ul className="flex flex-col gap-3">
          {[
            { href: '/schedule', label: '일정표', emoji: '🗓' },
            { href: '/places', label: '가고 싶은 곳', emoji: '📍' },
            { href: '/checklist', label: '준비물', emoji: '✅' },
            { href: '/bookings', label: '예약정보', emoji: '🎫' },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center gap-4 border-l-4 border-line bg-card px-5 py-4"
              >
                <span aria-hidden className="text-2xl">
                  {link.emoji}
                </span>
                <span className="font-bold">{link.label}</span>
                <span aria-hidden className="ml-auto text-muted">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
