'use client'

import { useState } from 'react'

import { todayLocal } from '@/lib/days'
import { formatKrw, formatVnd, krwToVnd, vndToKrw } from '@/lib/money'
import type { Expense, Member } from '@/lib/supabase/types'
import { EXPENSE_CATEGORIES } from '@/lib/supabase/types'

export type ExpenseDraft = {
  title: string
  category: string
  currency: 'vnd' | 'krw'
  amount: string
  paid_by: string
  sharerIds: string[]
  spent_at: string
  memo: string
}

export function emptyExpense(members: Member[], me: Member): ExpenseDraft {
  return {
    title: '',
    category: 'food',
    currency: 'vnd',
    amount: '',
    paid_by: me.id,
    // 기본은 전원 분담. 대부분의 지출이 그렇다.
    sharerIds: members.map((m) => m.id),
    spent_at: todayLocal(),
    memo: '',
  }
}

export function expenseDraftFrom(
  expense: Expense,
  sharerIds: string[],
): ExpenseDraft {
  return {
    title: expense.title,
    category: expense.category,
    // 넣을 때 쓴 통화를 그대로 되살린다
    currency: expense.amount_vnd ? 'vnd' : 'krw',
    amount: String(expense.amount_vnd ?? expense.amount_krw ?? ''),
    paid_by: expense.paid_by,
    sharerIds,
    spent_at: expense.spent_at,
    memo: expense.memo ?? '',
  }
}

export function ExpenseForm({
  initial,
  members,
  rate,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: ExpenseDraft
  members: Member[]
  rate: number
  submitLabel: string
  onSubmit: (draft: ExpenseDraft) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof ExpenseDraft>(key: K, value: ExpenseDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const amount = Number(draft.amount) || 0
  const converted =
    draft.currency === 'vnd'
      ? formatKrw(vndToKrw(amount, rate))
      : formatVnd(krwToVnd(amount, rate))

  function toggleSharer(id: string) {
    set(
      'sharerIds',
      draft.sharerIds.includes(id)
        ? draft.sharerIds.filter((s) => s !== id)
        : [...draft.sharerIds, id],
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.title.trim() || amount <= 0 || saving) return
    setSaving(true)
    await onSubmit(draft)
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="border-l-4 border-ink bg-card p-5">
      <label className="mb-4 block">
        <span className="mb-1 block font-bold">무엇에 썼나요</span>
        <input
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="예: 점심 반쎄오"
          className="min-h-14 w-full border border-line bg-paper px-4"
        />
      </label>

      <fieldset className="mb-4">
        <legend className="mb-2 font-bold">얼마</legend>
        <div className="mb-2 flex gap-2">
          {(['vnd', 'krw'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set('currency', c)}
              aria-pressed={draft.currency === c}
              className={`min-h-11 flex-1 font-bold ${
                draft.currency === c
                  ? 'bg-ink text-paper'
                  : 'border border-line text-muted'
              }`}
            >
              {c === 'vnd' ? '동 ₫' : '원 ₩'}
            </button>
          ))}
        </div>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={draft.amount}
          onChange={(e) => set('amount', e.target.value)}
          placeholder={draft.currency === 'vnd' ? '150000' : '8000'}
          className="min-h-14 w-full border border-line bg-paper px-4 text-xl font-bold"
        />
        {amount > 0 && (
          <p className="mt-2 text-muted">= 약 {converted}</p>
        )}
      </fieldset>

      <fieldset className="mb-4">
        <legend className="mb-2 font-bold">종류</legend>
        <div className="flex flex-wrap gap-2">
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => set('category', c.value)}
              aria-pressed={draft.category === c.value}
              className={`min-h-11 px-4 font-bold ${
                draft.category === c.value
                  ? 'bg-ink text-paper'
                  : 'border border-line text-muted'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-4">
        <legend className="mb-2 font-bold">누가 냈나요</legend>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => set('paid_by', m.id)}
              aria-pressed={draft.paid_by === m.id}
              style={{
                backgroundColor: draft.paid_by === m.id ? m.color : undefined,
              }}
              className={`min-h-12 px-4 font-bold ${
                draft.paid_by === m.id
                  ? 'text-white'
                  : 'border border-line text-muted'
              }`}
            >
              {m.emoji} {m.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-4">
        <legend className="mb-2 font-bold">누가 나눠 내나요</legend>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const on = draft.sharerIds.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleSharer(m.id)}
                aria-pressed={on}
                className={`min-h-12 px-4 font-bold ${
                  on ? 'bg-jade text-white' : 'border border-line text-muted'
                }`}
              >
                {on ? '✓ ' : ''}
                {m.emoji} {m.name}
              </button>
            )
          })}
        </div>
        {draft.sharerIds.length === 0 && (
          <p className="mt-2 text-signal">
            아무도 고르지 않으면 이 지출은 정산에서 빠집니다.
          </p>
        )}
      </fieldset>

      <label className="mb-4 block">
        <span className="mb-1 block font-bold">언제</span>
        <input
          type="date"
          value={draft.spent_at}
          onChange={(e) => set('spent_at', e.target.value)}
          className="min-h-14 w-full border border-line bg-paper px-4"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block font-bold">메모</span>
        <input
          value={draft.memo}
          onChange={(e) => set('memo', e.target.value)}
          className="min-h-14 w-full border border-line bg-paper px-4"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!draft.title.trim() || amount <= 0 || saving}
          className="flex-1 bg-signal font-bold text-white disabled:opacity-40"
        >
          {saving ? '저장 중…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-line font-bold text-muted"
        >
          그만두기
        </button>
      </div>
    </form>
  )
}
