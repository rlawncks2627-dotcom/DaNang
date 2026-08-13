'use client'

import { useTrip } from '@/components/TripProvider'

import { useLinkTable } from './useLinkTable'

type Vote = { place_id: string; member_id: string }

const keyOf = (v: Vote) => `${v.place_id}:${v.member_id}`

/** 하트 투표. */
export function usePlaceVotes() {
  const { supabase, me } = useTrip()
  const { rows: votes, setRows: setVotes } = useLinkTable<Vote>(
    'place_votes',
    'place_id, member_id',
    keyOf,
  )

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
