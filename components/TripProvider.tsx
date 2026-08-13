'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Member, Trip } from '@/lib/supabase/types'
import { JOIN_PATH } from '@/lib/trip'

import { MissingEnvScreen } from './MissingEnvScreen'
import { Wordmark } from './Wordmark'

/** createClient는 설정이 없으면 null을 주므로, 여기서 null을 벗겨낸다. */
type SupabaseClient = NonNullable<ReturnType<typeof createClient>>

type TripContextValue = {
  trip: Trip
  members: Member[]
  /** 지금 이 기기에서 로그인한 사람 */
  me: Member
  supabase: SupabaseClient
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

  // 설정이 없으면 클라이언트를 만들지 않는다. 만들다 예외가 나면
  // 빌드가 프리렌더 단계에서 통째로 깨진다.
  const supabase = useMemo(() => createClient(), [])

  const [state, setState] = useState<State>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    // 지역 상수로 받아야 아래 함수 안에서도 null이 아님이 유지된다
    const client = supabase
    if (!client) return

    // 화면을 떠난 뒤 도착한 응답은 버린다
    let active = true

    // 화살표 함수로 둔다. 호이스팅되는 함수 선언 안으로는 null 좁히기가 전파되지 않는다.
    const load = async () => {
      const {
        data: { session },
      } = await client.auth.getSession()
      if (!active) return

      if (!session) {
        router.replace(JOIN_PATH)
        return
      }

      // RLS가 멤버 아닌 사람에게 빈 결과를 준다. 별도 권한 검사가 필요 없다.
      const [{ data: trips }, { data: members }] = await Promise.all([
        client.from('trips').select('*').limit(1),
        client.from('members').select('*').order('sort_order'),
      ])
      if (!active) return

      const trip = trips?.[0]
      const me = members?.find((m) => m.user_id === session.user.id)

      if (!trip || !members || !me) {
        router.replace(JOIN_PATH)
        return
      }

      setState({ status: 'ready', trip, members, me })
    }

    void load()

    return () => {
      active = false
    }
  }, [router, supabase, reloadKey])

  if (!isSupabaseConfigured || !supabase) {
    return <MissingEnvScreen />
  }

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
