'use client'

import { useState } from 'react'

import type { Place } from '@/lib/supabase/types'
import { PLACE_CATEGORIES } from '@/lib/supabase/types'

export type PlaceDraft = {
  name: string
  name_local: string
  category: string
  description: string
  price_level: string
  ref_url: string
  gmap_url: string
}

export function emptyPlace(category = 'food'): PlaceDraft {
  return {
    name: '',
    name_local: '',
    category,
    description: '',
    price_level: '',
    ref_url: '',
    gmap_url: '',
  }
}

export function placeDraftFrom(place: Place): PlaceDraft {
  return {
    name: place.name,
    name_local: place.name_local ?? '',
    category: place.category,
    description: place.description ?? '',
    price_level: place.price_level ?? '',
    ref_url: place.ref_url ?? '',
    gmap_url: place.gmap_url ?? '',
  }
}

/** 이름 말고는 전부 선택 사항이다. 넣는 부담이 크면 아무도 안 넣는다. */
const OPTIONAL_FIELDS: {
  key: keyof PlaceDraft
  label: string
  hint?: string
}[] = [
  { key: 'name_local', label: '현지어 이름', hint: '검색이 더 잘 맞습니다' },
  { key: 'description', label: '한 줄 설명' },
  { key: 'price_level', label: '가격대', hint: '예: 1인 2만원쯤' },
  { key: 'ref_url', label: '참고 링크', hint: '블로그나 인스타 주소' },
  { key: 'gmap_url', label: '구글맵 링크', hint: '없으면 이름으로 검색합니다' },
]

export function PlaceForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: PlaceDraft
  submitLabel: string
  onSubmit: (draft: PlaceDraft) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [showMore, setShowMore] = useState(false)

  function set(key: keyof PlaceDraft, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.name.trim() || saving) return
    setSaving(true)
    await onSubmit(draft)
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="border-l-4 border-ink bg-card p-5">
      <fieldset className="mb-4">
        <legend className="mb-2 font-bold">어떤 곳인가요</legend>
        <div className="flex flex-wrap gap-2">
          {PLACE_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => set('category', c.value)}
              aria-pressed={draft.category === c.value}
              className={`min-h-11 px-4 font-bold ${
                draft.category === c.value
                  ? 'bg-ink text-paper'
                  : 'border border-line text-muted'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mb-4 block">
        <span className="mb-1 block font-bold">이름</span>
        <input
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="예: 마담란"
          className="min-h-14 w-full border border-line bg-paper px-4"
        />
      </label>

      {showMore ? (
        OPTIONAL_FIELDS.map((f) => (
          <label key={f.key} className="mb-4 block">
            <span className="mb-1 block font-bold">{f.label}</span>
            {f.hint && (
              <span className="mb-1 block text-sm text-muted">{f.hint}</span>
            )}
            <input
              value={draft[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              className="min-h-14 w-full border border-line bg-paper px-4"
            />
          </label>
        ))
      ) : (
        <button
          type="button"
          onClick={() => setShowMore(true)}
          className="mb-4 w-full border border-line font-bold text-muted"
        >
          설명·가격·링크도 넣기
        </button>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!draft.name.trim() || saving}
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
