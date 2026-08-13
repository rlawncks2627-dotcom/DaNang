'use client'

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

import { useTrip } from '@/components/TripProvider'

type Vote = { place_id: string; member_id: string }

const keyOf = (v: Vote) => `${v.place_id}:${v.member_id}`

/**
 * 하트 투표.
 *
 * place_votes는 기본키가 (place_id, member_id) 복합이라 useRealtimeTable을
 * 쓸 수 없다. 삭제 이벤트에는 REPLICA IDENTITY대로 두 컬럼이 함께 실려 온다.
 *
 * 구독을 먼저 걸고 스냅샷을 뒤에 찍는 순서는 useRealtimeTable과 같다.
 */
export function usePlaceVotes() {
  const { supabase, me } = useTrip()
  const [votes, setVotes] = useState<Vote[]>([])

  useEffect(() => {
    let active = true
    let snapshotApplied = false
    const pending: RealtimePostgresChangesPayload<Vote>[] = []

    function apply(payload: RealtimePostgresChangesPayload<Vote>) {
      setVotes((prev) => {
        if (payload.eventType === 'DELETE') {
          const gone = payload.old as Vote
          return prev.filter((v) => keyOf(v) !== keyOf(gone))
        }
        const row = payload.new as Vote
        return [...prev.filter((v) => keyOf(v) !== keyOf(row)), row]
      })
    }

    const channel = supabase
      .channel('realtime:place_votes')
      .on<Vote>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'place_votes' },
        (payload) => {
          if (!active) return
          if (snapshotApplied) apply(payload)
          else pending.push(payload)
        },
      )

    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED' || !active) return

      void (async () => {
        const { data } = await supabase
          .from('place_votes')
          .select('place_id, member_id')
        if (!active) return

        setVotes(data ?? [])
        pending.forEach(apply)
        pending.length = 0
        snapshotApplied = true
      })()
    })

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [supabase])

  function votersOf(placeId: string) {
    return votes.filter((v) => v.place_id === placeId).map((v) => v.member_id)
  }

  function countOf(placeId: string) {
    return votes.filter((v) => v.place_id === placeId).length
  }

  async function toggle(placeId: string) {
    const mine = votes.some(
      (v) => v.place_id === placeId && v.member_id === me.id,
    )

    // 화면을 먼저 고친다. 실시간 이벤트가 곧 진실로 덮는다.
    setVotes((prev) =>
      mine
        ? prev.filter((v) => !(v.place_id === placeId && v.member_id === me.id))
        : [...prev, { place_id: placeId, member_id: me.id }],
    )

    if (mine) {
      await supabase
        .from('place_votes')
        .delete()
        .eq('place_id', placeId)
        .eq('member_id', me.id)
    } else {
      await supabase
        .from('place_votes')
        .insert({ place_id: placeId, member_id: me.id })
    }
  }

  return { votersOf, countOf, toggle }
}
