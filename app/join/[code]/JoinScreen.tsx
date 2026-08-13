'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Wordmark } from '@/components/Wordmark'
import { createClient } from '@/lib/supabase/client'
import type { MemberSlot } from '@/lib/supabase/types'

type Screen =
  | { step: 'preparing' }
  | { step: 'choose'; slots: MemberSlot[] }
  | { step: 'claiming'; slots: MemberSlot[]; pickedId: string }
  | { step: 'error'; message: string }

/**
 * 가입 화면.
 *
 * 비밀번호가 없다. 링크를 열면 익명 로그인이 자동으로 돌고,
 * 이름을 한 번 고르면 그 계정이 멤버 자리에 묶인다.
 * 익명 로그인은 role=authenticated JWT를 주므로 이후는 RLS가 전부 처리한다.
 */
export function JoinScreen() {
  const router = useRouter()
  const params = useParams<{ code: string }>()
  const code = params.code
  const supabase = useMemo(() => createClient(), [])

  const [screen, setScreen] = useState<Screen>({ step: 'preparing' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true

    async function prepare() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!active) return

      if (!session) {
        const { error } = await supabase.auth.signInAnonymously()
        if (!active) return
        if (error) {
          setScreen({
            step: 'error',
            message:
              'Supabase 대시보드에서 익명 로그인(Anonymous sign-ins)을 켜야 합니다.',
          })
          return
        }
      }

      // 이미 자리를 가진 사람이면 고르는 화면을 건너뛴다 (재방문·기기 복귀)
      const { data: mine } = await supabase.from('members').select('id').limit(1)
      if (!active) return
      if (mine && mine.length > 0) {
        router.replace('/')
        return
      }

      const { data: slots, error } = await supabase.rpc('list_member_slots', {
        p_code: code,
      })
      if (!active) return

      if (error || !slots?.length) {
        setScreen({
          step: 'error',
          message: '초대 링크가 올바르지 않습니다. 링크를 다시 확인해 주세요.',
        })
        return
      }

      setScreen({ step: 'choose', slots })
    }

    void prepare()

    return () => {
      active = false
    }
  }, [code, router, supabase, attempt])

  async function pick(slot: MemberSlot) {
    if (screen.step !== 'choose') return
    setScreen({ step: 'claiming', slots: screen.slots, pickedId: slot.id })

    const { error } = await supabase.rpc('claim_member', {
      p_code: code,
      p_member_id: slot.id,
    })

    if (error) {
      setScreen({
        step: 'error',
        message: error.message.includes('이미')
          ? '이미 다른 사람이 선택한 자리입니다.'
          : '들어가지 못했습니다. 잠시 후 다시 시도해 주세요.',
      })
      return
    }

    router.replace('/')
  }

  function retry() {
    setScreen({ step: 'preparing' })
    setAttempt((n) => n + 1)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <header className="mb-10">
        <Wordmark size="lg" />
        <p className="mt-4 text-lg text-muted">
          {screen.step === 'choose' || screen.step === 'claiming'
            ? '누구세요? 한 번만 고르면 됩니다.'
            : '준비하는 중입니다.'}
        </p>
      </header>

      {screen.step === 'preparing' && (
        <p className="text-muted" role="status">
          잠시만요…
        </p>
      )}

      {screen.step === 'error' && (
        <div className="border-l-4 border-signal bg-card p-5">
          <p className="font-bold">들어가지 못했습니다</p>
          <p className="mt-2 text-muted">{screen.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-5 w-full bg-ink px-5 font-bold text-paper"
          >
            다시 시도
          </button>
        </div>
      )}

      {(screen.step === 'choose' || screen.step === 'claiming') && (
        <ul className="flex flex-col gap-4">
          {screen.slots.map((slot) => {
            const busy = screen.step === 'claiming'
            const picked = busy && screen.pickedId === slot.id

            return (
              <li key={slot.id}>
                {/*
                  명패. 이 앱에서 색면을 가장 크게 쓰는 유일한 자리다.
                  여기서 고른 색이 그 사람의 표식이 되어 나머지 화면에서 반복된다.
                */}
                <button
                  type="button"
                  disabled={busy || slot.is_taken}
                  onClick={() => void pick(slot)}
                  style={{
                    backgroundColor: slot.is_taken ? undefined : slot.color,
                  }}
                  className={`flex w-full items-center gap-5 px-6 py-5 text-left ${
                    slot.is_taken
                      ? 'cursor-not-allowed border border-line bg-card text-muted'
                      : 'text-white'
                  } ${busy && !picked ? 'opacity-40' : ''}`}
                >
                  <span aria-hidden className="text-4xl">
                    {slot.emoji}
                  </span>
                  <span className="font-display text-3xl leading-none">
                    {slot.name}
                  </span>
                  <span className="ml-auto text-sm font-bold">
                    {slot.is_taken ? '선택됨' : picked ? '들어가는 중…' : ''}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
