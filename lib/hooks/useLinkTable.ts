'use client'

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useEffect, useId, useState } from 'react'

import { useTrip } from '@/components/TripProvider'

/** 두 컬럼을 묶어 기본키로 쓰는 연결 테이블. */
type LinkTable = 'place_votes' | 'expense_shares'

/**
 * 복합 기본키 연결 테이블을 읽고 구독한다.
 *
 * useRealtimeTable은 id 하나로 행을 식별하는 테이블 전용이라 여기는 못 쓴다.
 * 삭제 이벤트에는 REPLICA IDENTITY대로 두 컬럼이 함께 실려 온다.
 *
 * 구독을 먼저 걸고 스냅샷을 뒤에 찍는 순서는 useRealtimeTable과 같다.
 * 반대로 하면 그 사이에 들어온 행이 영구히 누락된다.
 */
export function useLinkTable<Row extends Record<string, string>>(
  table: LinkTable,
  columns: string,
  keyOf: (row: Row) => string,
) {
  const { supabase } = useTrip()
  const instanceId = useId()
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    let active = true
    let snapshotApplied = false
    const pending: RealtimePostgresChangesPayload<Row>[] = []

    function apply(payload: RealtimePostgresChangesPayload<Row>) {
      setRows((prev) => {
        if (payload.eventType === 'DELETE') {
          const gone = payload.old as Row
          return prev.filter((r) => keyOf(r) !== keyOf(gone))
        }
        const row = payload.new as Row
        return [...prev.filter((r) => keyOf(r) !== keyOf(row)), row]
      })
    }

    const channel = supabase
      .channel(`realtime:${table}:${instanceId}`)
      .on<Row>(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          if (!active) return
          if (snapshotApplied) apply(payload)
          else pending.push(payload)
        },
      )

    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED' || !active) return

      void (async () => {
        const { data } = await supabase.from(table).select(columns)
        if (!active) return

        setRows((data ?? []) as unknown as Row[])
        pending.forEach(apply)
        pending.length = 0
        snapshotApplied = true
      })()
    })

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
    // keyOf는 렌더마다 새 함수라 의존성에서 뺀다. 키 규칙은 화면 수명 동안 고정이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, table, columns, instanceId])

  return { rows, setRows }
}
