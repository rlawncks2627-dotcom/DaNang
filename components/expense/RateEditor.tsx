'use client'

import { useState } from 'react'

import { useTrip } from '@/components/TripProvider'

/**
 * 환율. 1,000동이 몇 원인지로 보여준다 — 0.055원은 감이 안 잡히지만
 * '1,000동 = 55원'은 현지에서 바로 쓸 수 있다.
 */
export function RateEditor({ onDone }: { onDone: () => void }) {
  const { trip, supabase, refresh } = useTrip()

  const [per1000, setPer1000] = useState(
    String(Math.round(trip.base_rate_vnd_krw * 1000 * 100) / 100),
  )
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  async function fetchLive() {
    setFetchError(null)
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/VND')
      const json = await res.json()
      const krwPerVnd = json?.rates?.KRW
      if (typeof krwPerVnd !== 'number') throw new Error('없음')
      setPer1000(String(Math.round(krwPerVnd * 1000 * 100) / 100))
    } catch {
      setFetchError('환율을 가져오지 못했습니다. 직접 넣어 주세요.')
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(per1000)
    if (!value || value <= 0 || saving) return

    setSaving(true)
    await supabase
      .from('trips')
      .update({ base_rate_vnd_krw: value / 1000 })
      .eq('id', trip.id)

    refresh()
    setSaving(false)
    onDone()
  }

  return (
    <form onSubmit={save} className="border-l-4 border-ink bg-card p-5">
      <label className="block">
        <span className="mb-1 block font-bold">1,000동은 몇 원</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={per1000}
          onChange={(e) => setPer1000(e.target.value)}
          className="min-h-14 w-full border border-line bg-paper px-4 text-xl font-bold"
        />
      </label>

      <button
        type="button"
        onClick={() => void fetchLive()}
        className="mt-3 w-full border border-line font-bold text-muted"
      >
        오늘 환율 가져오기
      </button>
      {fetchError && <p className="mt-2 text-signal">{fetchError}</p>}

      <p className="mt-3 text-sm text-muted">
        이미 넣은 지출의 원화 금액은 그대로 둡니다. 낼 때 환율로 기록해두는 편이
        나중에 맞춰보기 쉽습니다.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-signal font-bold text-white disabled:opacity-40"
        >
          {saving ? '저장 중…' : '저장'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex-1 border border-line font-bold text-muted"
        >
          그만두기
        </button>
      </div>
    </form>
  )
}
