'use client'

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useEffect, useId, useState } from 'react'

import { useTrip } from '@/components/TripProvider'
import type { Database } from '@/lib/supabase/types'

type TableName = keyof Database['public']['Tables']

/** id 하나로 행을 식별할 수 있는 테이블만 이 훅을 쓴다. */
type IdentifiedTable = {
  [K in TableName]: Database['public']['Tables'][K]['Row'] extends {
    id: string
  }
    ? K
    : never
}[TableName]

type RowOf<T extends IdentifiedTable> = Database['public']['Tables'][T]['Row']

/**
 * 테이블 하나를 통째로 읽고 변경을 구독한다.
 *
 * 이 앱의 데이터는 여행 하나 분량이라 전체를 들고 있어도 부담이 없다.
 * 범위는 RLS가 자른다 — 멤버가 아니면 애초에 빈 결과가 온다.
 *
 * 순서가 중요하다. 구독을 먼저 걸고 그 다음에 스냅샷을 찍는다.
 * 반대로 하면 조회와 구독 사이에 들어온 행이 영구히 누락된다.
 * 스냅샷이 적용되기 전에 도착한 이벤트는 모아뒀다가 뒤에 흘려보낸다.
 *
 * 삭제 이벤트는 기본 REPLICA IDENTITY 때문에 기본키만 실려 온다.
 * 그래서 id를 가진 테이블에만 쓸 수 있다.
 */
export function useRealtimeTable<T extends IdentifiedTable>(
  table: T,
  compare: (a: RowOf<T>, b: RowOf<T>) => number,
) {
  const { supabase } = useTrip()
  // 같은 테이블을 두 화면이 함께 구독할 수 있다(일정표가 장소를 읽는 식).
  // 채널 이름이 겹치면 한쪽이 다른 쪽을 끊으므로 인스턴스마다 다르게 둔다.
  const instanceId = useId()
  const [rows, setRows] = useState<RowOf<T>[]>([])
  const [loading, setLoading] = useState(true)
  const [reconnectKey, setReconnectKey] = useState(0)

  // 폰이 잠들었다 깨면 웹소켓이 끊겨 있을 수 있다. 다시 붙고 새로 읽는다.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') {
        setReconnectKey((k) => k + 1)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    let active = true
    let snapshotApplied = false
    const pending: RealtimePostgresChangesPayload<RowOf<T>>[] = []

    function apply(payload: RealtimePostgresChangesPayload<RowOf<T>>) {
      setRows((prev) => {
        if (payload.eventType === 'DELETE') {
          const goneId = (payload.old as { id?: string }).id
          return prev.filter((r) => r.id !== goneId)
        }
        const row = payload.new as RowOf<T>
        return [...prev.filter((r) => r.id !== row.id), row].sort(compare)
      })
    }

    const channel = supabase
      .channel(`realtime:${table}:${instanceId}`)
      .on<RowOf<T>>(
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
        const { data } = await supabase.from(table).select('*')
        if (!active) return

        // 테이블명이 제네릭이면 postgrest가 행 타입을 좁히지 못한다.
        // 테이블은 IdentifiedTable로 이미 제한돼 있으므로 여기서 되돌린다.
        const snapshot = (data ?? []) as unknown as RowOf<T>[]
        setRows(snapshot.slice().sort(compare))

        // 스냅샷을 찍는 사이에 도착한 이벤트를 뒤늦게 반영한다
        pending.forEach(apply)
        pending.length = 0
        snapshotApplied = true
        setLoading(false)
      })()
    })

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
    // compare는 렌더마다 새 함수라 의존성에서 뺀다. 정렬 기준은 화면 수명 동안 고정이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, table, instanceId, reconnectKey])

  /** 서버 응답을 기다리지 않고 화면을 먼저 고친다. 실시간 이벤트가 곧 진실로 덮는다. */
  function applyLocal(next: (prev: RowOf<T>[]) => RowOf<T>[]) {
    setRows((prev) => next(prev).slice().sort(compare))
  }

  return { rows, loading, applyLocal }
}
