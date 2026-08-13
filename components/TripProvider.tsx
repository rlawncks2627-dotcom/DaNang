'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { Member, Trip } from '@/lib/supabase/types'
import { joinPath } from '@/lib/trip'

import { Wordmark } from './Wordmark'

type TripContextValue = {
  trip: Trip
  members: Member[]
  /** 지금 이 기기에서 로그인한 사람 */
  me: Member
  supabase: ReturnType<typeof createClient>
  refresh: () => void
}

const TripContext = createContext<TripContextValue | null>(null)

export function useTrip() {
  const value = useContext(TripContext)
  if (!value) throw new Error('useTrip은 TripProvider 안에서만 쓸 수 있다')
  return value
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; trip: Trip; members: Member[]; me: Member }

/**
 * 여행 데이터를 한 번 읽어 하위 화면에 넘긴다.
 *
 * 멤버가 아니면 (세션이 없거나, RLS가 막아 아무것도 안 보이면)
 * 가입 화면으로 돌려보낸다. 이것이 앱 전체의 유일한 접근 검사다.
 */
export function TripProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [state, setState] = useState<State>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    // 화면을 떠난 뒤 도착한 응답은 버린다
    let active = true

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!active) return

      if (!session) {
        router.replace(joinPath)
        return
      }

      // RLS가 멤버 아닌 사람에게 빈 결과를 준다. 별도 권한 검사가 필요 없다.
      const [{ data: trips }, { data: members }] = await Promise.all([
        supabase.from('trips').select('*').limit(1),
        supabase.from('members').select('*').order('sort_order'),
      ])
      if (!active) return

      const trip = trips?.[0]
      const me = members?.find((m) => m.user_id === session.user.id)

      if (!trip || !members || !me) {
        router.replace(joinPath)
        return
      }

      setState({ status: 'ready', trip, members, me })
    }

    void load()

    return () => {
      active = false
    }
  }, [router, supabase, reloadKey])

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
        <Wordmark />
        <p className="text-muted" role="status">
          불러오는 중…
        </p>
      </div>
    )
  }

  return (
    <TripContext.Provider
      value={{
        trip: state.trip,
        members: state.members,
        me: state.me,
        supabase,
        refresh: () => setReloadKey((k) => k + 1),
      }}
    >
      {children}
    </TripContext.Provider>
  )
}
