'use client'

import { useState } from 'react'

import { BookingCard, EmergencyCard } from '@/components/booking/BookingCard'
import {
  BookingForm,
  draftFrom,
  emptyDraft,
  type BookingDraft,
} from '@/components/booking/BookingForm'
import { PageHeader } from '@/components/PageHeader'
import { useTrip } from '@/components/TripProvider'
import { useRealtimeTable } from '@/lib/hooks/useRealtimeTable'
import type { Booking } from '@/lib/supabase/types'

const byOrder = (a: Booking, b: Booking) =>
  a.sort_order - b.sort_order ||
  (a.starts_at ?? '').localeCompare(b.starts_at ?? '')

/** 폼 값을 DB 행으로 옮긴다. 빈 칸은 null로 둬야 화면에서 자리를 차지하지 않는다. */
function toRow(draft: BookingDraft) {
  const blankToNull = (v: string) => (v.trim() ? v.trim() : null)
  return {
    type: draft.type,
    title: draft.title.trim(),
    confirmation_no: blankToNull(draft.confirmation_no),
    starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
    address: blankToNull(draft.address),
    address_local: blankToNull(draft.address_local),
    phone: blankToNull(draft.phone),
    memo: blankToNull(draft.memo),
  }
}

export default function BookingsPage() {
  const { trip, supabase } = useTrip()
  const { rows, loading, applyLocal } = useRealtimeTable('bookings', byOrder)

  const [editing, setEditing] = useState<'new' | string | null>(null)

  const bookings = rows.filter((b) => !b.is_emergency)
  const emergencies = rows.filter((b) => b.is_emergency)

  async function create(draft: BookingDraft) {
    const lastOrder = bookings.at(-1)?.sort_order ?? 0
    await supabase
      .from('bookings')
      .insert({ ...toRow(draft), trip_id: trip.id, sort_order: lastOrder + 1 })
    setEditing(null)
  }

  async function update(id: string, draft: BookingDraft) {
    await supabase.from('bookings').update(toRow(draft)).eq('id', id)
    setEditing(null)
  }

  async function remove(booking: Booking) {
    applyLocal((prev) => prev.filter((b) => b.id !== booking.id))
    await supabase.from('bookings').delete().eq('id', booking.id)
  }

  return (
    <>
      <PageHeader
        title="예약정보"
        subtitle="급할 때 검색 없이 바로 찾는 것들"
      />

      {loading && <p className="text-muted">불러오는 중…</p>}

      {!loading && bookings.length === 0 && editing !== 'new' && (
        <p className="mb-5 text-muted">
          항공편과 숙소를 넣어두면 현지에서 찾아 헤매지 않습니다.
        </p>
      )}

      <div className="mb-6 flex flex-col gap-4">
        {bookings.map((booking) =>
          editing === booking.id ? (
            <BookingForm
              key={booking.id}
              initial={draftFrom(booking)}
              submitLabel="저장"
              onSubmit={(draft) => update(booking.id, draft)}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <BookingCard
              key={booking.id}
              booking={booking}
              onEdit={() => setEditing(booking.id)}
              onDelete={() => void remove(booking)}
            />
          ),
        )}
      </div>

      {editing === 'new' ? (
        <div className="mb-6">
          <BookingForm
            initial={emptyDraft()}
            submitLabel="추가"
            onSubmit={create}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="mb-8 w-full bg-signal font-bold text-white"
        >
          예약 추가
        </button>
      )}

      {emergencies.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold">비상 연락처</h2>
          <div className="flex flex-col gap-3">
            {emergencies.map((b) => (
              <EmergencyCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
