'use client'

import Link from 'next/link'

import { useTrip } from '@/components/TripProvider'
import { Wordmark } from '@/components/Wordmark'
import { formatDay, formatTime, todayLocal } from '@/lib/days'
import { useLiveRate } from '@/lib/hooks/useLiveRate'
import { useRealtimeTable } from '@/lib/hooks/useRealtimeTable'
import { useWeather } from '@/lib/hooks/useWeather'
import { formatKrw } from '@/lib/money'
import type {
  ChecklistItem,
  Expense,
  ItineraryItem,
  Place,
} from '@/lib/supabase/types'
import { ITINERARY_KINDS } from '@/lib/supabase/types'

const byOrder = (a: ItineraryItem, b: ItineraryItem) =>
  a.sort_order - b.sort_order
const byNewestPlace = (a: Place, b: Place) =>
  b.created_at.localeCompare(a.created_at)
const byNothing = (a: ChecklistItem, b: ChecklistItem) =>
  a.sort_order - b.sort_order
const bySpent = (a: Expense, b: Expense) => b.spent_at.localeCompare(a.spent_at)

type Phase = 'undated' | 'before' | 'during' | 'after'

function phaseOf(start: string | null, end: string | null, today: string): Phase {
  if (!start || !end) return 'undated'
  if (today < start) return 'before'
  if (today > end) return 'after'
  return 'during'
}

