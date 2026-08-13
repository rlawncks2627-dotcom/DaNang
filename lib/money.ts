/**
 * 환율과 정산 계산.
 *
 * 정산의 기준 통화는 원이다. 동은 자릿수가 커서 나눗셈 오차가 눈에 띄고,
 * 결국 서로 계좌이체할 때 쓰는 단위도 원이기 때문이다.
 */

/** base_rate_vnd_krw는 1동이 몇 원인지를 담는다 (예: 0.055). */
export function vndToKrw(vnd: number, rate: number) {
  return Math.round(vnd * rate)
}

export function krwToVnd(krw: number, rate: number) {
  if (rate <= 0) return 0
  return Math.round(krw / rate)
}

export function formatKrw(krw: number) {
  return `${Math.round(krw).toLocaleString('ko-KR')}원`
}

export function formatVnd(vnd: number) {
  return `${Math.round(vnd).toLocaleString('ko-KR')}₫`
}

/**
 * 금액을 사람 수대로 쪼갠다.
 *
 * 나머지가 남으면 앞사람부터 1원씩 더 얹는다. 합이 총액과 정확히 맞아야
 * 정산 결과가 0으로 떨어진다 - 그냥 반올림하면 몇 원씩 새어나간다.
 */
export function splitEvenly(total: number, memberIds: string[]) {
  const shares = new Map<string, number>()
  if (memberIds.length === 0) return shares

  const rounded = Math.round(total)
  const base = Math.floor(rounded / memberIds.length)
  let remainder = rounded - base * memberIds.length

  for (const id of memberIds) {
    shares.set(id, base + (remainder > 0 ? 1 : 0))
    if (remainder > 0) remainder -= 1
  }

  return shares
}

export type ExpenseLike = {
  id: string
  amount_krw: number | null
  paid_by: string
}

/**
 * 사람별 수지를 낸다. 양수면 받을 돈, 음수면 낼 돈.
 *
 * 나눠 낼 사람이 지정되지 않은 지출은 정산에서 빼둔다. 실수로 비운 것을
 * 전원 분담으로 넘겨짚으면 엉뚱한 사람에게 돈을 물린다.
 */
export function computeNets(
  expenses: ExpenseLike[],
  sharerIdsOf: (expenseId: string) => string[],
  memberIds: string[],
) {
  const nets = new Map<string, number>(memberIds.map((id) => [id, 0]))

  for (const expense of expenses) {
    const amount = expense.amount_krw ?? 0
    const sharers = sharerIdsOf(expense.id).filter((id) => nets.has(id))
    if (amount === 0 || sharers.length === 0) continue

    nets.set(expense.paid_by, (nets.get(expense.paid_by) ?? 0) + Math.round(amount))

    for (const [id, owed] of splitEvenly(amount, sharers)) {
      nets.set(id, (nets.get(id) ?? 0) - owed)
    }
  }

  return nets
}

export type Transfer = { from: string; to: string; amount: number }

/**
 * 수지를 송금 목록으로 바꾼다.
 *
 * 가장 많이 낼 사람과 가장 많이 받을 사람을 계속 맞붙인다.
 * 세 명 규모에서는 이 방식이 최소 횟수를 준다.
 */
export function settle(nets: Map<string, number>): Transfer[] {
  const creditors = [...nets.entries()]
    .filter(([, net]) => net > 0)
    .map(([id, net]) => ({ id, amount: net }))
  const debtors = [...nets.entries()]
    .filter(([, net]) => net < 0)
    .map(([id, net]) => ({ id, amount: -net }))

  const transfers: Transfer[] = []

  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort((a, b) => b.amount - a.amount)
    debtors.sort((a, b) => b.amount - a.amount)

    const credit = creditors[0]
    const debt = debtors[0]
    const amount = Math.min(credit.amount, debt.amount)

    if (amount > 0) {
      transfers.push({ from: debt.id, to: credit.id, amount })
    }

    credit.amount -= amount
    debt.amount -= amount

    if (credit.amount === 0) creditors.shift()
    if (debt.amount === 0) debtors.shift()
  }

  return transfers
}
