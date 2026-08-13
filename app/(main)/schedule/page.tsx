'use client'

import { useState } from 'react'

import { ItineraryItemCard } from '@/components/itinerary/ItineraryItemCard'
import {
  ItineraryForm,
  emptyItem,
  itemDraftFrom,
  type ItineraryDraft,
} from '@/components/itinerary/ItineraryForm'
import { PageHeader } from '@/components/PageHeader'
import { TripDatesForm } from '@/components/TripDatesForm'
import { useTrip } from '@/components/TripProvider'
import { daysBetween, formatDay, todayLocal } from '@/lib/days'
import { useRealtimeTable } from '@/lib/hooks/useRealtimeTable'
import type { ItineraryItem, Place } from '@/lib/supabase/types'

const byOrder = (a: ItineraryItem, b: ItineraryItem) =>
  a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)

const byNewest = (a: Place, b: Place) => b.created_at.localeCompare(a.created_at)

/** 시간이 없는 항목은 뒤로 보낸다. 정하지 않은 일은 하루 끝에 두는 게 자연스럽다. */
const byTime = (a: ItineraryItem, b: ItineraryItem) => {
  if (!a.start_time && !b.start_time) return byOrder(a, b)
  if (!a.start_time) return 1
  if (!b.start_time) return -1
  return a.start_time.localeCompare(b.start_time)
}

function toRow(draft: ItineraryDraft) {
  return {
    title: draft.title.trim(),
    kind: draft.kind,
    start_time: draft.start_time || null,
    place_id: draft.place_id || null,
    memo: draft.memo.trim() || null,
  }
}

export default function SchedulePage() {
  const { trip, members, me, supabase } = useTrip()
  const { rows, loading, applyLocal } = useRealtimeTable('itinerary', byOrder)
  const { rows: places } = useRealtimeTable('places', byNewest)

  const [editingDates, setEditingDates] = useState(false)
  const [editing, setEditing] = useState<'new' | string | null>(null)

  const days =
    trip.start_date && trip.end_date
      ? daysBetween(trip.start_date, trip.end_date)
      : []

  const today = todayLocal()
  // 여행 중이면 오늘을, 아니면 첫날을 연다
  const [day, setDay] = useState<string | null>(null)
  const activeDay = day ?? (days.includes(today) ? today : days[0]) ?? null

  const items = rows.filter((i) => i.day_date === activeDay)

  if (!trip.start_date || editingDates) {
    return (
      <>
        <PageHeader
          title="일정표"
          subtitle="날짜를 정하면 하루씩 짤 수 있습니다"
        />
        <TripDatesForm onDone={() => setEditingDates(false)} />
      </>
    )
  }

  /** 화면에 보이는 차례대로 sort_order를 1부터 다시 매긴다. */
  async function persistOrder(ordered: ItineraryItem[]) {
    const changed = ordered
      .map((item, index) => ({ item, order: index + 1 }))
      .filter(({ item, order }) => item.sort_order !== order)

    applyLocal((prev) =>
      prev.map((r) => {
        const hit = changed.find((c) => c.item.id === r.id)
        return hit ? { ...r, sort_order: hit.order } : r
      }),
    )

    await Promise.all(
      changed.map(({ item, order }) =>
        supabase.from('itinerary').update({ sort_order: order }).eq('id', item.id),
      ),
    )
  }

  async function move(item: ItineraryItem, direction: -1 | 1) {
    const index = items.findIndex((i) => i.id === item.id)
    const target = index + direction
    if (target < 0 || target >= items.length) return

    const reordered = [...items]
    reordered.splice(index, 1)
    reordered.splice(target, 0, item)
    await persistOrder(reordered)
  }

  async function create(draft: ItineraryDraft) {
    if (!activeDay) return
    const lastOrder = items.at(-1)?.sort_order ?? 0

    await supabase.from('itinerary').insert({
      ...toRow(draft),
      trip_id: trip.id,
      day_date: activeDay,
      sort_order: lastOrder + 1,
      created_by: me.id,
    })
    setEditing(null)
  }

  async function update(id: string, draft: ItineraryDraft) {
    await supabase.from('itinerary').update(toRow(draft)).eq('id', id)
    setEditing(null)
  }

  async function remove(item: ItineraryItem) {
    applyLocal((prev) => prev.filter((i) => i.id !== item.id))
    await supabase.from('itinerary').delete().eq('id', item.id)
  }

  return (
    <>
      <PageHeader
        title="일정표"
        subtitle={loading ? '불러오는 중…' : `${days.length}일 일정`}
      />

      <div
        role="tablist"
        aria-label="날짜"
        className="mb-5 flex gap-2 overflow-x-auto"
      >
        {days.map((d, index) => {
          const active = d === activeDay
          return (
            <button
              key={d}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setDay(d)}
              className={`min-h-16 shrink-0 px-4 ${
                active ? 'bg-ink text-paper' : 'border border-line text-muted'
              }`}
            >
              <span className="block font-display text-xl leading-none">
                Day {index + 1}
              </span>
              <span className="mt-1 block text-xs">
                {formatDay(d)}
                {d === today && ' · 오늘'}
              </span>
            </button>
          )
        })}
      </div>

      {!loading && items.length === 0 && editing !== 'new' && (
        <p className="mb-5 text-muted">
          아직 비어 있습니다. 이날 할 일을 하나 넣어 보세요.
        </p>
      )}

      <div className="mb-4 flex flex-col gap-3">
        {items.map((item, index) =>
          editing === item.id ? (
            <ItineraryForm
              key={item.id}
              initial={itemDraftFrom(item)}
              places={places}
              submitLabel="저장"
              onSubmit={(draft) => update(item.id, draft)}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <ItineraryItemCard
              key={item.id}
              item={item}
              place={places.find((p) => p.id === item.place_id)}
              author={members.find((m) => m.id === item.created_by)}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onMoveUp={() => void move(item, -1)}
              onMoveDown={() => void move(item, 1)}
              onEdit={() => setEditing(item.id)}
              onDelete={() => void remove(item)}
            />
          ),
        )}
      </div>

      {items.length > 1 && (
        <button
          type="button"
          onClick={() => void persistOrder([...items].sort(byTime))}
          className="mb-4 w-full border border-line font-bold text-muted"
        >
          시간순으로 정리
        </button>
      )}

      {editing === 'new' ? (
        <ItineraryForm
          initial={emptyItem()}
          places={places}
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
          일정 추가
        </button>
      )}

      <button
        type="button"
        onClick={() => setEditingDates(true)}
        className="mt-6 w-full border border-line text-sm font-bold text-muted"
      >
        여행 날짜 고치기
      </button>
    </>
  )
}
