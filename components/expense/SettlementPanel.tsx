'use client'

import { formatKrw, type Transfer } from '@/lib/money'
import type { Member } from '@/lib/supabase/types'

/**
 * 정산 결과.
 *
 * 이 화면이 존재하는 이유가 여기 한 줄이다. 그래서 큰 글씨를 여기에 쓴다.
 */
export function SettlementPanel({
  transfers,
  nets,
  members,
}: {
  transfers: Transfer[]
  nets: Map<string, number>
  members: Member[]
}) {
  const nameOf = (id: string) => {
    const m = members.find((x) => x.id === id)
    return m ? `${m.emoji} ${m.name}` : '알 수 없음'
  }

  if (transfers.length === 0) {
    return (
      <div className="border-l-4 border-jade bg-card p-5">
        <p className="font-bold">정산할 게 없습니다</p>
        <p className="mt-2 text-muted">
          아직 지출이 없거나, 이미 딱 맞게 나눠 냈습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="border-l-4 border-jade bg-card p-5">
      <p className="mb-4 font-bold">이렇게 보내면 끝납니다</p>

      <ul className="flex flex-col gap-3">
        {transfers.map((t) => (
          <li key={`${t.from}-${t.to}`}>
            <p className="text-muted">
              {nameOf(t.from)} → {nameOf(t.to)}
            </p>
            <p className="font-display text-3xl leading-none text-signal">
              {formatKrw(t.amount)}
            </p>
          </li>
        ))}
      </ul>

      <details className="mt-5">
        <summary className="min-h-11 cursor-pointer font-bold text-muted">
          사람별로 자세히 보기
        </summary>
        <ul className="mt-3 flex flex-col gap-2">
          {members.map((m) => {
            const net = nets.get(m.id) ?? 0
            return (
              <li key={m.id} className="flex items-center justify-between">
                <span>
                  {m.emoji} {m.name}
                </span>
                <span
                  className={`font-bold ${net > 0 ? 'text-jade' : net < 0 ? 'text-signal' : 'text-muted'}`}
                >
                  {net > 0 && `${formatKrw(net)} 받을 돈`}
                  {net < 0 && `${formatKrw(-net)} 낼 돈`}
                  {net === 0 && '없음'}
                </span>
              </li>
            )
          })}
        </ul>
      </details>
    </div>
  )
}
