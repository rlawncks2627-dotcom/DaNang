'use client'

import { formatTime } from '@/lib/days'
import { mapsUrl } from '@/lib/maps'
import type { ItineraryItem, Member, Place } from '@/lib/supabase/types'
import { ITINERARY_KINDS } from '@/lib/supabase/types'

/**
 * 종류별 색. 하루를 훑을 때 이동과 식사가 눈으로 구분되는 것이 목적이다.
 * Tailwind가 훑어갈 수 있게 문자열을 그대로 적어둔다.
 */
const KIND_BORDER: Record<string, string> = {
  move: 'border-muted',
  meal: 'border-signal',
  sight: 'border-jade',
  rest: 'border-gold',
}

export function ItineraryItemCard({
  item,
  place,
  author,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  item: ItineraryItem
  place: Place | undefined
  author: Member | undefined
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const kind = ITINERARY_KINDS.find((k) => k.value === item.kind)
  const time = formatTime(item.start_time)

  return (
    <article
      className={`border-l-4 bg-card p-4 ${KIND_BORDER[item.kind] ?? 'border-line'}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-bold text-muted">
            {kind?.emoji} {kind?.label}
            {time && <span className="ml-2 text-ink">{time}</span>}
          </p>
          <h3 className="mt-1 text-lg font-bold">{item.title}</h3>
          {place && <p className="text-muted">{place.name}</p>}
          {item.memo && <p className="mt-2 text-muted">{item.memo}</p>}
        </div>

        {/* 모바일 드래그는 오작동이 잦아 화살표로 옮긴다 */}
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="위로 옮기기"
            className="min-h-11 w-11 border border-line text-muted disabled:opacity-25"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="아래로 옮기기"
            className="min-h-11 w-11 border border-line text-muted disabled:opacity-25"
          >
            ↓
          </button>
        </div>
      </div>

      {place && (
        <a
          href={mapsUrl(place)}
          target="_blank"
          rel="noreferrer"
          role="button"
          className="mt-3 flex min-h-12 items-center justify-center bg-ink text-sm font-bold text-paper"
        >
          구글맵에서 길찾기
        </a>
      )}

      <div className="mt-2 flex items-center gap-2">
        {author && (
          <span className="text-sm text-muted">
            {author.emoji} {author.name}
          </span>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto min-h-11 border border-line px-3 text-sm font-bold text-muted"
        >
          고치기
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="min-h-11 border border-line px-3 text-sm font-bold text-signal"
        >
          지우기
        </button>
      </div>
    </article>
  )
}
