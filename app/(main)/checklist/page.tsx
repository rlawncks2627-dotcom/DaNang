'use client'

import { useState } from 'react'

import { PageHeader } from '@/components/PageHeader'
import { useTrip } from '@/components/TripProvider'
import { useRealtimeTable } from '@/lib/hooks/useRealtimeTable'
import type { ChecklistItem } from '@/lib/supabase/types'

const byOrder = (a: ChecklistItem, b: ChecklistItem) =>
  a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)

export default function ChecklistPage() {
  const { trip, members, me, supabase } = useTrip()
  const { rows, loading, applyLocal } = useRealtimeTable('checklists', byOrder)

  // null이면 공용 목록
  const [tab, setTab] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [tidying, setTidying] = useState(false)

  const visible = rows.filter((r) => r.owner_id === tab)
  const doneCount = rows.filter((r) => r.is_done).length

  async function toggle(item: ChecklistItem) {
    const next = !item.is_done
    applyLocal((prev) =>
      prev.map((r) =>
        r.id === item.id
          ? {
              ...r,
              is_done: next,
              done_by: next ? me.id : null,
              done_at: next ? new Date().toISOString() : null,
            }
          : r,
      ),
    )

    await supabase
      .from('checklists')
      .update({
        is_done: next,
        done_by: next ? me.id : null,
        done_at: next ? new Date().toISOString() : null,
      })
      .eq('id', item.id)
  }

  async function add() {
    const title = draft.trim()
    if (!title) return
    setDraft('')

    const lastOrder = visible.at(-1)?.sort_order ?? 0

    await supabase.from('checklists').insert({
      trip_id: trip.id,
      owner_id: tab,
      title,
      sort_order: lastOrder + 1,
    })
  }

  async function remove(item: ChecklistItem) {
    applyLocal((prev) => prev.filter((r) => r.id !== item.id))
    await supabase.from('checklists').delete().eq('id', item.id)
  }

  const tabs = [
    { id: null as string | null, label: '공용' },
    ...members.map((m) => ({ id: m.id, label: m.name })),
  ]

  return (
    <>
      <PageHeader
        title="준비물"
        subtitle={loading ? '불러오는 중…' : `${doneCount} / ${rows.length}개 챙김`}
      />

      <div
        role="tablist"
        aria-label="준비물 묶음"
        className="mb-5 flex gap-2 overflow-x-auto"
      >
        {tabs.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id ?? 'common'}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(t.id)}
              className={`min-h-11 shrink-0 px-4 font-bold ${
                active ? 'bg-ink text-paper' : 'border border-line text-muted'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {!loading && visible.length === 0 && (
        <p className="mb-5 text-muted">
          아직 없습니다. 아래에서 챙길 것을 적어 보세요.
        </p>
      )}

      <ul className="mb-6 flex flex-col gap-2">
        {visible.map((item) => {
          const checker = members.find((m) => m.id === item.done_by)

          return (
            <li key={item.id} className="flex items-stretch gap-2">
              {/* 줄 전체가 체크 버튼이다. 작은 네모를 정확히 누를 필요가 없다 */}
              <button
                type="button"
                onClick={() => void toggle(item)}
                aria-pressed={item.is_done}
                style={{ borderColor: item.is_done ? checker?.color : undefined }}
                className={`flex flex-1 items-center gap-4 border-l-4 px-4 py-3 text-left ${
                  item.is_done
                    ? 'border-jade bg-card text-muted'
                    : 'border-line bg-card'
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-7 w-7 shrink-0 place-items-center border-2 text-sm ${
                    item.is_done
                      ? 'border-jade bg-jade text-white'
                      : 'border-muted'
                  }`}
                >
                  {item.is_done ? '✓' : ''}
                </span>
                <span className={item.is_done ? 'line-through' : 'font-medium'}>
                  {item.title}
                </span>
                {checker && item.is_done && (
                  <span className="ml-auto shrink-0 text-sm">
                    {checker.emoji}
                  </span>
                )}
              </button>

              {tidying && (
                <button
                  type="button"
                  onClick={() => void remove(item)}
                  aria-label={`${item.title} 지우기`}
                  className="min-h-0 w-12 shrink-0 border border-line text-signal"
                >
                  ✕
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void add()
        }}
        className="mb-4 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="챙길 것 적기"
          aria-label="챙길 것 적기"
          className="min-h-14 flex-1 border border-line bg-card px-4"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="shrink-0 bg-signal px-5 font-bold text-white disabled:opacity-40"
        >
          추가
        </button>
      </form>

      {visible.length > 0 && (
        <button
          type="button"
          onClick={() => setTidying((v) => !v)}
          className="w-full border border-line font-bold text-muted"
        >
          {tidying ? '정리 끝내기' : '목록 정리하기'}
        </button>
      )}
    </>
  )
}
