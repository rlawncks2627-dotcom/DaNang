'use client'

import { useState } from 'react'

import {
  ExpenseForm,
  emptyExpense,
  expenseDraftFrom,
  type ExpenseDraft,
} from '@/components/expense/ExpenseForm'
import { RateEditor } from '@/components/expense/RateEditor'
import { SettlementPanel } from '@/components/expense/SettlementPanel'
import { PageHeader } from '@/components/PageHeader'
import { useTrip } from '@/components/TripProvider'
import { formatDay } from '@/lib/days'
import { useExpenseShares } from '@/lib/hooks/useExpenseShares'
import { useRealtimeTable } from '@/lib/hooks/useRealtimeTable'
import { useSignedUrls } from '@/lib/hooks/useSignedUrls'
import {
  computeNets,
  formatKrw,
  formatVnd,
  krwToVnd,
  settle,
  vndToKrw,
} from '@/lib/money'
import { removePhotos, uploadPhoto } from '@/lib/photos'
import type { Expense } from '@/lib/supabase/types'
import { EXPENSE_CATEGORIES } from '@/lib/supabase/types'

const byNewest = (a: Expense, b: Expense) =>
  b.spent_at.localeCompare(a.spent_at) || b.created_at.localeCompare(a.created_at)

export default function ExpensesPage() {
  const { trip, members, me, supabase } = useTrip()
  const { rows, loading, applyLocal } = useRealtimeTable('expenses', byNewest)
  const { sharerIdsOf, replace } = useExpenseShares()

  const [editing, setEditing] = useState<'new' | string | null>(null)
  const [editingRate, setEditingRate] = useState(false)

  const rate = trip.base_rate_vnd_krw
  const memberIds = members.map((m) => m.id)

  const receiptUrls = useSignedUrls(
    rows.map((e) => e.receipt_url).filter((p): p is string => Boolean(p)),
  )

  const nets = computeNets(rows, sharerIdsOf, memberIds)
  const transfers = settle(nets)
  const total = rows.reduce((sum, e) => sum + (e.amount_krw ?? 0), 0)

  /** 넣은 통화를 기준으로 반대쪽 금액을 채운다. */
  function amounts(draft: ExpenseDraft) {
    const value = Number(draft.amount) || 0
    return draft.currency === 'vnd'
      ? { amount_vnd: value, amount_krw: vndToKrw(value, rate) }
      : { amount_vnd: krwToVnd(value, rate), amount_krw: value }
  }

  function toRow(draft: ExpenseDraft, receiptUrl: string | null) {
    return {
      title: draft.title.trim(),
      category: draft.category,
      paid_by: draft.paid_by,
      spent_at: draft.spent_at,
      memo: draft.memo.trim() || null,
      receipt_url: receiptUrl,
      ...amounts(draft),
    }
  }

  /** 새로 고른 영수증이 있으면 올리고, 그 경로를 쓴다. */
  async function resolveReceipt(draft: ExpenseDraft) {
    if (!draft.receiptFile) return draft.receiptPath
    return uploadPhoto(supabase, trip.id, draft.receiptFile)
  }

  async function create(draft: ExpenseDraft) {
    const receiptUrl = await resolveReceipt(draft)

    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...toRow(draft, receiptUrl), trip_id: trip.id })
      .select()
      .single()

    if (error || !data) {
      // 지출이 안 들어갔으면 방금 올린 영수증도 치운다
      if (receiptUrl && receiptUrl !== draft.receiptPath) {
        await removePhotos(supabase, [receiptUrl])
      }
      return
    }

    await replace(data.id, draft.sharerIds)
    setEditing(null)
  }

  async function update(id: string, draft: ExpenseDraft) {
    const previous = rows.find((e) => e.id === id)?.receipt_url ?? null
    const receiptUrl = await resolveReceipt(draft)

    await supabase.from('expenses').update(toRow(draft, receiptUrl)).eq('id', id)
    await replace(id, draft.sharerIds)

    // 바꾸거나 뺀 영수증은 저장공간에서도 없앤다
    if (previous && previous !== receiptUrl) {
      await removePhotos(supabase, [previous])
    }

    setEditing(null)
  }

  async function remove(expense: Expense) {
    applyLocal((prev) => prev.filter((e) => e.id !== expense.id))
    // expense_shares는 on delete cascade로 함께 사라진다
    await supabase.from('expenses').delete().eq('id', expense.id)
    if (expense.receipt_url) {
      await removePhotos(supabase, [expense.receipt_url])
    }
  }

  // 날짜별로 묶는다. rows는 이미 최신순이라 순서가 유지된다.
  const days = [...new Set(rows.map((e) => e.spent_at))]

  return (
    <>
      <PageHeader
        title="정산"
        subtitle={
          loading ? '불러오는 중…' : `${rows.length}건 · 모두 ${formatKrw(total)}`
        }
      />

      <div className="mb-6">
        <SettlementPanel transfers={transfers} nets={nets} members={members} />
      </div>

      {editingRate ? (
        <div className="mb-6">
          <RateEditor onDone={() => setEditingRate(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingRate(true)}
          className="mb-6 min-h-11 w-full border border-line text-sm font-bold text-muted"
        >
          환율 1,000₫ = {Math.round(rate * 1000 * 100) / 100}원 · 고치기
        </button>
      )}

      {editing === 'new' ? (
        <div className="mb-6">
          <ExpenseForm
            initial={emptyExpense(members, me)}
            members={members}
            rate={rate}
            submitLabel="추가"
            onSubmit={create}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="mb-6 w-full bg-signal font-bold text-white"
        >
          지출 추가
        </button>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-muted">
          쓴 돈을 넣어두면 여행이 끝나고 계산하지 않아도 됩니다.
        </p>
      )}

      {days.map((day) => {
        const dayExpenses = rows.filter((e) => e.spent_at === day)
        const dayTotal = dayExpenses.reduce(
          (sum, e) => sum + (e.amount_krw ?? 0),
          0,
        )

        return (
          <section key={day} className="mb-6">
            <h2 className="mb-2 flex items-baseline justify-between">
              <span className="font-bold">{formatDay(day)}</span>
              <span className="text-muted">{formatKrw(dayTotal)}</span>
            </h2>

            <ul className="flex flex-col gap-3">
              {dayExpenses.map((expense) => {
                if (editing === expense.id) {
                  return (
                    <li key={expense.id}>
                      <ExpenseForm
                        initial={expenseDraftFrom(
                          expense,
                          sharerIdsOf(expense.id),
                        )}
                        members={members}
                        rate={rate}
                        submitLabel="저장"
                        onSubmit={(draft) => update(expense.id, draft)}
                        onCancel={() => setEditing(null)}
                      />
                    </li>
                  )
                }

                const category = EXPENSE_CATEGORIES.find(
                  (c) => c.value === expense.category,
                )
                const payer = members.find((m) => m.id === expense.paid_by)
                const sharers = sharerIdsOf(expense.id)

                return (
                  <li
                    key={expense.id}
                    style={{ borderColor: payer?.color }}
                    className="border-l-4 bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-muted">
                          {category?.emoji} {category?.label}
                        </p>
                        <h3 className="mt-1 text-lg font-bold">
                          {expense.title}
                        </h3>
                        <p className="text-muted">
                          {payer?.emoji} {payer?.name}님이 냄
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-xl leading-none">
                          {formatKrw(expense.amount_krw ?? 0)}
                        </p>
                        {expense.amount_vnd != null && (
                          <p className="mt-1 text-sm text-muted">
                            {formatVnd(expense.amount_vnd)}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-muted">
                      {sharers.length === 0
                        ? '정산에서 빠짐'
                        : `${sharers.length}명이 나눔 · 1인 ${formatKrw(
                            (expense.amount_krw ?? 0) / sharers.length,
                          )}`}
                    </p>

                    {expense.memo && (
                      <p className="mt-1 text-muted">{expense.memo}</p>
                    )}

                    {expense.receipt_url && receiptUrls[expense.receipt_url] && (
                      <a
                        href={receiptUrls[expense.receipt_url]}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block"
                      >
                        {/* 서명 URL은 한 시간짜리라 next/image로 최적화할 수 없다 */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={receiptUrls[expense.receipt_url]}
                          alt="영수증"
                          loading="lazy"
                          className="h-20 w-20 border border-line object-cover"
                        />
                      </a>
                    )}

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(expense.id)}
                        className="min-h-11 flex-1 border border-line text-sm font-bold text-muted"
                      >
                        고치기
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(expense)}
                        className="min-h-11 flex-1 border border-line text-sm font-bold text-signal"
                      >
                        지우기
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </>
  )
}
