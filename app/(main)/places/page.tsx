'use client'

import { useState } from 'react'

import { PageHeader } from '@/components/PageHeader'
import { PlaceCard } from '@/components/place/PlaceCard'
import {
  PlaceForm,
  emptyPlace,
  placeDraftFrom,
  type PlaceDraft,
} from '@/components/place/PlaceForm'
import { useTrip } from '@/components/TripProvider'
import { usePlaceVotes } from '@/lib/hooks/usePlaceVotes'
import { useRealtimeTable } from '@/lib/hooks/useRealtimeTable'
import type { Place } from '@/lib/supabase/types'
import { PLACE_CATEGORIES } from '@/lib/supabase/types'

const byNewest = (a: Place, b: Place) => b.created_at.localeCompare(a.created_at)

function toRow(draft: PlaceDraft) {
  const blankToNull = (v: string) => (v.trim() ? v.trim() : null)
  return {
    name: draft.name.trim(),
    name_local: blankToNull(draft.name_local),
    category: draft.category,
    description: blankToNull(draft.description),
    price_level: blankToNull(draft.price_level),
    ref_url: blankToNull(draft.ref_url),
    gmap_url: blankToNull(draft.gmap_url),
  }
}

export default function PlacesPage() {
  const { trip, members, me, supabase } = useTrip()
  const { rows, loading, applyLocal } = useRealtimeTable('places', byNewest)
  const { votersOf, countOf, toggle } = usePlaceVotes()

  const [category, setCategory] = useState<string | null>(null)
  const [byHearts, setByHearts] = useState(false)
  const [editing, setEditing] = useState<'new' | string | null>(null)

  const filtered = rows.filter(
    (p) => category === null || p.category === category,
  )
  const visible = byHearts
    ? [...filtered].sort(
        (a, b) => countOf(b.id) - countOf(a.id) || byNewest(a, b),
      )
    : filtered

  async function create(draft: PlaceDraft) {
    await supabase
      .from('places')
      .insert({ ...toRow(draft), trip_id: trip.id, created_by: me.id })
    setEditing(null)
  }

  async function update(id: string, draft: PlaceDraft) {
    await supabase.from('places').update(toRow(draft)).eq('id', id)
    setEditing(null)
  }

  async function changeStatus(place: Place, status: string) {
    applyLocal((prev) =>
      prev.map((p) => (p.id === place.id ? { ...p, status } : p)),
    )
    await supabase.from('places').update({ status }).eq('id', place.id)
  }

  async function remove(place: Place) {
    applyLocal((prev) => prev.filter((p) => p.id !== place.id))
    await supabase.from('places').delete().eq('id', place.id)
  }

  const tabs = [
    { value: null as string | null, label: '전체', emoji: '' },
    ...PLACE_CATEGORIES.map((c) => ({
      value: c.value as string | null,
      label: c.label,
      emoji: c.emoji,
    })),
  ]

  return (
    <>
      <PageHeader
        title="장소"
        subtitle={loading ? '불러오는 중…' : `${rows.length}곳 모았습니다`}
      />

      <div
        role="tablist"
        aria-label="장소 종류"
        className="mb-3 flex gap-2 overflow-x-auto"
      >
        {tabs.map((t) => {
          const active = t.value === category
          return (
            <button
              key={t.value ?? 'all'}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setCategory(t.value)}
              className={`min-h-11 shrink-0 px-4 font-bold ${
                active ? 'bg-ink text-paper' : 'border border-line text-muted'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setByHearts((v) => !v)}
        className="mb-5 min-h-11 border border-line px-4 text-sm font-bold text-muted"
      >
        {byHearts ? '최신순으로 보기' : '하트순으로 보기'}
      </button>

      {!loading && visible.length === 0 && editing !== 'new' && (
        <p className="mb-5 text-muted">
          아직 없습니다. 가고 싶은 곳을 하나 넣어 보세요.
        </p>
      )}

      <div className="mb-6 flex flex-col gap-4">
        {visible.map((place) =>
          editing === place.id ? (
            <PlaceForm
              key={place.id}
              initial={placeDraftFrom(place)}
              submitLabel="저장"
              onSubmit={(draft) => update(place.id, draft)}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <PlaceCard
              key={place.id}
              place={place}
              members={members}
              voterIds={votersOf(place.id)}
              votedByMe={votersOf(place.id).includes(me.id)}
              onToggleVote={() => void toggle(place.id)}
              onChangeStatus={(status) => void changeStatus(place, status)}
              onEdit={() => setEditing(place.id)}
              onDelete={() => void remove(place)}
            />
          ),
        )}
      </div>

      {editing === 'new' ? (
        <PlaceForm
          initial={emptyPlace(category ?? 'food')}
          submitLabel="추가"
          onSubmit={create}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="w-full bg-signal font-bold text-white"
        >
          장소 추가
        </button>
      )}
    </>
  )
}
