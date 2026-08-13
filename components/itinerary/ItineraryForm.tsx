'use client'

import { useState } from 'react'

import type { ItineraryItem, Place } from '@/lib/supabase/types'
import { ITINERARY_KINDS } from '@/lib/supabase/types'

export type ItineraryDraft = {
  start_time: string
  title: string
  kind: string
  place_id: string
  memo: string
}

export function emptyItem(): ItineraryDraft {
  return { start_time: '', title: '', kind: 'sight', place_id: '', memo: '' }
}

export function itemDraftFrom(item: ItineraryItem): ItineraryDraft {
  return {
    // time 컬럼은 'HH:MM:SS'로 오는데 input[type=time]은 'HH:MM'을 받는다
    start_time: item.start_time ? item.start_time.slice(0, 5) : '',
    title: item.title,
    kind: item.kind,
    place_id: item.place_id ?? '',
    memo: item.memo ?? '',
  }
}

export function ItineraryForm({
  initial,
  places,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: ItineraryDraft
  places: Place[]
  submitLabel: string
  onSubmit: (draft: ItineraryDraft) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)

  function set(key: keyof ItineraryDraft, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.title.trim() || saving) return
    setSaving(true)
    await onSubmit(draft)
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="border-l-4 border-ink bg-card p-5">
      <fieldset className="mb-4">
        <legend className="mb-2 font-bold">무엇을 하나요</legend>
        <div className="flex flex-wrap gap-2">
          {ITINERARY_KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => set('kind', k.value)}
              aria-pressed={draft.kind === k.value}
              className={`min-h-11 px-4 font-bold ${
                draft.kind === k.value
                  ? 'bg-ink text-paper'
                  : 'border border-line text-muted'
              }`}
            >
              {k.emoji} {k.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mb-4 block">
        <span className="mb-1 block font-bold">할 일</span>
        <input
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="예: 미케비치 산책"
          className="min-h-14 w-full border border-line bg-paper px-4"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block font-bold">시간</span>
        <input
          type="time"
          value={draft.start_time}
          onChange={(e) => set('start_time', e.target.value)}
          className="min-h-14 w-full border border-line bg-paper px-4"
        />
      </label>

      {/* 장소를 이으면 카드에 구글맵 버튼이 붙는다 */}
      <label className="mb-4 block">
        <span className="mb-1 block font-bold">장소</span>
        <span className="mb-1 block text-sm text-muted">
          장소 탭에 모아둔 곳에서 고릅니다
        </span>
        <select
          value={draft.place_id}
          onChange={(e) => set('place_id', e.target.value)}
          className="min-h-14 w-full border border-line bg-paper px-4"
        >
          <option value="">고르지 않음</option>
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block font-bold">메모</span>
        <input
          value={draft.memo}
          onChange={(e) => set('memo', e.target.value)}
          className="min-h-14 w-full border border-line bg-paper px-4"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!draft.title.trim() || saving}
          className="flex-1 bg-signal font-bold text-white disabled:opacity-40"
        >
          {saving ? '저장 중…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-line font-bold text-muted"
        >
          그만두기
        </button>
      </div>
    </form>
  )
}
