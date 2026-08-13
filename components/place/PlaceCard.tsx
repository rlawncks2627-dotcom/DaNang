'use client'

import { mapsUrl } from '@/lib/maps'
import type { Member, Place } from '@/lib/supabase/types'
import { PLACE_CATEGORIES } from '@/lib/supabase/types'

const STATUSES = [
  { value: 'wish', label: '가고싶어요' },
  { value: 'planned', label: '일정에 넣음' },
  { value: 'visited', label: '다녀옴' },
] as const

export function PlaceCard({
  place,
  members,
  voterIds,
  votedByMe,
  onToggleVote,
  onChangeStatus,
  onEdit,
  onDelete,
}: {
  place: Place
  members: Member[]
  voterIds: string[]
  votedByMe: boolean
  onToggleVote: () => void
  onChangeStatus: (status: string) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const category = PLACE_CATEGORIES.find((c) => c.value === place.category)
  const voters = members.filter((m) => voterIds.includes(m.id))

  return (
    <article
      className={`border-l-4 bg-card p-5 ${
        place.status === 'visited' ? 'border-line' : 'border-gold'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-bold text-muted">
            {category?.emoji} {category?.label}
          </p>
          <h3 className="mt-1 text-xl font-bold">{place.name}</h3>
          {place.name_local && (
            <p className="text-muted">{place.name_local}</p>
          )}
        </div>

        {/*
          하트는 누른 사람 수가 곧 결론이다. 숫자보다 누가 눌렀는지가
          더 유용해서 이모지를 함께 보여준다.
        */}
        <button
          type="button"
          onClick={onToggleVote}
          aria-pressed={votedByMe}
          aria-label={votedByMe ? '하트 취소' : '하트 누르기'}
          className={`flex min-h-14 shrink-0 items-center gap-2 px-4 ${
            votedByMe ? 'bg-gold text-ink' : 'border border-line text-muted'
          }`}
        >
          <span aria-hidden className="text-xl">
            {votedByMe ? '❤️' : '🤍'}
          </span>
          {voters.length > 0 && (
            <span className="font-bold">{voters.length}</span>
          )}
        </button>
      </div>

      {voters.length > 0 && (
        <p className="mt-3 text-sm text-muted">
          {voters.map((v) => `${v.emoji} ${v.name}`).join(' · ')} 가고 싶어함
        </p>
      )}

      {place.description && <p className="mt-3">{place.description}</p>}
      {place.price_level && (
        <p className="mt-1 text-sm text-muted">{place.price_level}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onChangeStatus(s.value)}
            aria-pressed={place.status === s.value}
            className={`min-h-11 px-3 text-sm font-bold ${
              place.status === s.value
                ? 'bg-jade text-white'
                : 'border border-line text-muted'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <a
        href={mapsUrl(place)}
        target="_blank"
        rel="noreferrer"
        role="button"
        className="mt-4 flex items-center justify-center bg-ink font-bold text-paper"
      >
        구글맵에서 길찾기
      </a>

      <div className="mt-2 flex gap-2">
        {place.ref_url && (
          <a
            href={place.ref_url}
            target="_blank"
            rel="noreferrer"
            role="button"
            className="flex min-h-11 flex-1 items-center justify-center border border-line text-sm font-bold text-muted"
          >
            참고 링크
          </a>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="min-h-11 flex-1 border border-line text-sm font-bold text-muted"
        >
          고치기
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="min-h-11 flex-1 border border-line text-sm font-bold text-signal"
        >
          지우기
        </button>
      </div>
    </article>
  )
}
