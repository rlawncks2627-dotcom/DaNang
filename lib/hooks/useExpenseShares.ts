'use client'

import { useTrip } from '@/components/TripProvider'

import { useLinkTable } from './useLinkTable'

type Share = { expense_id: string; member_id: string }

const keyOf = (s: Share) => `${s.expense_id}:${s.member_id}`

/** 어떤 지출을 누가 나눠 내는지. 행이 없는 지출은 정산에서 빠진다. */
export function useExpenseShares() {
  const { supabase } = useTrip()
  const { rows: shares, setRows: setShares } = useLinkTable<Share>(
    'expense_shares',
    'expense_id, member_id',
    keyOf,
  )

  function sharerIdsOf(expenseId: string) {
    return shares
      .filter((s) => s.expense_id === expenseId)
      .map((s) => s.member_id)
  }

  /** 한 지출의 분담자를 통째로 바꾼다. 지우고 다시 넣는 편이 어긋날 여지가 적다. */
  async function replace(expenseId: string, memberIds: string[]) {
    setShares((prev) => [
      ...prev.filter((s) => s.expense_id !== expenseId),
      ...memberIds.map((member_id) => ({ expense_id: expenseId, member_id })),
    ])

    await supabase.from('expense_shares').delete().eq('expense_id', expenseId)

    if (memberIds.length > 0) {
      await supabase.from('expense_shares').insert(
        memberIds.map((member_id) => ({ expense_id: expenseId, member_id })),
      )
    }
  }

  return { sharerIdsOf, replace }
}
