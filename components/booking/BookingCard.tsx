'use client'

import { CopyButton } from '@/components/CopyButton'
import type { Booking } from '@/lib/supabase/types'
import { BOOKING_TYPES } from '@/lib/supabase/types'

function formatWhen(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

export function BookingCard({
  booking,
  onEdit,
  onDelete,
}: {
  booking: Booking
  onEdit: () => void
  onDelete: () => void
}) {
  const type = BOOKING_TYPES.find((t) => t.value === booking.type)
  const when = formatWhen(booking.starts_at)

  return (
    <article className="border-l-4 border-jade bg-card p-5">
      <p className="text-sm font-bold text-muted">
        {type?.emoji} {type?.label}
      </p>
      <h3 className="mt-1 text-xl font-bold">{booking.title}</h3>
      {when && <p className="mt-1 text-muted">{when}</p>}

      {booking.confirmation_no && (
        <div className="mt-4 flex items-center gap-2">
          <p className="flex-1">
            <span className="block text-sm text-muted">예약번호</span>
            <span className="font-bold">{booking.confirmation_no}</span>
          </p>
          <CopyButton value={booking.confirmation_no} label="복사" />
        </div>
      )}

      {booking.address && (
        <div className="mt-4 flex items-center gap-2">
          <p className="flex-1">
            <span className="block text-sm text-muted">주소</span>
            <span>{booking.address}</span>
          </p>
          <CopyButton value={booking.address} label="복사" />
        </div>
      )}

      {/* 택시에서 화면째로 보여주는 자리라 크게 둔다 */}
      {booking.address_local && (
        <div className="mt-4 flex items-center gap-2 bg-paper p-3">
          <p className="flex-1">
            <span className="block text-sm text-muted">기사님께 보여주기</span>
            <span className="text-lg font-bold">{booking.address_local}</span>
          </p>
          <CopyButton value={booking.address_local} label="복사" />
        </div>
      )}

      {booking.phone && (
        <p className="mt-4">
          <span className="block text-sm text-muted">연락처</span>
          <a href={`tel:${booking.phone}`} className="font-bold underline">
            {booking.phone}
          </a>
        </p>
      )}

      {booking.memo && <p className="mt-4 text-muted">{booking.memo}</p>}

      <div className="mt-5 flex gap-2">
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

/** 비상 연락처. 예약이 아니므로 고치지도 지우지도 않고 맨 아래 고정한다. */
export function EmergencyCard({ booking }: { booking: Booking }) {
  return (
    <article className="border-l-4 border-signal bg-card p-5">
      <h3 className="font-bold">{booking.title}</h3>
      {booking.phone && (
        <p className="mt-2 text-lg font-bold">
          {booking.phone.includes('/') ? (
            booking.phone
          ) : (
            <a href={`tel:${booking.phone}`} className="underline">
              {booking.phone}
            </a>
          )}
        </p>
      )}
      {booking.memo && <p className="mt-2 text-sm text-muted">{booking.memo}</p>}
    </article>
  )
}
