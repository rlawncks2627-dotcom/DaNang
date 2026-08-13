'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Wordmark } from '@/components/Wordmark'

/**
 * 초대 코드 없이 도착한 사람이 보는 화면.
 *
 * 여기서 코드를 알려주지 않는 것이 요점이다. 코드는 카톡으로 보낸 링크에만
 * 있고, 앱은 코드를 들고 있지 않다.
 */
export default function JoinLandingPage() {
  const router = useRouter()
  const [code, setCode] = useState('')

  function go(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed) router.push(`/join/${encodeURIComponent(trimmed)}`)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <Wordmark size="lg" />

      <p className="mt-6 text-lg">초대 링크로 들어와 주세요.</p>
      <p className="mt-2 text-muted">
        가족에게 받은 링크를 누르면 바로 들어옵니다. 따로 가입하거나 비밀번호를
        넣을 일은 없습니다.
      </p>

      <form onSubmit={go} className="mt-8 border-l-4 border-line bg-card p-5">
        <label className="block">
          <span className="mb-1 block font-bold">초대 코드를 아신다면</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="링크 끝에 붙어 있는 글자"
            aria-label="초대 코드"
            autoCapitalize="characters"
            className="min-h-14 w-full border border-line bg-paper px-4"
          />
        </label>
        <button
          type="submit"
          disabled={!code.trim()}
          className="mt-3 w-full bg-signal font-bold text-white disabled:opacity-40"
        >
          들어가기
        </button>
      </form>
    </main>
  )
}
