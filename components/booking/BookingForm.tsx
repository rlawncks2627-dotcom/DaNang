'use client'

import { useState } from 'react'

import type { Booking } from '@/lib/supabase/types'
import { BOOKING_TYPES } from '@/lib/supabase/types'

export type BookingDraft = {
  type: string
  title: string
  confirmation_no: string
  starts_at: string
  address: string
  address_local: string
  phone: string
  memo: string
}

export function emptyDraft(type = 'flight'): BookingDraft {
  return {
    type,
    title: '',
    confirmation_no: '',
    starts_at: '',
    address: '',
    address_local: '',
    phone: '',
    memo: '',
  }
}

export function draftFrom(booking: Booking): BookingDraft {
  return {
    type: booking.type,
    title: booking.title,
    confirmation_no: booking.confirmation_no ?? '',
    // datetime-local은 초 없는 로컬 시각을 받는다
    starts_at: booking.starts_at ? booking.starts_at.slice(0, 16) : '',
    address: booking.address ?? '',
    address_local: booking.address_local ?? '',
    phone: booking.phone ?? '',
    memo: booking.memo ?? '',
  }
}

const FIELDS: { key: keyof BookingDraft; label: string; hint?: string }[] = [
  { key: 'title', label: '이름' },
  { key: 'confirmation_no', label: '예약번호' },
  { key: 'address', label: '주소' },
  {
    key: 'address_local',
    label: '현지어 주소',
    hint: '택시 기사에게 그대로 보여줄 수 있게',
  },
  { key: 'phone', label: '연락처' },
  { key: 'memo', label: '메모' },
]

export function BookingForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: BookingDraft
  submitLabel: string
  onSubmit: (draft: BookingDraft) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)

  function set(key: keyof BookingDraft, value: string) {
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
        <legend className="mb-2 font-bold">종류</legend>
        <div className="flex flex-wrap gap-2">
          {BOOKING_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('type', t.value)}
              aria-pressed={draft.type === t.value}
              className={`min-h-11 px-4 font-bold ${
                draft.type === t.value
                  ? 'bg-ink text-paper'
                  : 'border border-line text-muted'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mb-4 block">
        <span className="mb-1 block font-bold">시각</span>
        <input
          type="datetime-local"
          value={draft.starts_at}
          onChange={(e) => set('starts_at', e.target.value)}
          className="min-h-14 w-full border border-line bg-paper px-4"
        />
      </label>

      {FIELDS.map((f) => (
        <label key={f.key} className="mb-4 block">
          <span className="mb-1 block font-bold">{f.label}</span>
          {f.hint && <span className="mb-1 block text-sm text-muted">{f.hint}</span>}
          <input
            value={draft[f.key]}
            onChange={(e) => set(f.key, e.target.value)}
            className="min-h-14 w-full border border-line bg-paper px-4"
          />
        </label>
      ))}

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