function daysUntil(target: string, today: string) {
  const a = new Date(`${today}T00:00:00`).getTime()
  const b = new Date(`${target}T00:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

export default function HomePage() {
  const { trip, me } = useTrip()
  const { rows: checklists } = useRealtimeTable('checklists', byNothing)
  const { rows: itinerary } = useRealtimeTable('itinerary', byOrder)
  const { rows: places } = useRealtimeTable('places', byNewestPlace)
  const { rows: expenses } = useRealtimeTable('expenses', bySpent)

  const weather = useWeather()
  const liveRate = useLiveRate()

  const today = todayLocal()
  const phase = phaseOf(trip.start_date, trip.end_date, today)

  const todayItems = itinerary.filter((i) => i.day_date === today)
  const todaySpent = expenses
    .filter((e) => e.spent_at === today)
    .reduce((sum, e) => sum + (e.amount_krw ?? 0), 0)

  const done = checklists.filter((c) => c.is_done).length
  const storedRate = Math.round(trip.base_rate_vnd_krw * 1000 * 100) / 100

  return (
    <>
      <header className="mb-6">
        <Wordmark />
        <p className="mt-2 text-muted">
          {me.emoji} {me.name}님으로 보고 있습니다
        </p>
      </header>

      {/* 여행이 언제인지가 홈에서 가장 크게 보여야 할 한 가지다 */}
      <section className="mb-6 border-l-4 border-signal bg-card px-5 py-6">
        {phase === 'undated' && (
          <>
            <p className="font-display text-3xl leading-none">날짜 미정</p>
            <p className="mt-2 text-muted">
              날짜를 정하면 남은 날이 여기 표시됩니다.
            </p>
            <Link
              href="/schedule"
              role="button"
              className="mt-4 flex items-center justify-center bg-ink font-bold text-paper"
            >
              날짜 정하러 가기
            </Link>
          </>
        )}

        {phase === 'before' && (
          <>
            <p className="font-display text-6xl leading-none text-signal">
              D-{daysUntil(trip.start_date!, today)}
            </p>
            <p className="mt-2 text-muted">
              {formatDay(trip.start_date!)} 출발까지
            </p>
          </>
        )}

        {phase === 'during' && (
          <>
            <p className="font-display text-5xl leading-none text-signal">
              여행 {daysUntil(trip.start_date!, today) * -1 + 1}일째
            </p>
            <p className="mt-2 text-muted">{formatDay(today)}</p>
          </>
        )}

        {phase === 'after' && (
          <>
            <p className="font-display text-4xl leading-none">잘 다녀왔습니다</p>
            <p className="mt-2 text-muted">
              남은 건 정산과 기록입니다.
            </p>
          </>
        )}
      </section>

      {/* 여행 중이면 오늘 일정이 가장 위다 */}
      {phase === 'during' && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-baseline justify-between">
            <span className="font-bold">오늘 일정</span>
            <Link href="/schedule" className="text-sm text-muted underline">
              전체 보기
            </Link>
          </h2>

          {todayItems.length === 0 ? (
            <p className="text-muted">오늘은 정해둔 일정이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {todayItems.map((item, index) => {
                const kind = ITINERARY_KINDS.find((k) => k.value === item.kind)
                const next = index === 0
                return (
                  <li
                    key={item.id}
                    className={`border-l-4 p-4 ${
                      next
                        ? 'border-signal bg-card'
                        : 'border-line bg-card text-muted'
                    }`}
                  >
                    <p className="text-sm">
                      {kind?.emoji} {kind?.label}
                      {item.start_time && (
                        <span className="ml-2 font-bold">
                          {formatTime(item.start_time)}
                        </span>
                      )}
                    </p>
                    <p className={next ? 'text-lg font-bold' : 'font-medium'}>
                      {item.title}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}

          {todaySpent > 0 && (
            <p className="mt-3 text-muted">
              오늘 쓴 돈 <span className="font-bold">{formatKrw(todaySpent)}</span>
            </p>
          )}
        </section>
      )}

      {/* 여행 전이면 준비가 어디까지 됐는지가 궁금하다 */}
      {phase === 'before' && checklists.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-baseline justify-between">
            <span className="font-bold">준비물</span>
            <Link href="/checklist" className="text-sm text-muted underline">
              챙기러 가기
            </Link>
          </h2>
          <div className="border-l-4 border-jade bg-card p-4">
            <p className="font-display text-3xl leading-none">
              {done} / {checklists.length}
            </p>
            <div
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={checklists.length}
              aria-label="준비물 진행률"
              className="mt-3 h-3 w-full bg-paper"
            >
              <div
                className="h-full bg-jade"
                style={{ width: `${(done / checklists.length) * 100}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* 환율과 날씨. 둘 다 없어도 되는 정보라 조용히 둔다 */}
      <section className="mb-6 grid grid-cols-2 gap-3">
        <div className="border-l-4 border-gold bg-card p-4">
          <p className="text-sm text-muted">1,000₫</p>
          <p className="font-display text-2xl leading-none">
            {liveRate ?? storedRate}원
          </p>
          <p className="mt-1 text-xs text-muted">
            {liveRate ? '오늘 환율' : '정산 기준'}
          </p>
        </div>

        <div className="border-l-4 border-jade bg-card p-4">
          <p className="text-sm text-muted">다낭 날씨</p>
          {weather ? (
            <>
              <p className="font-display text-2xl leading-none">
                {Math.round(weather.temperature)}°
              </p>
              <p className="mt-1 text-xs text-muted">
                {weather.emoji} {weather.label}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted">여는 중…</p>
          )}
        </div>
      </section>

      {/* 여행 전에는 새로 올라온 것들이 대화의 재료가 된다 */}
      {phase === 'before' && places.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-baseline justify-between">
            <span className="font-bold">새로 올라온 곳</span>
            <Link href="/places" className="text-sm text-muted underline">
              전체 보기
            </Link>
          </h2>
          <ul className="flex flex-col gap-2">
            {places.slice(0, 3).map((place) => (
              <li key={place.id} className="border-l-4 border-gold bg-card p-4">
                <p className="font-bold">{place.name}</p>
                {place.description && (
                  <p className="text-sm text-muted">{place.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-bold">바로 가기</h2>
        <ul className="flex flex-col gap-3">
          {[
            { href: '/schedule', label: '일정표', emoji: '🗓' },
            { href: '/places', label: '가고 싶은 곳', emoji: '📍' },
            { href: '/expenses', label: '정산', emoji: '💸' },
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
