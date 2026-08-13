'use client'

import { useState } from 'react'

import { useTrip } from '@/components/TripProvider'

/**
 * 여행 날짜를 정한다.
 *
 * 일정표의 Day 탭과 홈의 D-day가 전부 이 값에서 나온다.
 * 아직 안 정했을 때 일정표가 막히지 않도록 화면 안에서 바로 고칠 수 있게 뒀다.
 */
export function TripDatesForm({ onDone }: { onDone: () => void }) {
  const { trip, supabase, refresh } = useTrip()

  const [start, setStart] = useState(trip.start_date ?? '')
  const [end, setEnd] = useState(trip.end_date ?? '')
  const [saving, setSaving] = useState(false)

  const invalid = Boolean(start && end && end < start)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!start || !end || invalid || saving) return

    setSaving(true)
    await supabase
      .from('trips')
      .update({ start_date: start, end_date: end })
      .eq('id', trip.id)

    refresh()
    setSaving(false)
    onDone()
  }

  return (
    <form onSubmit={save} className="border-l-4 border-ink bg-card p-5">
      <p className="mb-4 font-bold">여행 날짜</p>

      <label className="mb-4 block">
        <span className="mb-1 block font-bold">가는 날</span>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="min-h-14 w-full border border-line bg-paper px-4"
        />
      </label>

      <label className="mb-2 block">
        <span className="mb-1 block font-bold">오는 날</span>
        <input
          type="date"
          value={end}
          min={start || undefined}
          onChange={(e) => setEnd(e.target.value)}
          className="min-h-14 w-full border border-line bg-paper px-4"
        />
      </label>

      {invalid && (
        <p className="mb-4 text-signal">오는 날이 가는 날보다 빠릅니다.</p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={!start || !end || invalid || saving}
          className="flex-1 bg-signal font-bold text-white disabled:opacity-40"
        >
          {saving ? '저장 중…' : '저장'}
        </button>
        {trip.start_date && (
          <button
            type="button"
            onClick={onDone}
            className="flex-1 border border-line font-bold text-muted"
          >
            그만두기
          </button>
        )}
      </div>
    </form>
  )
}
